const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Determine frontend path (works for both local and Heroku)
const frontendPath = path.join(__dirname, '../frontend');
console.log('Serving frontend from:', frontendPath);

// Serve static files
app.use(express.static(frontendPath));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/payout', require('./routes/payout'));

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Catch-all route for SPA (single page application)
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// MongoDB Connection - remove deprecated options
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/casino')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});