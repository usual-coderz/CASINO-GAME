const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const { credit } = require('../services/wallet');
const blade = require('../services/bladepay');

// ---- Deposit start → cashierUrl ----
router.post('/create', auth, async (req, res) => {
  try {
    const amount = parseFloat(req.body.amount);
    if (!amount || amount < 100) {
      return res.json({ success: false, message: 'Minimum deposit is ₹100' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.json({ success: false, message: 'User not found' });

    const merchantOrderNo = blade.newOrderId('RV-DEP');
    const tx = await Transaction.create({
      userId: user._id, orderId: merchantOrderNo, type: 'deposit', amount, status: 'PENDING'
    });

    let data;
    try {
      data = await blade.createPayin({ merchantOrderNo, amount, user });
    } catch (e) {
      tx.status = 'FAILED';
      tx.meta = { error: e.response?.data || e.message };
      await tx.save();
      console.error('Payin HTTP error:', e.response?.status, e.response?.data || e.message);
      return res.json({ success: false, message: 'Payment gateway unreachable. Try again.' });
    }

    console.log('BladePay payin raw:', JSON.stringify(data));

    const d = data?.data || {};
    const cashierUrl = d.cashierUrl || d.cashierURL || d.payUrl || d.url;

    if (!cashierUrl) {
      tx.status = 'FAILED'; tx.meta = { raw: data }; await tx.save();
      return res.json({ success: false, message: data?.msg || 'No cashier URL returned' });
    }

    tx.status = 'INITIATED';
    tx.gatewayRef = d.orderNo || d.orderId || '';
    tx.meta = { raw: data };
    await tx.save();

    res.json({ success: true, cashierUrl, orderId: merchantOrderNo });
  } catch (e) {
    console.error('Payin create error:', e);
    res.json({ success: false, message: 'Deposit initiation failed' });
  }
});

// ---- Webhook: YAHI balance credit hota hai ----
router.post('/webhook', async (req, res) => {
  try {
    // signature check
    const secret = process.env.BLADEPAY_WEBHOOK_SECRET;
    if (secret) {
      const received = req.headers['x-bladepay-signature'] || req.headers['x-signature'] || '';
      const raw = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body);
      const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
      const a = Buffer.from(String(received));
      const b = Buffer.from(expected);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        console.warn('Payin webhook: bad signature');
        return res.status(401).json({ success: false });
      }
    }

    const { merchantOrderNo, orderNo, status } = req.body;
    console.log('Payin webhook:', { merchantOrderNo, orderNo, status });

    const tx = await Transaction.findOne({ orderId: merchantOrderNo });
    if (!tx) return res.json({ success: true });          // unknown → ack
    if (tx.status === 'SUCCESS') return res.json({ success: true }); // idempotent

    const st = String(status || '').toUpperCase();

    if (['SUCCESS', 'PAID', 'COMPLETED'].includes(st)) {
      tx.status = 'SUCCESS';
      tx.gatewayRef = orderNo || tx.gatewayRef;
      tx.settledAt = new Date();
      await tx.save();
      await credit(tx.userId, tx.amount);
      console.log(`Credited ₹${tx.amount} → ${tx.userId}`);
    } else if (['FAILED', 'EXPIRED', 'CANCELLED'].includes(st)) {
      tx.status = 'FAILED';
      await tx.save();
    }

    res.json({ success: true });
  } catch (e) {
    console.error('Payin webhook error:', e);
    res.status(500).json({ success: false });
  }
});

module.exports = router;