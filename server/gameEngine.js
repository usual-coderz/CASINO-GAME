/**
 * CRASH GAME ENGINE
 * Single authoritative state machine
 */

const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');
const {
  generateServerSeed,
  hashServerSeed,
  crashPointFromSeed,
  generateClientSeed
} = require('./fairness');

const STATES = {
  WAITING: 'WAITING',
  COUNTDOWN: 'COUNTDOWN',
  RUNNING: 'RUNNING',
  CRASHED: 'CRASHED',
  SETTLEMENT: 'SETTLEMENT'
};

class GameEngine extends EventEmitter {
  constructor(config, wallet, stats, bots) {
    super();
    this.config = config;
    this.wallet = wallet;
    this.stats = stats;
    this.bots = bots;
    
    this.state = STATES.WAITING;
    this.currentRound = null;
    this.roundHistory = [];
    this.players = new Map(); // Real players (not bots)
    
    // Seed management
    this.serverSeed = generateServerSeed();
    this.serverSeedHash = hashServerSeed(this.serverSeed);
    this.roundsSinceSeedRotation = 0;
    
    // Timing
    this.startedAt = null;
    this.crashPoint = null;
    this.tickInterval = null;
    this.phaseTimeout = null;
    
    this._startWaitingPhase();
  }

  //=========================================================================
  // STATE MACHINE
  //=========================================================================

  _startWaitingPhase() {
    this.state = STATES.WAITING;
    this.currentRound = {
      id: uuidv4(),
      number: this.roundHistory.length + 1,
      serverSeedHash: this.serverSeedHash,
      startedAt: null,
      crashPoint: null,
      bets: new Map(),
      cashedOut: new Set()
    };

    this.emit('round:waiting', {
      roundId: this.currentRound.id,
      serverSeedHash: this.serverSeedHash,
      roundNumber: this.currentRound.number
    });

    // Bots place bets
    this.bots.onWaitingPhase(this.currentRound.id);

    // Start countdown after waiting period
    this.phaseTimeout = setTimeout(() => {
      this._startCountdownPhase();
    }, this.config.WAITING_MS);
  }

  _startCountdownPhase() {
    this.state = STATES.COUNTDOWN;
    let secondsLeft = Math.floor(this.config.COUNTDOWN_MS / 1000);
    
    this.emit('round:countdown', {
      roundId: this.currentRound.id,
      secondsLeft
    });

    const countdownInterval = setInterval(() => {
      secondsLeft--;
      if (secondsLeft > 0) {
        this.emit('round:countdown', {
          roundId: this.currentRound.id,
          secondsLeft
        });
      } else {
        clearInterval(countdownInterval);
        this._startRunningPhase();
      }
    }, 1000);
  }

  _startRunningPhase() {
    this.state = STATES.RUNNING;
    this.startedAt = Date.now();
    
    // Generate crash point using combined seeds
    // For the actual round, we use a deterministic client seed component
    // In production, this would incorporate each player's client seed
    // For simplicity, we use a round-specific component
    const roundClientSeed = hashServerSeed(this.serverSeed).slice(0, 16);
    this.crashPoint = crashPointFromSeed(
      this.serverSeed,
      roundClientSeed,
      this.currentRound.number
    );
    
    this.currentRound.startedAt = this.startedAt;
    this.currentRound.crashPoint = this.crashPoint;

    this.emit('round:start', {
      roundId: this.currentRound.id,
      startedAt: this.startedAt
    });

    // Start game tick
    this.tickInterval = setInterval(() => {
      this._tick();
    }, this.config.TICK_MS);
  }

  _tick() {
    if (this.state !== STATES.RUNNING) return;

    const elapsedMs = Date.now() - this.startedAt;
    const multiplier = this._calculateMultiplier(elapsedMs);

    // Check auto-cashouts
    this._processAutoCashouts(multiplier);
    this.bots.onRunningPhase(multiplier);

    this.emit('round:update', {
      roundId: this.currentRound.id,
      multiplier: parseFloat(multiplier.toFixed(2)),
      elapsedMs
    });

    // Check crash
    if (multiplier >= this.crashPoint) {
      this._crash(multiplier);
    }
  }

  _crash(finalMultiplier) {
    clearInterval(this.tickInterval);
    this.state = STATES.CRASHED;

    this.emit('round:crash', {
      roundId: this.currentRound.id,
      crashPoint: parseFloat(this.crashPoint.toFixed(2))
    });

    // Settle losing bets
    for (const [playerId, bet] of this.currentRound.bets) {
      if (!this.currentRound.cashedOut.has(playerId)) {
        this.stats.recordCrash(playerId, this.currentRound.id);
      }
    }

    this.bots.onCrash(this.crashPoint, this.currentRound.id);

    // Move to settlement
    this.phaseTimeout = setTimeout(() => {
      this._startSettlementPhase();
    }, 1500);
  }

  _startSettlementPhase() {
    this.state = STATES.SETTLEMENT;

    // Reveal server seed
    const revealedSeed = this.serverSeed;
    
    // Add to history
    this.roundHistory.unshift({
      roundId: this.currentRound.id,
      crashPoint: parseFloat(this.crashPoint.toFixed(2)),
      serverSeed: revealedSeed,
      serverSeedHash: this.serverSeedHash,
      time: new Date().toISOString()
    });

    if (this.roundHistory.length > this.config.MAX_HISTORY) {
      this.roundHistory.pop();
    }

    this.emit('round:settlement', {
      roundId: this.currentRound.id,
      serverSeed: revealedSeed,
      summary: {
        crashPoint: parseFloat(this.crashPoint.toFixed(2)),
        totalPlayers: this.currentRound.bets.size,
        totalWagered: Array.from(this.currentRound.bets.values())
          .reduce((sum, b) => sum + b.amount, 0)
      }
    });

    this.emit('history:update', {
      results: this.roundHistory.map(r => ({
        roundId: r.roundId,
        crashPoint: r.crashPoint
      }))
    });

    // Rotate seed if needed
    this.roundsSinceSeedRotation++;
    if (this.roundsSinceSeedRotation >= this.config.SEED_ROTATION_ROUNDS) {
      this._rotateSeed();
    }

    // Next round
    this.phaseTimeout = setTimeout(() => {
      this._startWaitingPhase();
    }, this.config.SETTLEMENT_MS);
  }

  _rotateSeed() {
    this.serverSeed = generateServerSeed();
    this.serverSeedHash = hashServerSeed(this.serverSeed);
    this.roundsSinceSeedRotation = 0;
  }

  //=========================================================================
  // MULTIPLIER MATH
  //=========================================================================

  _calculateMultiplier(elapsedMs) {
    const t = elapsedMs / 1000;
    return Math.max(1.00, Math.pow(Math.E, this.config.GROWTH_RATE * t));
  }

  getCurrentMultiplier() {
    if (this.state !== STATES.RUNNING || !this.startedAt) return 1.00;
    const elapsedMs = Date.now() - this.startedAt;
    return this._calculateMultiplier(elapsedMs);
  }

  //=========================================================================
  // PLAYER ACTIONS
  //=========================================================================

  placeBet(playerId, amount, autoCashout, clientSeed) {
    if (this.state !== STATES.WAITING && this.state !== STATES.COUNTDOWN) {
      return { success: false, error: 'BETS_CLOSED' };
    }

    if (this.currentRound.bets.has(playerId)) {
      return { success: false, error: 'ALREADY_BETTED' };
    }

    if (amount < this.config.MIN_BET || amount > this.config.MAX_BET) {
      return { success: false, error: 'INVALID_AMOUNT' };
    }

    // Debit wallet
    const result = this.wallet.debit(playerId, amount, this.currentRound.id, 'BET');
    if (!result.success) {
      return result;
    }

    // Record bet
    this.currentRound.bets.set(playerId, {
      amount,
      autoCashout: autoCashout || null,
      clientSeed: clientSeed || generateClientSeed()
    });

    // Record in stats
    this.stats.recordBet(playerId, this.currentRound.id, amount, autoCashout);

    this.emit('player:bet', {
      playerId,
      amount,
      autoCashout
    });

    return { success: true, balance: result.balance };
  }

  cashout(playerId, targetMultiplier) {
    if (this.state !== STATES.RUNNING) {
      return { success: false, error: 'NOT_RUNNING' };
    }

    if (!this.currentRound.bets.has(playerId)) {
      return { success: false, error: 'NO_BET' };
    }

    if (this.currentRound.cashedOut.has(playerId)) {
      return { success: false, error: 'ALREADY_CASHED_OUT' };
    }

    const currentMult = this.getCurrentMultiplier();
    if (currentMult < targetMultiplier) {
      return { success: false, error: 'TOO_EARLY' };
    }

    const bet = this.currentRound.bets.get(playerId);
    const payout = parseFloat((bet.amount * currentMult).toFixed(8));
    const profit = parseFloat((payout - bet.amount).toFixed(8));

    // Credit wallet
    this.wallet.credit(playerId, payout, this.currentRound.id, 'CASHOUT');
    
    // Mark as cashed out
    this.currentRound.cashedOut.add(playerId);
    
    // Record in stats
    this.stats.recordCashout(playerId, this.currentRound.id, currentMult, payout);

    this.emit('round:cashout', {
      playerId,
      name: playerId, // Will be replaced with display name
      multiplier: parseFloat(currentMult.toFixed(2)),
      payout,
      profit
    });

    return { 
      success: true, 
      multiplier: parseFloat(currentMult.toFixed(2)),
      payout,
      profit
    };
  }

  _processAutoCashouts(multiplier) {
    for (const [playerId, bet] of this.currentRound.bets) {
      if (this.currentRound.cashedOut.has(playerId)) continue;
      if (bet.autoCashout && multiplier >= bet.autoCashout) {
        this.cashout(playerId, bet.autoCashout);
      }
    }
  }

  //=========================================================================
  // GETTERS
  //=========================================================================

  getPlayerBets() {
    const bets = [];
    for (const [playerId, bet] of this.currentRound.bets) {
      const cashedOut = this.currentRound.cashedOut.has(playerId);
      bets.push({
        id: playerId,
        name: playerId.slice(0, 8),
        bet: bet.amount,
        status: cashedOut ? 'cashed_out' : 'active',
        cashoutAt: cashedOut ? bet.autoCashout : null,
        profit: cashedOut ? bet.profit : null
      });
    }
    return bets.concat(this.bots.getActivePlayers());
  }

  getRoundInfo() {
    return {
      state: this.state,
      roundId: this.currentRound?.id,
      serverSeedHash: this.currentRound?.serverSeedHash,
      multiplier: this.state === STATES.RUNNING ? this.getCurrentMultiplier() : 1.00
    };
  }

  getHistory() {
    return this.roundHistory.map(r => ({
      roundId: r.roundId,
      crashPoint: r.crashPoint
    }));
  }

  emitBotCashout(bot, multiplier, payout, profit) {
    this.emit('round:cashout', {
      playerId: bot.id,
      name: bot.name,
      multiplier: parseFloat(multiplier.toFixed(2)),
      payout,
      profit
    });
  }
}

module.exports = { GameEngine, STATES };