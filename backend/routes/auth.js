const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');

function signToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    casinoName: user.casinoName,
    casinoId: user.casinoId,
    phone: user.phone,
    balance: user.balance
  };
}

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

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanCasinoName = casinoName.trim();
    const cleanCasinoId = casinoId.trim();

    const existingUser = await User.findOne({
      $or: [
        { email: cleanEmail },
        { casinoName: cleanCasinoName },
        { casinoId: cleanCasinoId }
      ]
    });

    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }

      if (existingUser.casinoName === cleanCasinoName) {
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
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      password,
      casinoName: cleanCasinoName,
      casinoId: cleanCasinoId
    });

    const token = signToken(user._id);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: publicUser(user)
    });

  } catch (error) {
    console.error('Signup error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];

      const messages = {
        email: 'Email already registered',
        casinoName: 'Casino name already exists',
        casinoId: 'Casino ID already exists'
      };

      return res.status(409).json({
        success: false,
        message: messages[field] || 'Account already exists'
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email or Player ID and password are required'
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

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    const token = signToken(user._id);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: publicUser(user)
    });

  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
});

module.exports = router;