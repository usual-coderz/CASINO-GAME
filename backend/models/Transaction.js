const mongoose = require('mongoose');

const txSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  orderId:   { type: String, required: true, unique: true, index: true },
  type:      { type: String, enum: ['deposit', 'withdraw', 'bet', 'win'], required: true },
  amount:    { type: Number, required: true },
  status:    { type: String, enum: ['PENDING', 'INITIATED', 'SUCCESS', 'FAILED'], default: 'PENDING' },
  gatewayRef:{ type: String },
  meta:      { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  settledAt: { type: Date }
});

module.exports = mongoose.model('Transaction', txSchema);