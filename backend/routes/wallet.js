const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const BLADEPAY_PAYIN_API = process.env.BLADEPAY_PAYIN_API;
const BLADEPAY_KEY = process.env.BLADEPAY_KEY;

const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'Access denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

router.get('/balance', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        res.json({ success: true, balance: user.balance });
    } catch (error) {
        res.json({ success: false, message: 'Failed to get balance' });
    }
});

router.post('/deposit', auth, async (req, res) => {
    try {
        const value = Number(req.body.amount);

        if (!value || value < 100) {
            return res.json({ success: false, message: 'Minimum deposit is \u20b9100' });
        }

        const merchantOrderNo = `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        await Transaction.create({
            userId: req.userId,
            type: 'deposit',
            amount: value,
            status: 'PENDING',
            merchantOrderNo
        });

        const { data } = await axios.post(BLADEPAY_PAYIN_API, {
            merchantOrderNo,
            version: 'V3',
            amount: value.toFixed(2),
            notifyUrl: `${process.env.BASE_URL}/api/wallet/deposit/webhook`,
            returnUrl: `${process.env.BASE_URL}/?order=${merchantOrderNo}`
        }, {
            headers: { 'Authorization': `Bearer ${BLADEPAY_KEY}` }
        });

        if (data.code !== 'SUCCESS') {
            await Transaction.updateOne({ merchantOrderNo }, { status: 'FAILED' });
            return res.json({ success: false, message: data.msg || 'Deposit failed' });
        }

        const paymentUrl = data.data?.payUrl || data.data?.url || data.data?.paymentUrl;

        res.json({ success: true, orderId: merchantOrderNo, paymentUrl });
    } catch (error) {
        console.error('Deposit error:', error.response?.data || error.message);
        res.json({ success: false, message: 'Deposit failed' });
    }
});

router.post('/deposit/webhook', async (req, res) => {
    try {
        const { merchantOrderNo, status } = req.body;

        const tx = await Transaction.findOne({ merchantOrderNo });
        if (!tx || tx.status !== 'PENDING') {
            return res.json({ success: true });
        }

        if (status === 'SUCCESS') {
            tx.status = 'SUCCESS';
            await User.findByIdAndUpdate(tx.userId, { $inc: { balance: tx.amount } });
        } else if (status === 'FAILED') {
            tx.status = 'FAILED';
        }

        await tx.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Deposit webhook error:', error);
        res.status(500).json({ success: false });
    }
});

router.get('/transactions', auth, async (req, res) => {
    try {
        const txs = await Transaction.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50);
        res.json({ success: true, transactions: txs });
    } catch (error) {
        res.json({ success: false, transactions: [] });
    }
});

module.exports = router;