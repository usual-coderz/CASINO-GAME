/**
 * DEMO BOT PLAYERS
 * Simulates realistic player activity
 */

const crypto = require('crypto');

const BOT_NAMES = [
  'Alex', 'Shadow', 'Player123', 'Hidden', 'CryptoKing',
  'MoonShot', 'DiamondHands', 'Lucky7', 'WhaleAlert', 'NightOwl',
  'RapidFire', 'StealthBet', 'MaxProfit', 'RiskTaker', 'HODLer'
];

class BotManager {
  constructor(config, wallet, stats, gameEngine) {
    this.config = config;
    this.wallet = wallet;
    this.stats = stats;
    this.gameEngine = gameEngine;
    this.bots = new Map();
    this.activeBets = new Map(); // botId -> bet info
    
    this._initBots();
  }

  _initBots() {
    for (let i = 0; i < this.config.BOT_COUNT; i++) {
      const botId = `bot_${i}_${crypto.randomUUID()}`;
      const name = i < 5 ? BOT_NAMES[i] : `Player${1000 + i}`;
      
      this.bots.set(botId, {
        id: botId,
        name: i === 3 ? 'Hidden' : name, // One "hidden" bot
        isHidden: i === 3,
        balance: this.config.STARTING_BALANCE
      });
    }
  }

  onWaitingPhase(roundId) {
    // Bots place bets during waiting phase
    this.activeBets.clear();
    
    for (const [botId, bot] of this.bots) {
      if (Math.random() < 0.7) { // 70% of bots bet each round
        const amount = this._randomBet();
        const autoCashout = this._randomCashout();
        
        // Debit bot's virtual balance
        const result = this.wallet.debit(botId, amount, roundId, 'BET');
        if (result.success) {
          this.stats.recordBet(botId, roundId, amount, autoCashout);
          this.activeBets.set(botId, {
            amount,
            autoCashout,
            cashedOut: false
          });
        }
      }
    }
  }

  onRunningPhase(multiplier) {
    // Check auto-cashouts
    for (const [botId, bet] of this.activeBets) {
      if (bet.cashedOut) continue;
      if (bet.autoCashout && multiplier >= bet.autoCashout) {
        this._cashoutBot(botId, bet.autoCashout);
      } else if (!bet.autoCashout && Math.random() < 0.02) {
        // Random manual cashout
        const cashoutMult = parseFloat((multiplier + Math.random() * 0.5).toFixed(2));
        this._cashoutBot(botId, cashoutMult);
      }
    }
  }

  onCrash(crashPoint, roundId) {
    // Settle remaining bets
    for (const [botId, bet] of this.activeBets) {
      if (!bet.cashedOut) {
        this.stats.recordCrash(botId, roundId);
      }
    }
    this.activeBets.clear();
  }

  _cashoutBot(botId, multiplier) {
    const bet = this.activeBets.get(botId);
    if (!bet || bet.cashedOut) return;

    bet.cashedOut = true;
    const payout = parseFloat((bet.amount * multiplier).toFixed(8));
    
    this.wallet.credit(botId, payout, this.gameEngine.currentRound?.id, 'CASHOUT');
    this.stats.recordCashout(botId, this.gameEngine.currentRound?.id, multiplier, payout);

    // Emit cashout event (bots are "players" too)
    this.gameEngine.emitBotCashout(this.bots.get(botId), multiplier, payout, payout - bet.amount);
  }

  _randomBet() {
    const min = this.config.BOT_BET_MIN;
    const max = this.config.BOT_BET_MAX;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  _randomCashout() {
    const r = Math.random();
    if (r < 0.3) return 1.5 + Math.random() * 0.5; // Early cashout
    if (r < 0.6) return 2.0 + Math.random() * 2;   // Normal
    if (r < 0.85) return 5.0 + Math.random() * 5;  // Greedy
    return null; // No auto, manual cashout
  }

  getActivePlayers() {
    const players = [];
    for (const [botId, bet] of this.activeBets) {
      const bot = this.bots.get(botId);
      if (!bot.isHidden) {
        players.push({
          id: botId,
          name: bot.name,
          bet: bet.amount,
          status: bet.cashedOut ? 'cashed_out' : 'active',
          cashoutAt: bet.cashedOut ? bet.autoCashout || bet.cashoutMult : null,
          profit: bet.cashedOut ? bet.profit : null
        });
      }
    }
    return players;
  }

  getOnlineCount() {
    return Math.floor(this.config.BOT_COUNT * 0.8) + Math.floor(Math.random() * 5);
  }
}

module.exports = BotManager;