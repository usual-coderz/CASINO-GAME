const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');

const signToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  casinoName: u.casinoName,
  casinoId: u.casinoId,
  phone: u.phone,
  balance: u.balance
});

router.post('/signup', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      casinoName,
      casinoId
    } = req.body;

    if (!name || !email || !phone || !password || !casinoName || !casinoId) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCasinoName = casinoName.trim();
    const normalizedCasinoId = casinoId.trim();

    const exists = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { casinoName: normalizedCasinoName },
        { casinoId: normalizedCasinoId }
      ]
    });

    if (exists) {
      if (exists.email === normalizedEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      if (exists.casinoName === normalizedCasinoName) {
        return res.status(409).json({
          success: false,
          message: 'Casino name already exists'
        });
      }

      return res.status(409).json({
        success: false,
        message: 'Casino ID already exists'
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password,
      casinoName: normalizedCasinoName,
      casinoId: normalizedCasinoId
    });

    const token = signToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: publicUser(user)
    });

  } catch (e) {
    console.error('Signup error:', e);

    if (e.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Email, casino name, or casino ID already exists'
      });
    }

    return res.status(500).json({
      success: false,
      message: e.message || 'Registration failed'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/Player ID and password are required'
      });
    }

    const loginValue = email.trim();

    const user = await User.findOne({
      $or: [
        { email: loginValue.toLowerCase() },
        { casinoId: loginValue }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    const token = signToken(user._id);

    return res.json({
      success: true,
      token,
      user: publicUser(user)
    });

  } catch (e) {
    console.error('Login error:', e);

    return res.status(500).json({
      success: false,
      message: e.message || 'Login failed'
    });
  }
});

module.exports = router;