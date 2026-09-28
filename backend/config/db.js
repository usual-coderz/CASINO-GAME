const mongoose = require('mongoose');

module.exports = async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/royalvegas', {
      serverSelectionTimeoutMS: 10000
    });
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB Error:', err.message);
    process.exit(1);
  }
};