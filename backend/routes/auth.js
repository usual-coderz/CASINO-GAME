const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const publicUser = (u) => ({
  id: u._id, name: u.name, email: u.email,
  casinoName: u.casinoName, casinoId: u.casinoId,
  phone: u.phone, balance: u.balance
});

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password, casinoName, casinoId } = req.body;
    if (!name || !email || !phone || !password || !casinoName || !casinoId) {
      return res.json({ success: false, message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.json({ success: false, message: 'Password min 6 characters' });
    }

    const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { casinoName }, { casinoId }] });
    if (exists) return res.json({ success: false, message: 'Email or casino name already exists' });

    const user = await User.create({ name, email, phone, password, casinoName, casinoId });

    res.json({ success: true, token: signToken(user._id), user: publicUser(user) });
  } catch (e) {
    console.error('Signup error:', e);
    res.json({ success: false, message: 'Registration failed' });
  }
});

// LOGIN (email ya casinoId se)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ $or: [{ email: (email || '').toLowerCase() }, { casinoId: email }] });
    if (!user) return res.json({ success: false, message: 'User not found' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.json({ success: false, message: 'Invalid password' });

    res.json({ success: true, token: signToken(user._id), user: publicUser(user) });
  } catch (e) {
    console.error('Login error:', e);
    res.json({ success: false, message: 'Login failed' });
  }
});

module.exports = router;