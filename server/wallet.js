/**
 * VIRTUAL WALLET SYSTEM
 * Server-side balance management with full audit ledger
 * 
 * NOTE: This is a VIRTUAL wallet for demo purposes.
 * Real money requires licensed gambling infrastructure.
 */

const { v4: uuidv4 } = require('uuid');

class WalletSystem {
  constructor(config) {
    this.config = config;
    this.balances = new Map();      // playerId -> balance
    this.ledgers = new Map();       // playerId -> [entries]
  }

  /**
   * Get or create player balance
   */
  getBalance(playerId) {
    if (!this.balances.has(playerId)) {
      this.balances.set(playerId, this.config.STARTING_BALANCE);
      this.ledgers.set(playerId, []);
    }
    return this.balances.get(playerId);
  }

  /**
   * Debit player account (place bet)
   * @returns {object} Transaction result
   */
  debit(playerId, amount, roundId, reason = 'BET') {
    const balance = this.getBalance(playerId);
    
    if (balance < amount) {
      return { success: false, error: 'INSUFFICIENT_FUNDS' };
    }

    const newBalance = parseFloat((balance - amount).toFixed(8));
    this.balances.set(playerId, newBalance);

    const entry = {
      id: uuidv4(),
      time: new Date().toISOString(),
      roundId,
      reason,
      amount: -amount,
      balanceAfter: newBalance
    };

    this.ledgers.get(playerId).unshift(entry);
    return { success: true, balance: newBalance, entry };
  }

  /**
   * Credit player account (win/cashout)
   */
  credit(playerId, amount, roundId, reason = 'CASHOUT') {
    const balance = this.getBalance(playerId);
    const newBalance = parseFloat((balance + amount).toFixed(8));
    
    this.balances.set(playerId, newBalance);

    const entry = {
      id: uuidv4(),
      time: new Date().toISOString(),
      roundId,
      reason,
      amount: +amount,
      balanceAfter: newBalance
    };

    this.ledgers.get(playerId).unshift(entry);
    return { success: true, balance: newBalance, entry };
  }

  /**
   * Reset to starting balance (demo feature)
   */
  resetBalance(playerId) {
    const oldBalance = this.getBalance(playerId);
    const newBalance = this.config.STARTING_BALANCE;
    
    this.balances.set(playerId, newBalance);

    const entry = {
      id: uuidv4(),
      time: new Date().toISOString(),
      roundId: null,
      reason: 'ADJUSTMENT',
      amount: newBalance - oldBalance,
      balanceAfter: newBalance
    };

    this.ledgers.get(playerId).unshift(entry);
    return { success: true, balance: newBalance, entry };
  }

  /**
   * Get full transaction ledger
   */
  getLedger(playerId) {
    this.getBalance(playerId); // Ensure initialized
    return this.ledgers.get(playerId) || [];
  }

  /**
   * Get paginated ledger
   */
  getLedgerPage(playerId, page = 1, perPage = 20) {
    const ledger = this.getLedger(playerId);
    const start = (page - 1) * perPage;
    return {
      entries: ledger.slice(start, start + perPage),
      total: ledger.length,
      page,
      perPage,
      totalPages: Math.ceil(ledger.length / perPage)
    };
  }
}

module.exports = WalletSystem;