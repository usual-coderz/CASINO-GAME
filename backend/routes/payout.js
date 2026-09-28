const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const { debit, credit } = require('../services/wallet');
const blade = require('../services/bladepay');

// ---- Withdraw → UPI payout ----
router.post('/withdraw', auth, async (req, res) => {
  try {
    const { upiId, name, phone } = req.body;
    const amount = parseFloat(req.body.amount);

    if (!upiId || !name || !amount || amount < 100) {
      return res.json({ success: false, message: 'Invalid details (min ₹100)' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.json({ success: false, message: 'User not found' });
    if (user.balance < amount) return res.json({ success: false, message: 'Insufficient balance' });

    const merchantOrderNo = blade.newOrderId('RV-WD');
    const tx = await Transaction.create({
      userId: user._id, orderId: merchantOrderNo, type: 'withdraw', amount, status: 'PENDING'
    });

    let data;
    try {
      data = await blade.createPayout({
        merchantOrderNo, amount, upiId, name, phone: phone || user.phone
      });
    } catch (e) {
      tx.status = 'FAILED'; tx.meta = { error: e.response?.data || e.message }; await tx.save();
      console.error('Payout HTTP error:', e.response?.status, e.response?.data || e.message);
      return res.json({ success: false, message: 'Payout gateway unreachable' });
    }

    console.log('BladePay payout raw:', JSON.stringify(data));

    const ok = data?.code === 'SUCCESS' || data?.success === true;
    if (!ok) {
      tx.status = 'FAILED'; tx.meta = { raw: data }; await tx.save();
      return res.json({ success: false, message: data?.msg || data?.message || 'Payout failed' });
    }

    // atomic deduct
    const updated = await debit(req.userId, amount);
    if (!updated) {
      tx.status = 'FAILED'; await tx.save();
      return res.json({ success: false, message: 'Insufficient balance' });
    }

    tx.status = 'INITIATED';
    tx.gatewayRef = data?.data?.orderNo || '';
    tx.meta = { raw: data };
    await tx.save();

    res.json({ success: true, orderId: merchantOrderNo, newBalance: updated.balance });
  } catch (e) {
    console.error('Withdraw error:', e);
    res.json({ success: false, message: 'Withdrawal failed' });
  }
});

// ---- Payout webhook: FAILED pe refund ----
router.post('/webhook', async (req, res) => {
  try {
    const secret = process.env.BLADEPAY_WEBHOOK_SECRET;
    if (secret) {
      const received = req.headers['x-bladepay-signature'] || req.headers['x-signature'] || '';
      const raw = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
      const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
      const a = Buffer.from(String(received));
      const b = Buffer.from(expected);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return res.status(401).json({ success: false });
      }
    }

    const { merchantOrderNo, status } = req.body;
    console.log('Payout webhook:', { merchantOrderNo, status });

    const tx = await Transaction.findOne({ orderId: merchantOrderNo });
    if (!tx) return res.json({ success: true });
    if (tx.status === 'SUCCESS' || tx.status === 'FAILED') return res.json({ success: true });

    const st = String(status || '').toUpperCase();

    if (st === 'SUCCESS') {
      tx.status = 'SUCCESS'; tx.settledAt = new Date(); await tx.save();
    } else if (['FAILED', 'REJECTED'].includes(st)) {
      tx.status = 'FAILED'; await tx.save();
      await credit(tx.userId, tx.amount);   // refund
      console.log(`Refunded ₹${tx.amount} → ${tx.userId}`);
    }

    res.json({ success: true });
  } catch (e) {
    console.error('Payout webhook error:', e);
    res.status(500).json({ success: false });
  }
});

module.exports = router;