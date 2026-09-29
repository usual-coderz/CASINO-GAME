const axios = require('axios');

const BASE_URL = (process.env.BASE_URL || 'https://casinogame-c34130ca80b6.herokuapp.com').replace(/\/+$/, '');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${process.env.BLADEPAY_KEY}`
});

function newOrderId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

async function createPayin({ merchantOrderNo, amount, user }) {
  const { data } = await axios.post(
    process.env.BLADEPAY_PAYIN_URL || 'https://api.bladepay.pro/merchant/api/payin/create',
    {
      merchantOrderNo,
      amount: Number(amount).toFixed(2),
      currency: 'INR',
      payinName: user.name,
      payinPhone: user.phone,
      payinEmail: user.email,
      notifyUrl: `${BASE_URL}/api/payin/webhook`,
      returnUrl: `${BASE_URL}/payment-success?order=${merchantOrderNo}`
    },
    { headers: authHeaders(), timeout: 20000 }
  );
  return data;
}

async function createPayout({ merchantOrderNo, amount, upiId, name, phone }) {
  const { data } = await axios.post(
    process.env.BLADEPAY_PAYOUT_URL || 'https://api.bladepay.pro/merchant/api/payout/create',
    {
      merchantOrderNo,
      version: 'V3',
      amount: Number(amount).toFixed(2),
      cashNumber: upiId,
      cashName: name,
      cashPhone: phone,
      notifyUrl: `${BASE_URL}/api/payout/webhook`
    },
    { headers: authHeaders(), timeout: 20000 }
  );
  return data;
}

module.exports = { createPayin, createPayout, newOrderId, BASE_URL };