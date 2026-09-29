const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const { credit } = require('../services/wallet');
const blade = require('../services/bladepay');

// ---- Create Deposit Order ----
router.post('/create', auth, async (req, res) => {
  try {
    const amount = parseFloat(req.body.amount);
    
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }
    
    if (amount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum deposit is ₹100' });
    }
    
    if (amount > 100000) {
      return res.status(400).json({ success: false, message: 'Maximum deposit is ₹1,00,000' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Ensure user has required fields
    if (!user.name || !user.phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please complete your profile (name and phone required)' 
      });
    }

    const merchantOrderNo = blade.newOrderId('RV-DEP');
    
    const tx = await Transaction.create({
      userId: user._id,
      orderId: merchantOrderNo,
      type: 'deposit',
      amount: amount,
      currency: 'INR',
      status: 'PENDING',
      createdAt: new Date()
    });

    let gatewayResponse;
    try {
      gatewayResponse = await blade.createPayin({ 
        merchantOrderNo, 
        amount, 
        user 
      });
    } catch (e) {
      tx.status = 'FAILED';
      tx.meta = { 
        error: e.response?.data || e.message,
        timestamp: new Date()
      };
      await tx.save();
      
      console.error('Payin gateway error:', {
        status: e.response?.status,
        data: e.response?.data,
        message: e.message
      });
      
      return res.status(502).json({ 
        success: false, 
        message: 'Payment gateway temporarily unavailable. Please try again in a few moments.' 
      });
    }

    console.log('BladePay response:', JSON.stringify(gatewayResponse, null, 2));

    const responseData = gatewayResponse?.data || gatewayResponse || {};
    
    // Try multiple possible URL fields
    const cashierUrl = responseData.cashierUrl 
      || responseData.cashierURL 
      || responseData.payUrl 
      || responseData.url
      || responseData.paymentUrl;

    if (!cashierUrl) {
      tx.status = 'FAILED';
      tx.meta = { 
        raw: gatewayResponse,
        error: 'No cashier URL in response'
      };
      await tx.save();
      
      return res.status(502).json({ 
        success: false, 
        message: responseData.msg || 'Payment gateway error: No checkout URL received' 
      });
    }

    tx.status = 'INITIATED';
    tx.gatewayRef = responseData.orderNo || responseData.orderId || responseData.transactionId || '';
    tx.meta = { 
      raw: gatewayResponse,
      cashierUrl: cashierUrl
    };
    await tx.save();

    res.json({ 
      success: true, 
      cashierUrl: cashierUrl,
      orderId: merchantOrderNo,
      amount: amount
    });
    
  } catch (e) {
    console.error('Payin create error:', e);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error. Please try again.' 
    });
  }
});

// ---- Webhook: Process Payment Notification ----
router.post('/webhook', async (req, res) => {
  try {
    // Verify signature if secret is configured
    const secret = process.env.BLADEPAY_WEBHOOK_SECRET;
    if (secret) {
      const received = req.headers['x-bladepay-signature'] 
        || req.headers['x-signature'] 
        || req.headers['X-Bladepay-Signature']
        || '';
      
      // Get raw body (requires express.raw() middleware setup)
      const raw = req.rawBody 
        ? req.rawBody.toString('utf8') 
        : JSON.stringify(req.body);
      
      const expected = crypto
        .createHmac('sha256', secret)
        .update(raw)
        .digest('hex');
      
      const receivedBuf = Buffer.from(String(received));
      const expectedBuf = Buffer.from(expected);
      
      if (receivedBuf.length !== expectedBuf.length || 
          !crypto.timingSafeEqual(receivedBuf, expectedBuf)) {
        console.warn('Payin webhook: Invalid signature');
        return res.status(401).json({ success: false, message: 'Invalid signature' });
      }
    }

    const { merchantOrderNo, orderNo, status, amount } = req.body;
    
    console.log('Payin webhook received:', { 
      merchantOrderNo, 
      orderNo, 
      status,
      amount,
      timestamp: new Date().toISOString()
    });

    if (!merchantOrderNo) {
      return res.status(400).json({ success: false, message: 'Missing order reference' });
    }

    const tx = await Transaction.findOne({ orderId: merchantOrderNo });
    
    if (!tx) {
      console.warn('Payin webhook: Unknown order', merchantOrderNo);
      return res.json({ success: true }); // Ack to stop retries
    }
    
    // Idempotent - already processed
    if (tx.status === 'SUCCESS') {
      console.log('Payin webhook: Already processed', merchantOrderNo);
      return res.json({ success: true });
    }

    const statusUpper = String(status || '').toUpperCase();

    // Success states
    if (['SUCCESS', 'PAID', 'COMPLETED', 'SUCCESSFUL'].includes(statusUpper)) {
      // Verify amount matches (optional security check)
      if (amount && parseFloat(amount) !== tx.amount) {
        console.warn('Amount mismatch:', { expected: tx.amount, received: amount });
      }

      tx.status = 'SUCCESS';
      tx.gatewayRef = orderNo || tx.gatewayRef;
      tx.settledAt = new Date();
      tx.meta = { 
        ...tx.meta, 
        webhook: req.body,
        settledAt: new Date()
      };
      await tx.save();

      // Credit user wallet
      try {
        await credit(tx.userId, tx.amount);
        console.log(`✅ Credited ₹${tx.amount} to user ${tx.userId}`);
      } catch (creditError) {
        console.error('Failed to credit wallet:', creditError);
        // Don't fail the webhook - transaction is marked success, credit may need manual fix
      }
      
    } else if (['FAILED', 'EXPIRED', 'CANCELLED', 'DECLINED'].includes(statusUpper)) {
      tx.status = 'FAILED';
      tx.meta = { 
        ...tx.meta, 
        webhook: req.body,
        failedAt: new Date()
      };
      await tx.save();
      console.log(`❌ Payment failed for order ${merchantOrderNo}: ${statusUpper}`);
      
    } else {
      // Pending or unknown status - just log
      console.log('Payin webhook: Status pending/unknown', statusUpper);
      tx.meta = { 
        ...tx.meta, 
        webhook: req.body,
        lastStatus: statusUpper
      };
      await tx.save();
    }

    res.json({ success: true });
    
  } catch (e) {
    console.error('Payin webhook error:', e);
    res.status(500).json({ success: false, message: 'Webhook processing error' });
  }
});

// ---- Get Deposit Status ----
router.get('/status/:orderId', auth, async (req, res) => {
  try {
    const tx = await Transaction.findOne({ 
      orderId: req.params.orderId,
      userId: req.userId
    });
    
    if (!tx) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    res.json({ 
      success: true, 
      status: tx.status,
      amount: tx.amount,
      orderId: tx.orderId,
      createdAt: tx.createdAt,
      settledAt: tx.settledAt
    });
    
  } catch (e) {
    console.error('Status check error:', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;