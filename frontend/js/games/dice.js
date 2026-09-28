let direction = 'under';
let rolling = false;

function setBet(a) { document.getElementById('bet-amount').value = a; updateSlider(); }
function halfBet() { const i = document.getElementById('bet-amount'); i.value = Math.max(10, Math.floor(i.value / 2)); }
function doubleBet() { const i = document.getElementById('bet-amount'); i.value = Math.min(10000, Math.floor(i.value * 2)); }

function setDirection(d) {
  direction = d;
  document.getElementById('btn-under').classList.toggle('active', d === 'under');
  document.getElementById('btn-over').classList.toggle('active', d === 'over');
  updateSlider();
}

function updateSlider() {
  const target = parseInt(document.getElementById('target-slider').value, 10);
  const chance = direction === 'under' ? (target - 1) / 100 : (100 - target) / 100;
  const mult = Math.round(((1 - 0.02) / chance) * 100) / 100;

  document.getElementById('target-label').textContent = target;
  document.getElementById('mult-label').textContent = `${mult.toFixed(2)}x`;
  document.getElementById('chance-label').textContent = `${(chance * 100).toFixed(1)}%`;

  const msg = document.getElementById('bet-msg');
  const bet = parseFloat(document.getElementById('bet-amount').value) || 0;
  msg.textContent = bet ? `Win → ₹${(bet * mult).toFixed(2)}` : '';
}

async function loadBalance() {
  const r = await apiFetch('/wallet/balance');
  if (r.success) updateWalletBalance(r.balance);
  else location.href = '/';   // not logged in
}

async function loadHistory() {
  const r = await apiFetch('/game/history');
  const box = document.getElementById('history-list');
  if (!r.success) return;
  box.innerHTML = r.bets.length
    ? r.bets.map(b => `
        <div class="history-item">
          <span class="roll ${b.won ? 'win' : 'lose'}">${b.roll}</span>
          <span>${b.direction} ${b.target}</span>
          <span class="${b.won ? 'credit' : 'debit'}">${b.won ? '+' : '-'}₹${Math.abs(b.profit)}</span>
        </div>`).join('')
    : '<div class="empty-state">No rolls yet</div>';
}

async function rollDice() {
  if (rolling) return;
  const betAmount = parseFloat(document.getElementById('bet-amount').value);
  const target = parseInt(document.getElementById('target-slider').value, 10);

  if (!betAmount || betAmount < 10) return showNotification('Minimum bet ₹10', 'error');

  rolling = true;
  const btn = document.getElementById('roll-btn');
  const out = document.getElementById('dice-result');
  btn.disabled = true;

  // suspense animation
  for (let i = 0; i < 12; i++) {
    out.textContent = Math.floor(Math.random() * 100) + 1;
    await new Promise(r => setTimeout(r, 45));
  }

  const r = await apiFetch('/game/dice/roll', {
    method: 'POST',
    body: { betAmount, direction, target }
  });

  btn.disabled = false;
  rolling = false;

  if (!r.success) { out.textContent = '--'; return showNotification(r.message, 'error'); }

  out.textContent = r.roll;
  out.className = `dice-result ${r.won ? 'win' : 'lose'}`;
  updateWalletBalance(r.balance);
  showNotification(
    r.won ? `You won ₹${r.payout} (${r.multiplier}x)` : `Lost ₹${betAmount}`,
    r.won ? 'success' : 'error'
  );
  loadHistory();
}

document.getElementById('target-slider').addEventListener('input', updateSlider);
document.getElementById('bet-amount').addEventListener('input', updateSlider);
document.getElementById('btn-under').addEventListener('click', () => setDirection('under'));
document.getElementById('btn-over').addEventListener('click', () => setDirection('over'));

(async function init() {
  await loadBalance();
  updateSlider();
  loadHistory();
})();