const User = require('../models/User');

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Atomic debit — balance >= amount ho tabhi katega.
 * null return = insufficient balance ya race lose.
 */
async function debit(userId, amount) {
  return User.findOneAndUpdate(
    { _id: userId, balance: { $gte: amount } },
    { $inc: { balance: -round2(amount) } },
    { new: true }
  );
}

async function credit(userId, amount) {
  return User.findOneAndUpdate(
    { _id: userId },
    { $inc: { balance: round2(amount) } },
    { new: true }
  );
}

module.exports = { debit, credit, round2 };