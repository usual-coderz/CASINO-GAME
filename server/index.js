/**
 * CRASH GAME SERVER
 * Express + Socket.IO with authoritative game engine
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const config = require('./config');
const WalletSystem = require('./wallet');
const StatsSystem = require('./stats');
const { GameEngine, STATES } = require('./gameEngine');
const BotManager = require('./players');
const {
  validate,
  betSchema,
  cashoutSchema,
  setSeedSchema,
  setNameSchema,
  emptySchema
} = require('./validation');

// Initialize systems
const wallet = new WalletSystem(config);
const stats = new StatsSystem();

// Express setup
const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

app.use(cookieParser(config.SESSION_SECRET));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS
});
app.use(limiter);

// Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Session management
const sessions = new Map();

function getSession(socket) {
  let sessionId = socket.handshake.signedCookies?.sessionId;
  if (!sessionId) {
    sessionId = uuidv4();
    socket.emit('session:new', { sessionId });
  }
  
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      displayName: `Player${Math.floor(Math.random() * 9999)}`,
      clientSeed: require('./fairness').generateClientSeed(),
      nonce: 0,
      socketId: socket.id
    });
  }
  
  return sessions.get(sessionId);
}

// Initialize game engine with bots
const gameEngine = new GameEngine(config, wallet, stats, {
  onWaitingPhase: () => {},
  onRunningPhase: () => {},
  onCrash: () => {},
  getActivePlayers: () => [],
  getOnlineCount: () => config.BOT_COUNT
});

// Wire up bot manager
const bots = new BotManager(config, wallet, stats, gameEngine);
gameEngine.bots = bots;

// Socket.IO connection handling
io.on('connection', (socket) => {
  const session = getSession(socket);
  const playerId = session.id;
  
  console.log(`Player connected: ${playerId}`);

  // Send initial state
  socket.emit('you:balance', { balance: wallet.getBalance(playerId) });
  socket.emit('you:stats', stats.getStats(playerId));
  socket.emit('history:update', { results: gameEngine.getHistory() });
  
  const roundInfo = gameEngine.getRoundInfo();
  if (roundInfo.state === STATES.WAITING) {
    socket.emit('round:waiting', {
      roundId: roundInfo.roundId,
      serverSeedHash: roundInfo.serverSeedHash,
      roundNumber: gameEngine.currentRound?.number
    });
  } else if (roundInfo.state === STATES.RUNNING) {
    socket.emit('round:start', {
      roundId: roundInfo.roundId,
      startedAt: gameEngine.startedAt
    });
  }

  // Rate limiting per socket
  const socketLimiter = {
    bets: 0,
    cashouts: 0,
    lastReset: Date.now()
  };

  function checkRateLimit(type, max = 10) {
    const now = Date.now();
    if (now - socketLimiter.lastReset > 60000) {
      socketLimiter.bets = 0;
      socketLimiter.cashouts = 0;
      socketLimiter.lastReset = now;
    }
    
    if (socketLimiter[type] >= max) {
      return false;
    }
    socketLimiter[type]++;
    return true;
  }

  // Player actions
  socket.on('player:bet', (data, callback) => {
    try {
      if (!checkRateLimit('bets', 30)) {
        return callback?.({ success: false, error: 'RATE_LIMITED' });
      }

      const validated = validate(betSchema, data);
      const result = gameEngine.placeBet(
        playerId,
        validated.amount,
        validated.autoCashout,
        session.clientSeed
      );
      
      if (result.success) {
        session.nonce++;
        socket.emit('you:balance', { balance: result.balance });
      }
      
      callback?.(result);
    } catch (err) {
      socket.emit('error', { code: 'VALIDATION_ERROR', message: err.message });
      callback?.({ success: false, error: 'VALIDATION_ERROR' });
    }
  });

  socket.on('player:cashout', (data, callback) => {
    try {
      if (!checkRateLimit('cashouts', 30)) {
        return callback?.({ success: false, error: 'RATE_LIMITED' });
      }

      const validated = validate(cashoutSchema, data);
      const result = gameEngine.cashout(playerId, validated.targetMultiplier);
      
      if (result.success) {
        socket.emit('you:balance', { balance: wallet.getBalance(playerId) });
        socket.emit('you:stats', stats.getStats(playerId));
      }
      
      callback?.(result);
    } catch (err) {
      socket.emit('error', { code: 'VALIDATION_ERROR', message: err.message });
      callback?.({ success: false, error: 'VALIDATION_ERROR' });
    }
  });

  socket.on('player:setSeed', (data, callback) => {
    try {
      const validated = validate(setSeedSchema, data);
      session.clientSeed = validated.clientSeed;
      session.nonce = 0;
      callback?.({ success: true, clientSeed: session.clientSeed });
    } catch (err) {
      socket.emit('error', { code: 'VALIDATION_ERROR', message: err.message });
      callback?.({ success: false, error: 'VALIDATION_ERROR' });
    }
  });

  socket.on('player:setDisplayName', (data, callback) => {
    try {
      const validated = validate(setNameSchema, data);
      session.displayName = validated.name;
      callback?.({ success: true, name: session.displayName });
    } catch (err) {
      socket.emit('error', { code: 'VALIDATION_ERROR', message: err.message });
      callback?.({ success: false, error: 'VALIDATION_ERROR' });
    }
  });

  socket.on('player:resetBalance', (data, callback) => {
    try {
      validate(emptySchema, data);
      const result = wallet.resetBalance(playerId);
      socket.emit('you:balance', { balance: result.balance });
      socket.emit('you:ledger', { entries: wallet.getLedger(playerId) });
      callback?.({ success: true, balance: result.balance });
    } catch (err) {
      callback?.({ success: false, error: err.message });
    }
  });

  socket.on('player:getProfile', (data, callback) => {
    try {
      validate(emptySchema, data);
      callback?.({
        success: true,
        profile: {
          displayName: session.displayName,
          clientSeed: session.clientSeed,
          nonce: session.nonce
        },
        balance: wallet.getBalance(playerId),
        stats: stats.getStats(playerId),
        ledger: wallet.getLedgerPage(playerId),
        bets: stats.getBetHistory(playerId)
      });
    } catch (err) {
      callback?.({ success: false, error: err.message });
    }
  });

  socket.on('player:rotateSeed', (data, callback) => {
    try {
      validate(emptySchema, data);
      const { generateClientSeed } = require('./fairness');
      session.clientSeed = generateClientSeed();
      session.nonce = 0;
      callback?.({ 
        success: true, 
        clientSeed: session.clientSeed,
        message: 'Seed rotated successfully'
      });
    } catch (err) {
      callback?.({ success: false, error: err.message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${playerId}`);
  });
});

// Forward game engine events to all clients
gameEngine.on('round:waiting', (data) => {
  io.emit('round:waiting', data);
  io.emit('players:update', { players: gameEngine.getPlayerBets() });
});

gameEngine.on('round:countdown', (data) => {
  io.emit('round:countdown', data);
});

gameEngine.on('round:start', (data) => {
  io.emit('round:start', data);
});

gameEngine.on('round:update', (data) => {
  io.emit('round:update', data);
});

gameEngine.on('round:crash', (data) => {
  io.emit('round:crash', data);
});

gameEngine.on('round:settlement', (data) => {
  io.emit('round:settlement', data);
});

gameEngine.on('round:cashout', (data) => {
  io.emit('round:cashout', data);
});

gameEngine.on('history:update', (data) => {
  io.emit('history:update', data);
});

gameEngine.on('player:bet', (data) => {
  io.emit('players:update', { players: gameEngine.getPlayerBets() });
});

// Start server
server.listen(config.PORT, () => {
  console.log(`Crash Game Server running on port ${config.PORT}`);
  console.log(`Open http://localhost:${config.PORT} to play`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});