const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

const frontendPath = path.join(__dirname, '../frontend');

app.use(express.static(frontendPath));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/payin', require('./routes/payin'));
app.use('/api/payout', require('./routes/payout'));
app.use('/api/game', require('./routes/game'));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/payment-success', (req, res) => {
  res.sendFile(path.join(frontendPath, 'payment-success.html'));
});

app.get(/^\/(?!api\/).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

process.on('unhandledRejection', error => {
  console.error('Unhandled rejection:', error);
});

async function startServer() {
  try {
    await connectDB();

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
}

startServer();