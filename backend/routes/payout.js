const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const BLADEPAY_API = process.env.BLADEPAY_PAYOUT_API || 'https://api.bladepay.pro/merchant/api/payout/create';
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

router.post('/withdraw', auth, async (req, res) => {
    try {
        const { upiId, name, amount, phone } = req.body;
        const value = Number(amount);

        if (!upiId || !name || !value) {
            return res.json({ success: false, message: 'Please fill all fields' });
        }
        if (value < 100) {
            return res.json({ success: false, message: 'Minimum withdrawal is \u20b9100' });
        }

        const user = await User.findOneAndUpdate(
            { _id: req.userId, balance: { $gte: value } },
            { $inc: { balance: -value } },
            { new: true }
        );

        if (!user) {
            return res.json({ success: false, message: 'Insufficient balance' });
        }

        const merchantOrderNo = `RV-WD-${Date.now()}`;

        await Transaction.create({
            userId: req.userId,
            type: 'withdraw',
            amount: value,
            status: 'PENDING',
            merchantOrderNo
        });

        try {
            const response = await axios.post(BLADEPAY_API, {
                merchantOrderNo,
                version: 'V3',
                amount: value.toFixed(2),
                cashNumber: upiId,
                cashName: name,
                cashPhone: phone,
                notifyUrl: `${process.env.BASE_URL}/api/payout/webhook`
            }, {
                headers: { 'Authorization': `Bearer ${BLADEPAY_KEY}` }
            });

            if (response.data.code === 'SUCCESS') {
                return res.json({
                    success: true,
                    message: 'Withdrawal initiated',
                    orderId: merchantOrderNo,
                    newBalance: user.balance
                });
            }

            await User.findByIdAndUpdate(req.userId, { $inc: { balance: value } });
            await Transaction.updateOne({ merchantOrderNo }, { status: 'FAILED' });

            return res.json({ success: false, message: response.data.msg || 'Payout failed' });
        } catch (err) {
            await User.findByIdAndUpdate(req.userId, { $inc: { balance: value } });
            await Transaction.updateOne({ merchantOrderNo }, { status: 'FAILED' });
            throw err;
        }
    } catch (error) {
        console.error('Withdrawal error:', error.response?.data || error.message);
        res.json({ success: false, message: 'Withdrawal failed' });
    }
});

router.post('/webhook', async (req, res) => {
    try {
        const { merchantOrderNo, status } = req.body;

        const tx = await Transaction.findOne({ merchantOrderNo });
        if (!tx || tx.status !== 'PENDING') {
            return res.json({ success: true });
        }

        if (status === 'SUCCESS') {
            tx.status = 'SUCCESS';
        } else if (status === 'FAILED') {
            tx.status = 'FAILED';
            await User.findByIdAndUpdate(tx.userId, { $inc: { balance: tx.amount } });
        }

        await tx.save();
        res.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ success: false });
    }
});

module.exports = router;