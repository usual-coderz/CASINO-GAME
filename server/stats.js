/**
 * PLAYER STATISTICS
 * Aggregate stats computed server-side
 */

class StatsSystem {
  constructor() {
    this.playerStats = new Map(); // playerId -> stats object
    this.betHistory = new Map();  // playerId -> [bets]
  }

  _ensureStats(playerId) {
    if (!this.playerStats.has(playerId)) {
      this.playerStats.set(playerId, {
        totalBets: 0,
        totalWagered: 0,
        totalProfit: 0,
        biggestWinMultiplier: 0,
        bestPayout: 0,
        wins: 0,
        losses: 0
      });
      this.betHistory.set(playerId, []);
    }
    return this.playerStats.get(playerId);
  }

  recordBet(playerId, roundId, amount, autoCashout) {
    const stats = this._ensureStats(playerId);
    stats.totalBets++;
    stats.totalWagered = parseFloat((stats.totalWagered + amount).toFixed(8));
    
    const history = this.betHistory.get(playerId);
    history.unshift({
      roundId,
      amount,
      autoCashout: autoCashout || null,
      cashoutAt: null,
      profit: null,
      crashed: false,
      time: new Date().toISOString()
    });

    // Keep only last 1000 bets in memory
    if (history.length > 1000) {
      history.pop();
    }

    return history[0];
  }

  recordCashout(playerId, roundId, multiplier, payout) {
    const stats = this._ensureStats(playerId);
    const history = this.betHistory.get(playerId);
    
    const bet = history.find(b => b.roundId === roundId && b.profit === null);
    if (!bet) return null;

    const profit = parseFloat((payout - bet.amount).toFixed(8));
    bet.cashoutAt = multiplier;
    bet.profit = profit;
    bet.crashed = false;

    stats.totalProfit = parseFloat((stats.totalProfit + profit).toFixed(8));
    stats.wins++;
    
    if (multiplier > stats.biggestWinMultiplier) {
      stats.biggestWinMultiplier = multiplier;
    }
    if (payout > stats.bestPayout) {
      stats.bestPayout = payout;
    }

    return bet;
  }

  recordCrash(playerId, roundId) {
    const stats = this._ensureStats(playerId);
    const history = this.betHistory.get(playerId);
    
    const bet = history.find(b => b.roundId === roundId && b.profit === null);
    if (!bet) return null;

    bet.cashoutAt = null;
    bet.profit = -bet.amount;
    bet.crashed = true;

    stats.totalProfit = parseFloat((stats.totalProfit - bet.amount).toFixed(8));
    stats.losses++;

    return bet;
  }

  getStats(playerId) {
    const stats = this._ensureStats(playerId);
    const roi = stats.totalWagered > 0 
      ? parseFloat(((stats.totalProfit / stats.totalWagered) * 100).toFixed(2))
      : 0;
    
    return {
      ...stats,
      roi
    };
  }

  getBetHistory(playerId, page = 1, perPage = 20) {
    this._ensureStats(playerId);
    const history = this.betHistory.get(playerId) || [];
    const start = (page - 1) * perPage;
    return {
      bets: history.slice(start, start + perPage),
      total: history.length,
      page,
      perPage,
      totalPages: Math.ceil(history.length / perPage)
    };
  }
}

module.exports = StatsSystem;