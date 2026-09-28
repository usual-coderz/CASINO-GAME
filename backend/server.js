const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());

// raw body preserve karo (webhook signature verification ke liye)
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// ---- API ----
app.use('/api/auth',   require('./routes/auth'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/payin',  require('./routes/payin'));
app.use('/api/payout', require('./routes/payout'));
app.use('/api/game',   require('./routes/game'));

// ---- Pages ----
app.get('/', (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));
app.get('/payment-success', (req, res) => res.sendFile(path.join(frontendPath, 'payment-success.html')));

// SPA fallback — /api ko chhodo
app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(frontendPath, 'index.html')));

// error handlers
process.on('unhandledRejection', (e) => console.error('Unhandled rejection:', e));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));