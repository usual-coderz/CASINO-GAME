const mongoose = require('mongoose');

module.exports = async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is missing');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000
  });

  console.log('MongoDB Connected');

  try {
    const db = mongoose.connection.db;

    const users = await db.collection('users').indexes();

    if (users.some(index => index.name === 'username_1')) {
      await db.collection('users').dropIndex('username_1');
      console.log('Removed old username_1 index');
    }

    const transactions = await db.collection('transactions').indexes();

    if (transactions.some(index => index.name === 'merchantOrderNo_1')) {
      await db.collection('transactions').dropIndex('merchantOrderNo_1');
      console.log('Removed old merchantOrderNo_1 index');
    }
  } catch (error) {
    console.error('Index cleanup error:', error.message);
  }
};