const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify token
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

// Get balance
router.get('/balance', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        res.json({ success: true, balance: user.balance });
    } catch (error) {
        res.json({ success: false, message: 'Failed to get balance' });
    }
});

// Deposit (mock - integrate with actual payment gateway)
router.post('/deposit', auth, async (req, res) => {
    try {
        const { amount } = req.body;
        
        // Here you would integrate with your payment gateway
        // For now, return success with payment URL
        
        res.json({
            success: true,
            message: 'Deposit initiated',
            paymentUrl: `/payment?amount=${amount}`
        });
    } catch (error) {
        res.json({ success: false, message: 'Deposit failed' });
    }
});

// Get transactions (mock)
router.get('/transactions', auth, async (req, res) => {
    // Return mock transactions - implement with actual transaction model
    res.json({
        success: true,
        transactions: [
            { type: 'credit', amount: 1000, date: new Date() },
            { type: 'debit', amount: 500, date: new Date(Date.now() - 86400000) }
        ]
    });
});

module.exports = router;