const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

// Balance
router.get('/balance', auth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.json({ success: false });
  res.json({ success: true, balance: user.balance });
});

// Transactions
router.get('/transactions', auth, async (req, res) => {
  const txs = await Transaction.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(20);
  res.json({
    success: true,
    transactions: txs.map(t => ({
      type: t.type, amount: t.amount, status: t.status, date: t.createdAt
    }))
  });
});

module.exports = router;