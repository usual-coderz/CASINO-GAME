/**
 * CRASH GAME VIEW
 * Full game with canvas, bet panel, and player list
 */

export class CrashView {
  constructor(container, socket, state) {
    this.container = container;
    this.socket = socket;
    this.state = state;
    
    this.canvas = null;
    this.ctx = null;
    this.animationId = null;
    
    this.gameState = {
      phase: 'WAITING', // WAITING, COUNTDOWN, RUNNING, CRASHED
      roundId: null,
      startedAt: null,
      crashPoint: null,
      currentMultiplier: 1.00,
      betAmount: 100,
      autoCashout: 2.00,
      hasBet: false,
      hasCashedOut: false,
      players: []
    };
    
    this.render();
    this.initCanvas();
    this.setupListeners();
    this.startRenderLoop();
  }

  render() {
    this.container.innerHTML = `
      <div class="view" style="max-width: 100%; padding: 16px;">
        <!-- History Bar -->
        <div class="history-bar" id="crash-history">
          <!-- History items -->
        </div>

        <div class="crash-game">
          <!-- Bet Panel -->
          <div class="bet-panel">
            <div class="input-group">
              <label>Bet Amount</label>
              <div class="input-wrapper">
                <input type="number" id="bet-amount" value="100" min="0.01" max="10000" step="0.01">
                <span class="input-suffix">₹</span>
              </div>
              <div class="input-buttons">
                <button onclick="document.getElementById('bet-amount').value = 
                  Math.max(0.01, (document.getElementById('bet-amount').value / 2).toFixed(2))">1/2</button>
                <button onclick="document.getElementById('bet-amount').value = 
                  Math.min(10000, (document.getElementById('bet-amount').value * 2).toFixed(2))">2x</button>
                <button onclick="document.getElementById('bet-amount').value = '100'">Reset</button>
              </div>
            </div>

            <div class="input-group">
              <label>Auto Cashout</label>
              <div class="input-wrapper">
                <input type="number" id="auto-cashout" value="2.00" min="1.01" max="10000" step="0.01">
                <span class="input-suffix">x</span>
              </div>
            </div>

            <div class="profit-display">
              <div class="profit-label">Profit on Win</div>
              <div class="profit-value" id="profit-display">₹100.00</div>
            </div>

            <button id="action-btn" class="btn btn-primary" style="height: 56px; font-size: 16px;">
              BET (NEXT ROUND)
            </button>

            <div class="player-list">
              <h4>Active Players</h4>
              <table class="player-table" id="player-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Bet</th>
                    <th>Mult</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Players injected here -->
                </tbody>
              </table>
            </div>
          </div>

          <!-- Canvas Area -->
          <div class="canvas-container">
            <canvas id="crash-canvas"></canvas>
            <div class="canvas-overlay">
              <div class="multiplier-display" id="multiplier-display">1.00x</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Update profit display on input change
    const updateProfit = () => {
      const amount = parseFloat(document.getElementById('bet-amount').value) || 0;
      const mult = parseFloat(document.getElementById('auto-cashout').value) || 2;
      const profit = (amount * mult - amount).toFixed(2);
      document.getElementById('profit-display').textContent = '₹' + profit;
    };

    document.getElementById('bet-amount')?.addEventListener('input', updateProfit);
    document.getElementById('auto-cashout')?.addEventListener('input', updateProfit);
  }

  initCanvas() {
    this.canvas = document.getElementById('crash-canvas');
    if (!this.canvas) return;

    this.resizeCanvas();
    this.ctx = this.canvas.getContext('2d');
    
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const container = this.canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = container.clientWidth * dpr;
    this.canvas.height = container.clientHeight * dpr;
    
    this.canvas.style.width = container.clientWidth + 'px';
    this.canvas.style.height = container.clientHeight + 'px';
    
    if (this.ctx) {
      this.ctx.scale(dpr, dpr);
    }
  }

  setupListeners() {
    // Action button
    document.getElementById('action-btn')?.addEventListener('click', () => {
      this.handleAction();
    });

    // Socket events
    this.socket.on('round:waiting', (data) => {
      this.gameState.phase = 'WAITING';
      this.gameState.roundId = data.roundId;
      this.gameState.currentMultiplier = 1.00;
      this.gameState.hasBet = false;
      this.gameState.hasCashedOut = false;
      this.updateActionButton();
    });

    this.socket.on('round:countdown', (data) => {
      this.gameState.phase = 'COUNTDOWN';
      this.updateActionButton();
    });

    this.socket.on('round:start', (data) => {
      this.gameState.phase = 'RUNNING';
      this.gameState.startedAt = data.startedAt;
      this.updateActionButton();
    });

    this.socket.on('round:update', (data) => {
      this.gameState.currentMultiplier = data.multiplier;
      this.updateActionButton();
    });

    this.socket.on('round:crash', (data) => {
      this.gameState.phase = 'CRASHED';
      this.gameState.crashPoint = data.crashPoint;
      this.updateActionButton();
      
      // Flash effect
      const display = document.getElementById('multiplier-display');
      if (display) {
        display.textContent = 'CRASHED ' + data.crashPoint.toFixed(2) + 'x';
        display.classList.add('crash');
      }
    });

    this.socket.on('round:settlement', () => {
      setTimeout(() => {
        this.gameState.phase = 'WAITING';
        const display = document.getElementById('multiplier-display');
        if (display) {
          display.classList.remove('crash');
        }
      }, 1000);
    });

    this.socket.on('players:update', (data) => {
      this.gameState.players = data.players;
      this.updatePlayerTable();
    });

    this.socket.on('history:update', (data) => {
      this.updateHistoryBar(data.results);
    });

    this.socket.on('round:cashout', (data) => {
      // Visual feedback for cashout
      if (data.playerId === this.socket.id) {
        this.gameState.hasCashedOut = true;
        this.updateActionButton();
      }
    });
  }

  handleAction() {
    const btn = document.getElementById('action-btn');
    
    if (this.gameState.phase === 'WAITING' || this.gameState.phase === 'COUNTDOWN') {
      // Place bet
      if (this.gameState.hasBet) return;
      
      const amount = parseFloat(document.getElementById('bet-amount').value);
      const autoCashout = parseFloat(document.getElementById('auto-cashout').value);
      
      btn.disabled = true;
      btn.textContent = 'BETTING...';
      
      this.socket.emit('player:bet', { amount, autoCashout }, (response) => {
        btn.disabled = false;
        if (response.success) {
          this.gameState.hasBet = true;
          this.updateActionButton();
        } else {
          btn.textContent = 'BET FAILED';
          setTimeout(() => this.updateActionButton(), 1000);
        }
      });
      
    } else if (this.gameState.phase === 'RUNNING' && this.gameState.hasBet && !this.gameState.hasCashedOut) {
      // Cash out
      this.socket.emit('player:cashout', {
        roundId: this.gameState.roundId,
        targetMultiplier: this.gameState.currentMultiplier
      }, (response) => {
        if (response.success) {
          this.gameState.hasCashedOut = true;
          this.updateActionButton();
        }
      });
    }
  }

  updateActionButton() {
    const btn = document.getElementById('action-btn');
    if (!btn) return;

    const { phase, hasBet, hasCashedOut, currentMultiplier } = this.gameState;

    if (phase === 'WAITING' || phase === 'COUNTDOWN') {
      if (hasBet) {
        btn.textContent = 'BET PLACED';
        btn.disabled = true;
        btn.className = 'btn btn-secondary';
      } else {
        btn.textContent = 'BET (NEXT ROUND)';
        btn.disabled = false;
        btn.className = 'btn btn-primary';
      }
    } else if (phase === 'RUNNING') {
      if (hasBet && !hasCashedOut) {
        const amount = parseFloat(document.getElementById('bet-amount').value) || 0;
        const profit = (amount * currentMultiplier - amount).toFixed(2);
        btn.textContent = `CASHOUT ${currentMultiplier.toFixed(2)}x (₹${profit})`;
        btn.disabled = false;
        btn.className = 'btn btn-danger';
      } else if (hasBet && hasCashedOut) {
        btn.textContent = 'CASHED OUT';
        btn.disabled = true;
        btn.className = 'btn btn-secondary';
      } else {
        btn.textContent = 'BETS CLOSED';
        btn.disabled = true;
        btn.className = 'btn btn-secondary';
      }
    } else if (phase === 'CRASHED') {
      btn.textContent = hasBet && !hasCashedOut ? 'BUSTED' : 'WAITING...';
      btn.disabled = true;
      btn.className = 'btn btn-secondary';
    }
  }

  updatePlayerTable() {
    const tbody = document.querySelector('#player-table tbody');
    if (!tbody) return;

    const active = this.gameState.players.filter(p => p.status === 'active' || p.status === 'cashed_out');
    
    tbody.innerHTML = active.slice(0, 10).map(p => {
      const profitClass = p.profit > 0 ? 'player-profit' : (p.profit < 0 ? 'player-loss' : '');
      const profitSign = p.profit > 0 ? '+' : '';
      return `
        <tr>
          <td>${p.name}</td>
          <td>₹${p.bet.toFixed(2)}</td>
          <td class="${profitClass}">
            ${p.cashoutAt ? p.cashoutAt.toFixed(2) + 'x' : '-'}
            ${p.profit ? `(${profitSign}₹${p.profit.toFixed(2)})` : ''}
          </td>
        </tr>
      `;
    }).join('');
  }

  updateHistoryBar(history) {
    const container = document.getElementById('crash-history');
    if (!container) return;

    container.innerHTML = history.slice(0, 20).map(h => {
      const val = parseFloat(h.crashPoint);
      let cls = 'low';
      if (val >= 2.0) cls = 'medium';
      if (val >= 10.0) cls = 'high';
      return `<div class="history-item ${cls}">${val.toFixed(2)}x</div>`;
    }).join('');
  }

  startRenderLoop() {
    const render = () => {
      this.draw();
      this.animationId = requestAnimationFrame(render);
    };
    render();
  }

  draw() {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background grid
    ctx.strokeStyle = 'rgba(30, 58, 95, 0.3)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 1; i < 5; i++) {
      const y = height - (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw curve if running or crashed
    if ((this.gameState.phase === 'RUNNING' || this.gameState.phase === 'CRASHED') && this.gameState.startedAt) {
      const elapsed = Date.now() - this.gameState.startedAt;
      const currentMult = this.gameState.phase === 'CRASHED' 
        ? this.gameState.crashPoint 
        : Math.pow(Math.E, 0.06 * (elapsed / 1000));
      
      // Update display
      const display = document.getElementById('multiplier-display');
      if (display && this.gameState.phase !== 'CRASHED') {
        display.textContent = currentMult.toFixed(2) + 'x';
      }

      // Calculate curve points
      const points = [];
      const steps = 100;
      
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * elapsed;
        const mult = Math.pow(Math.E, 0.06 * (t / 1000));
        const x = (i / steps) * width;
        const y = height - (Math.log(mult) / Math.log(10)) * (height / 3); // Scale to fit
        
        if (y > 0) points.push({ x, y: Math.max(0, y) });
      }

      if (points.length > 1) {
        // Draw fill under curve
        ctx.beginPath();
        ctx.moveTo(0, height);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(points[points.length - 1].x, height);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(247, 147, 26, 0.3)');
        gradient.addColorStop(1, 'rgba(247, 147, 26, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw curve line
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach(p => ctx.lineTo(p.x, p.y));
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw endpoint dot
        const last = points[points.length - 1];
        ctx.beginPath();
        ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        // Pulse effect
        ctx.beginPath();
        ctx.arc(last.x, last.y, 12 + Math.sin(Date.now() / 200) * 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Draw Y-axis labels
    ctx.fillStyle = 'var(--text-secondary)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    
    [1, 2, 5, 10, 20].forEach(mult => {
      const y = height - (Math.log(mult) / Math.log(10)) * (height / 3);
      if (y > 20 && y < height - 10) {
        ctx.fillText(mult.toFixed(mult < 2 ? 1 : 0) + 'x', width - 10, y + 4);
      }
    });
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}