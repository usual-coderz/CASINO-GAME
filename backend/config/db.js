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
    const indexes = await db.collection('users').indexes();

    const oldUsernameIndex = indexes.find(
      index => index.name === 'username_1'
    );

    if (oldUsernameIndex) {
      await db.collection('users').dropIndex('username_1');
      console.log('Removed old username_1 index');
    }
  } catch (error) {
    console.error('Index cleanup error:', error.message);
  }
};