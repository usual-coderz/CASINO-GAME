const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/signup', async (req, res) => {
    try {
        const { name, email, phone, password, casinoName, casinoId } = req.body;

        const existingUser = await User.findOne({
            $or: [{ email }, { casinoName }, { casinoId }]
        });

        if (existingUser) {
            return res.json({ success: false, message: 'Email or casino name already exists' });
        }

        const user = new User({
            name,
            email,
            phone,
            password,
            casinoName,
            casinoId,
            balance: 0
        });

        await user.save();

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                casinoName: user.casinoName,
                casinoId: user.casinoId,
                balance: user.balance
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.json({ success: false, message: 'Registration failed' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ $or: [{ email }, { casinoId: email }] });

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid password' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                casinoName: user.casinoName,
                casinoId: user.casinoId,
                balance: user.balance
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.json({ success: false, message: 'Login failed' });
    }
});

module.exports = router;