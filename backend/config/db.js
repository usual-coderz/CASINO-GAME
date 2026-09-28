const mongoose = require('mongoose');

module.exports = async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://nexacoders2_db_user:dxYh7QOdHvH6OVdd@cluster0.f4qxcbk.mongodb.net/?appName=Cluster0', {
      serverSelectionTimeoutMS: 10000
    });
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB Error:', err.message);
    process.exit(1);
  }
};