const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const BLADEPAY_API = 'https://api.bladepay.pro/merchant/api/payout/create';
const BLADEPAY_KEY = 'gw_8c2c7aed2861daf80574db85f5254c5ccaa85069dcaf9e6c8d81811316b71ef9';

// Middleware
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, message: 'Access denied' });
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Withdraw via UPI using BladePay
router.post('/withdraw', auth, async (req, res) => {
    try {
        const { upiId, name, amount, phone } = req.body;
        
        // Get user
        const user = await User.findById(req.userId);
        
        // Check balance
        if (user.balance < amount) {
            return res.json({ success: false, message: 'Insufficient balance' });
        }
        
        // Generate unique order number
        const merchantOrderNo = `RV-WD-${Date.now()}`;
        
        // Call BladePay API
        const response = await axios.post(BLADEPAY_API, {
            merchantOrderNo: merchantOrderNo,
            version: 'V3',
            amount: amount.toFixed(2),
            cashNumber: upiId,
            cashName: name,
            cashPhone: phone,
            notifyUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/api/payout/webhook`
        }, {
            headers: { 'Authorization': `Bearer ${BLADEPAY_KEY}` }
        });
        
        if (response.data.code === 'SUCCESS') {
            // Deduct balance
            user.balance -= amount;
            await user.save();
            
            res.json({
                success: true,
                message: 'Withdrawal initiated',
                orderId: merchantOrderNo,
                newBalance: user.balance
            });
        } else {
            res.json({ 
                success: false, 
                message: response.data.msg || 'Payout failed' 
            });
        }
        
    } catch (error) {
        console.error('Withdrawal error:', error.response?.data || error.message);
        res.json({ success: false, message: 'Withdrawal failed' });
    }
});

// Webhook for payout status updates
router.post('/webhook', async (req, res) => {
    try {
        const { merchantOrderNo, status, amount } = req.body;
        
        console.log('Payout webhook received:', { merchantOrderNo, status, amount });
        
        // Handle status updates
        // SUCCESS - Payout completed
        // FAILED - Payout failed (refund user)
        // PENDING - Payout pending
        
        res.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ success: false });
    }
});

module.exports = router;