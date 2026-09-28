const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const frontendPath = path.join(__dirname, '../frontend');
console.log('Serving frontend from:', frontendPath);

app.use(express.static(frontendPath));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/payout', require('./routes/payout'));

app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Error:', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});