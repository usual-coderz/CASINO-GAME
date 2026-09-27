/**
 * PROFILE VIEW
 * Wallet, stats, history, fairness, settings tabs
 */

export class ProfileView {
  constructor(container, socket, state) {
    this.container = container;
    this.socket = socket;
    this.state = state;
    this.profileData = null;
    
    this.render();
    this.loadProfile();
    this.setupListeners();
  }

  render() {
    this.container.innerHTML = `
      <div class="view profile-container">
        <div class="profile-header">
          <h1>Profile</h1>
          <p style="color: var(--text-secondary);">Manage your account, view stats, and verify fairness</p>
        </div>

        <div class="profile-tabs">
          <button class="tab-btn active" data-tab="wallet">Wallet</button>
          <button class="tab-btn" data-tab="stats">Stats</button>
          <button class="tab-btn" data-tab="history">Bet History</button>
          <button class="tab-btn" data-tab="fairness">Provably Fair</button>
          <button class="tab-btn" data-tab="settings">Settings</button>
        </div>

        <!-- Wallet Tab -->
        <div class="tab-panel active" id="tab-wallet">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-card-label">Current Balance</div>
              <div class="stat-card-value" id="wallet-balance">₹10,000.00</div>
            </div>
          </div>
          
          <button class="btn btn-primary" id="reset-wallet-btn" style="margin-bottom: 24px;">
            Reset Demo Balance
          </button>

          <h3 style="margin-bottom: 16px;">Transaction Ledger</h3>
          <div class="data-table">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Round</th>
                  <th>Reason</th>
                  <th>Amount</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody id="ledger-body">
                <!-- Ledger entries -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Stats Tab -->
        <div class="tab-panel" id="tab-stats">
          <div class="stats-grid" id="stats-grid">
            <!-- Stats injected here -->
          </div>
        </div>

        <!-- History Tab -->
        <div class="tab-panel" id="tab-history">
          <div class="data-table">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Round</th>
                  <th>Bet</th>
                  <th>Cashout</th>
                  <th>Profit/Loss</th>
                </tr>
              </thead>
              <tbody id="bets-body">
                <!-- Bet history -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Fairness Tab -->
        <div class="tab-panel" id="tab-fairness">
          <div class="fairness-panel">
            <h3 style="margin-bottom: 20px;">Provably Fair Verification</h3>
            
            <div class="seed-display">
              <div class="seed-label">Current Server Seed Hash (SHA256)</div>
              <div id="current-seed-hash">Loading...</div>
            </div>

            <div class="seed-display">
              <div class="seed-label">Your Client Seed</div>
              <div id="client-seed-display">Loading...</div>
            </div>

            <p style="color: var(--text-secondary); font-size: 14px; margin-top: 16px;">
              The server seed hash is published before each round. After the round ends, 
              the server seed is revealed and can be verified against the hash. 
              The crash point is calculated using HMAC-SHA256(serverSeed, clientSeed:nonce).
            </p>
            
            <a href="/fairness.html" target="_blank" class="btn btn-secondary" style="margin-top: 16px;">
              Open Verifier Tool
            </a>
          </div>

          <h3 style="margin: 24px 0 16px;">Previous Rounds</h3>
          <div class="data-table">
            <table>
              <thead>
                <tr>
                  <th>Round</th>
                  <th>Crash Point</th>
                  <th>Server Seed</th>
                  <th>Verify</th>
                </tr>
              </thead>
              <tbody id="rounds-body">
                <!-- Previous rounds -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Settings Tab -->
        <div class="tab-panel" id="tab-settings">
          <div class="settings-group">
            <h3>Display</h3>
            <div class="setting-item">
              <div>
                <div class="setting-label">Display Name</div>
                <div class="setting-desc">How other players see you</div>
              </div>
              <input type="text" id="display-name" class="input-wrapper" style="width: 200px; padding: 8px;" 
                     placeholder="Enter name...">
            </div>
          </div>

          <div class="settings-group">
            <h3>Game</h3>
            <div class="setting-item">
              <div>
                <div class="setting-label">Sound Effects</div>
                <div class="setting-desc">Play sounds during gameplay</div>
              </div>
              <div class="toggle" id="sound-toggle">
                <div class="toggle-thumb"></div>
              </div>
            </div>
            <div class="setting-item">
              <div>
                <div class="setting-label">Auto Cashout Default</div>
                <div class="setting-desc">Default multiplier for auto cashout</div>
              </div>
              <input type="number" id="default-autocashout" value="2.00" step="0.01" 
                     style="width: 100px; padding: 8px; background: var(--bg-primary); border: 1px solid var(--border-color); 
                            border-radius: var(--radius); color: var(--text-primary);">
            </div>
          </div>

          <div class="settings-group">
            <h3>Fairness</h3>
            <div class="setting-item">
              <div>
                <div class="setting-label">Rotate Client Seed</div>
                <div class="setting-desc">Generate a new client seed for future rounds</div>
              </div>
              <button class="btn btn-secondary" id="rotate-seed-btn">Rotate Seed</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.target.dataset.tab;
        
        // Update active states
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        
        e.target.classList.add('active');
        document.getElementById(`tab-${tab}`).classList.add('active');
      });
    });

    // Reset balance
    document.getElementById('reset-wallet-btn')?.addEventListener('click', () => {
      this.socket.emit('player:resetBalance', {}, (response) => {
        if (response.success) {
          this.loadProfile();
          window.app.showToast('Success', 'Balance reset to ₹10,000.00', 'success');
        }
      });
    });

    // Rotate seed
    document.getElementById('rotate-seed-btn')?.addEventListener('click', () => {
      this.socket.emit('player:rotateSeed', {}, (response) => {
        if (response.success) {
          document.getElementById('client-seed-display').textContent = response.clientSeed;
          window.app.showToast('Success', 'Client seed rotated', 'success');
        }
      });
    });

    // Sound toggle
    document.getElementById('sound-toggle')?.addEventListener('click', function() {
      this.classList.toggle('active');
    });

    // Display name
    document.getElementById('display-name')?.addEventListener('change', (e) => {
      this.socket.emit('player:setDisplayName', { name: e.target.value }, (response) => {
        if (response.success) {
          window.app.showToast('Success', 'Display name updated', 'success');
        }
      });
    });
  }

  loadProfile() {
    this.socket.emit('player:getProfile', {}, (response) => {
      if (response.success) {
        this.profileData = response;
        this.populateData();
      }
    });
  }

  populateData() {
    if (!this.profileData) return;

    const { profile, balance, stats, ledger, bets } = this.profileData;

    // Wallet
    document.getElementById('wallet-balance').textContent = 
      '₹' + balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    document.getElementById('ledger-body').innerHTML = ledger.entries.map(entry => {
      const time = new Date(entry.time).toLocaleTimeString();
      const amountClass = entry.amount > 0 ? 'positive' : (entry.amount < 0 ? 'negative' : '');
      const sign = entry.amount > 0 ? '+' : '';
      return `
        <tr>
          <td>${time}</td>
          <td>${entry.roundId ? entry.roundId.slice(0, 8) + '...' : '-'}</td>
          <td>${entry.reason}</td>
          <td class="${amountClass}">${sign}₹${Math.abs(entry.amount).toFixed(2)}</td>
          <td>₹${entry.balanceAfter.toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    // Stats
    const statsGrid = document.getElementById('stats-grid');
    if (statsGrid) {
      statsGrid.innerHTML = `
        <div class="stat-card">
          <div class="stat-card-label">Total Bets</div>
          <div class="stat-card-value">${stats.totalBets}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Total Wagered</div>
          <div class="stat-card-value">₹${stats.totalWagered.toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Total Profit/Loss</div>
          <div class="stat-card-value ${stats.totalProfit >= 0 ? 'positive' : 'negative'}">
            ${stats.totalProfit >= 0 ? '+' : ''}₹${stats.totalProfit.toFixed(2)}
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Win Rate</div>
          <div class="stat-card-value">
            ${stats.totalBets > 0 ? ((stats.wins / stats.totalBets) * 100).toFixed(1) : 0}%
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Biggest Win</div>
          <div class="stat-card-value positive">${stats.biggestWinMultiplier.toFixed(2)}x</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">Best Payout</div>
          <div class="stat-card-value positive">₹${stats.bestPayout.toFixed(2)}</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-label">ROI</div>
          <div class="stat-card-value ${stats.roi >= 0 ? 'positive' : 'negative'}">
            ${stats.roi >= 0 ? '+' : ''}${stats.roi}%
          </div>
        </div>
      `;
    }

    // Bet History
    document.getElementById('bets-body').innerHTML = bets.bets.map(bet => {
      const time = new Date(bet.time).toLocaleString();
      const profitClass = bet.profit > 0 ? 'positive' : (bet.profit < 0 ? 'negative' : '');
      const sign = bet.profit > 0 ? '+' : '';
      return `
        <tr>
          <td>${time}</td>
          <td>${bet.roundId.slice(0, 8)}...</td>
          <td>₹${bet.amount.toFixed(2)}</td>
          <td>${bet.cashoutAt ? bet.cashoutAt.toFixed(2) + 'x' : 'Crashed'}</td>
          <td class="${profitClass}">${sign}₹${bet.profit ? bet.profit.toFixed(2) : '-'}</td>
        </tr>
      `;
    }).join('');

    // Fairness
    document.getElementById('client-seed-display').textContent = profile.clientSeed;
    
    // Request current round info for seed hash
    this.socket.emit('player:getProfile', {}, (resp) => {
      if (resp.success) {
        // Use last known or current
        document.getElementById('current-seed-hash').textContent = 
          this.state.history[0]?.serverSeedHash || 'Waiting for next round...';
      }
    });

    // Previous rounds from state
    document.getElementById('rounds-body').innerHTML = this.state.history.slice(0, 10).map((round, i) => `
      <tr>
        <td>${this.state.history.length - i}</td>
        <td>${round.crashPoint.toFixed(2)}x</td>
        <td style="font-family: monospace; font-size: 11px;">${round.serverSeed ? round.serverSeed.slice(0, 20) + '...' : 'Hidden'}</td>
        <td>
          ${round.serverSeed ? 
            `<a href="/fairness.html?seed=${round.serverSeed}&hash=${round.serverSeedHash}&crash=${round.crashPoint}" 
                target="_blank" class="btn btn-small btn-secondary">Verify</a>` 
            : '-'}
        </td>
      </tr>
    `).join('');
  }

  destroy() {}
}