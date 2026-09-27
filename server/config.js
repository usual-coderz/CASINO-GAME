/**
 * GAME CONFIGURATION
 * All tunables in one place. Change behavior here only.
 */

module.exports = {
  // Game Math
  GROWTH_RATE: 0.06,           // Exponential growth per second
  TICK_MS: 50,                 // Server broadcast interval
  
  // Round Timing
  WAITING_MS: 5000,            // Bets open, waiting for players
  COUNTDOWN_MS: 5000,          // 5..4..3..2..1 countdown
  SETTLEMENT_MS: 3000,         // Show results, credit payouts
  
  // Betting Limits
  MIN_BET: 0.01,
  MAX_BET: 10000.00,
  
  // Wallet
  STARTING_BALANCE: 10000.00,
  
  // Fairness
  SEED_ROTATION_ROUNDS: 100,   // Rotate server seed every N rounds
  
  // History
  MAX_HISTORY: 50,             // Keep last N results
  
  // Demo Bots
  BOT_COUNT: 12,
  BOT_BET_MIN: 10,
  BOT_BET_MAX: 500,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: 60000,
  RATE_LIMIT_MAX_REQUESTS: 100,
  
  // Session
  SESSION_SECRET: process.env.SESSION_SECRET || 'crash-game-demo-secret-key-change-in-production',
  
  // Server
  PORT: process.env.PORT || 3000
};