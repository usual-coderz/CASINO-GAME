/**
 * HOME / LANDING VIEW
 */

export class HomeView {
  constructor(container, socket, state) {
    this.container = container;
    this.socket = socket;
    this.state = state;
    
    this.render();
    this.setupListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="view">
        <div class="hero">
          <h1>Provably Fair Crash</h1>
          <p>Experience the thrill of the multiplier. Cash out before it crashes. 
             Fully transparent, verifiably fair gaming.</p>
          <div class="hero-buttons">
            <a href="#/games/crash" class="btn btn-primary">Play Crash</a>
            <a href="#/games" class="btn btn-secondary">Browse Games</a>
          </div>
        </div>

        <div class="stats-strip">
          <div class="stat-item">
            <div class="stat-value" id="online-count">12</div>
            <div class="stat-label">Players Online</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" id="total-wagered">₹0</div>
            <div class="stat-label">Total Wagered</div>
          </div>
          <div class="stat-item">
            <div class="stat-value" id="current-mult">1.00x</div>
            <div class="stat-label">Current Multiplier</div>
          </div>
        </div>

        <div class="history-pills" id="home-history">
          <!-- History pills injected here -->
        </div>

        <div class="featured-game" onclick="window.location.hash='#/games/crash'">
          <div class="game-thumbnail">📈</div>
          <div class="game-info">
            <span class="game-status">
              <span class="status-dot"></span>
              <span id="featured-status">Waiting for next round...</span>
            </span>
            <h3>Crash</h3>
            <p>Watch the multiplier grow. Cash out before the crash. 
               Provably fair with 99% RTP.</p>
          </div>
        </div>

        <div style="margin-top: 32px; text-align: center;">
          <a href="#/fairness" style="color: var(--text-secondary); font-size: 14px;">
            How does provably fair work?
          </a>
        </div>
      </div>
    `;
  }

  setupListeners() {
    // Update history pills
    this.updateHistory();
    
    // Listen for updates
    this.socket.on('history:update', () => {
      this.updateHistory();
    });

    this.socket.on('round:update', (data) => {
      document.getElementById('current-mult').textContent = data.multiplier.toFixed(2) + 'x';
      document.getElementById('featured-status').textContent = 'Running - ' + data.multiplier.toFixed(2) + 'x';
    });

    this.socket.on('round:waiting', () => {
      document.getElementById('featured-status').textContent = 'Waiting for next round...';
      document.getElementById('current-mult').textContent = '1.00x';
    });

    this.socket.on('round:crash', (data) => {
      document.getElementById('featured-status').textContent = 'Crashed at ' + data.crashPoint.toFixed(2) + 'x';
    });

    // Simulate online count fluctuation
    setInterval(() => {
      const base = 12;
      const variance = Math.floor(Math.random() * 8);
      document.getElementById('online-count').textContent = base + variance;
    }, 5000);
  }

  updateHistory() {
    const container = document.getElementById('home-history');
    if (!container) return;
    
    container.innerHTML = this.state.history.slice(0, 10).map(h => {
      const val = parseFloat(h.crashPoint);
      let cls = 'low';
      if (val >= 2.0) cls = 'medium';
      if (val >= 10.0) cls = 'high';
      return `<span class="pill ${cls}">${val.toFixed(2)}x</span>`;
    }).join('');
  }

  destroy() {
    // Cleanup if needed
  }
}