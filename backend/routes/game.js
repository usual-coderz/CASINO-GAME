const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');
const Bet = require('../models/Bet');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const { debit, credit, round2 } = require('../services/wallet');

const MIN_BET = 10;
const MAX_BET = 10000;
const HOUSE_EDGE = 0.02;   // 2%

/**
 * Win probability nikalta hai direction + target se.
 * over  → roll > target  → chance = (100 - target)/100
 * under → roll < target  → chance = (target - 1)/100
 */
function chanceFor(direction, target) {
  return direction === 'over' ? (100 - target) / 100 : (target - 1) / 100;
}

// ---- DICE ROLL ----
router.post('/dice/roll', auth, async (req, res) => {
  try {
    const betAmount = parseFloat(req.body.betAmount);
    const direction = req.body.direction === 'under' ? 'under' : 'over';
    const target = parseInt(req.body.target, 10);

    if (!betAmount || betAmount < MIN_BET || betAmount > MAX_BET) {
      return res.json({ success: false, message: `Bet must be ₹${MIN_BET} - ₹${MAX_BET}` });
    }
    if (!(target >= 2 && target <= 98)) {
      return res.json({ success: false, message: 'Target must be between 2 and 98' });
    }

    const chance = chanceFor(direction, target);
    const multiplier = round2((1 - HOUSE_EDGE) / chance);

    // 1) bet pehle atomic debit — race/double-spend block
    const afterDebit = await debit(req.userId, betAmount);
    if (!afterDebit) {
      return res.json({ success: false, message: 'Insufficient balance' });
    }

    // 2) server-side roll (crypto random)
    const roll = crypto.randomInt(1, 101);      // 1..100 inclusive

    const won = direction === 'over' ? roll > target : roll < target;
    const payout = won ? round2(betAmount * multiplier) : 0;
    const profit = round2(payout - betAmount);

    // 3) jeeta to credit
    let balance = afterDebit.balance;
    if (won) {
      const afterWin = await credit(req.userId, payout);
      balance = afterWin.balance;
    }

    // 4) log
    await Bet.create({
      userId: req.userId, game: 'dice', betAmount, direction, target,
      roll, multiplier, payout, profit, won
    });

    await Transaction.create({
      userId: req.userId,
      orderId: `BET-${Date.now()}-${crypto.randomInt(1000, 9999)}`,
      type: won ? 'win' : 'bet',
      amount: won ? payout : betAmount,
      status: 'SUCCESS',
      settledAt: new Date(),
      meta: { game: 'dice', roll, target, direction, multiplier }
    });

    res.json({
      success: true,
      roll, won, multiplier, payout, profit, balance, target, direction
    });
  } catch (e) {
    console.error('Dice roll error:', e);
    res.json({ success: false, message: 'Game error' });
  }
});

// ---- HISTORY ----
router.get('/history', auth, async (req, res) => {
  const bets = await Bet.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(20);
  res.json({ success: true, bets });
});

module.exports = router;