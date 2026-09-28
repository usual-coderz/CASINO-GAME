const mongoose = require('mongoose');

module.exports = async function connectDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not configured');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });

    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB Error:', err.message);
    process.exit(1);
  }
};