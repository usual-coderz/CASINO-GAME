const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  game:       { type: String, default: 'dice' },
  betAmount:  { type: Number, required: true },
  direction:  { type: String, enum: ['over', 'under'], required: true },
  target:     { type: Number, required: true },
  roll:       { type: Number, required: true },
  multiplier: { type: Number, required: true },
  payout:     { type: Number, required: true },   // total return (0 if loss)
  profit:     { type: Number, required: true },   // payout - betAmount
  won:        { type: Boolean, required: true },
  seed:       { type: String },
  createdAt:  { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bet', betSchema);