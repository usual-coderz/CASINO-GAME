const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:      { type: String, required: true },
  password:   { type: String, required: true },
  casinoName: { type: String, required: true, unique: true },
  casinoId:   { type: String, required: true, unique: true },
  balance:    { type: Number, default: 0, min: 0 },
  createdAt:  { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('User', userSchema);