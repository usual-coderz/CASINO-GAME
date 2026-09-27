/**
 * GAMES LOBBY VIEW
 */

export class GamesView {
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
        <h1 style="margin-bottom: 24px;">Games</h1>
        
        <div class="games-grid">
          <!-- Crash - Live Game -->
          <div class="game-card" onclick="window.location.hash='#/games/crash'">
            <div class="game-card-header" style="background: linear-gradient(135deg, #00e701 0%, #00b801 100%);">
              📈
            </div>
            <div class="game-card-body">
              <span class="badge badge-live">Live</span>
              <h3>Crash</h3>
              <p id="crash-status">Waiting for next round...</p>
              <div style="margin-top: 12px; font-size: 24px; font-weight: 700; color: var(--neon-green);" 
                   id="crash-multiplier">1.00x</div>
            </div>
          </div>

          <!-- Coming Soon Games -->
          <div class="game-card coming-soon">
            <div class="game-card-header">🎲</div>
            <div class="game-card-body">
              <span class="badge badge-soon">Coming Soon</span>
              <h3>Dice</h3>
              <p>Roll over or under your target. Classic simplicity.</p>
            </div>
          </div>

          <div class="game-card coming-soon">
            <div class="game-card-header">💣</div>
            <div class="game-card-body">
              <span class="badge badge-soon">Coming Soon</span>
              <h3>Mines</h3>
              <p>Avoid the mines. Cash out anytime.</p>
            </div>
          </div>

          <div class="game-card coming-soon">
            <div class="game-card-header">🔴</div>
            <div class="game-card-body">
              <span class="badge badge-soon">Coming Soon</span>
              <h3>Plinko</h3>
              <p>Drop the ball. Watch it bounce.</p>
            </div>
          </div>

          <div class="game-card coming-soon">
            <div class="game-card-header">🎰</div>
            <div class="game-card-body">
              <span class="badge badge-soon">Coming Soon</span>
              <h3>Slots</h3>
              <p>Classic slot machine action.</p>
            </div>
          </div>

          <div class="game-card coming-soon">
            <div class="game-card-header">🃏</div>
            <div class="game-card-body">
              <span class="badge badge-soon">Coming Soon</span>
              <h3>Video Poker</h3>
              <p>Draw, hold, win.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupListeners() {
    this.socket.on('round:update', (data) => {
      const mult = document.getElementById('crash-multiplier');
      const status = document.getElementById('crash-status');
      if (mult) {
        mult.textContent = data.multiplier.toFixed(2) + 'x';
        mult.style.color = 'var(--neon-green)';
      }
      if (status) status.textContent = 'Running - Cash out now!';
    });

    this.socket.on('round:waiting', () => {
      const mult = document.getElementById('crash-multiplier');
      const status = document.getElementById('crash-status');
      if (mult) {
        mult.textContent = '1.00x';
        mult.style.color = 'var(--text-secondary)';
      }
      if (status) status.textContent = 'Waiting for next round...';
    });

    this.socket.on('round:crash', (data) => {
      const mult = document.getElementById('crash-multiplier');
      const status = document.getElementById('crash-status');
      if (mult) {
        mult.textContent = 'Crashed ' + data.crashPoint.toFixed(2) + 'x';
        mult.style.color = 'var(--crash-red)';
      }
      if (status) status.textContent = 'Round ended. Next round starting soon...';
    });
  }

  destroy() {}
}