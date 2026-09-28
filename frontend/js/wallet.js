const walletModal = {
  modal: document.getElementById('wallet-modal'),
  open() { this.modal.classList.add('active'); fetchWalletBalance(); loadTransactions(); },
  close() { this.modal.classList.remove('active'); }
};

function showDeposit() {
  document.getElementById('deposit-section').classList.remove('hidden');
  document.getElementById('withdraw-section').classList.add('hidden');
}
function showWithdraw() {
  document.getElementById('deposit-section').classList.add('hidden');
  document.getElementById('withdraw-section').classList.remove('hidden');
}
function setAmount(a) { document.getElementById('deposit-amount').value = a; }

function updateWalletBalance(balance) {
  const v = parseFloat(balance).toFixed(2);
  const el1 = document.getElementById('wallet-balance');
  const el2 = document.getElementById('modal-wallet-balance');
  if (el1) el1.textContent = v;
  if (el2) el2.textContent = v;
}

async function fetchWalletBalance() {
  if (!getToken()) return;
  const r = await apiFetch('/wallet/balance');
  if (r.success) {
    updateWalletBalance(r.balance);
    const u = getUser(); if (u) { u.balance = r.balance; localStorage.setItem('user', JSON.stringify(u)); }
  }
}

// ✅ DEPOSIT — BladePay cashier pe redirect
async function processDeposit() {
  const amount = parseFloat(document.getElementById('deposit-amount').value);
  if (!amount || amount < 100) return showNotification('Minimum deposit is ₹100', 'error');

  const r = await apiFetch('/payin/create', { method: 'POST', body: { amount } });
  if (r.success && r.cashierUrl) {
    showNotification('Redirecting to secure checkout...', 'success');
    setTimeout(() => { location.href = r.cashierUrl; }, 600);
  } else {
    showNotification(r.message || 'Deposit failed', 'error');
  }
}

async function processWithdraw() {
  const upiId = document.getElementById('withdraw-upi').value.trim();
  const name = document.getElementById('withdraw-name').value.trim();
  const amount = parseFloat(document.getElementById('withdraw-amount').value);

  if (!upiId || !name || !amount) return showNotification('Fill all fields', 'error');
  if (amount < 100) return showNotification('Minimum withdrawal ₹100', 'error');

  const r = await apiFetch('/payout/withdraw', {
    method: 'POST',
    body: { upiId, name, amount, phone: getUser()?.phone }
  });

  if (r.success) {
    showNotification('Withdrawal submitted!', 'success');
    updateWalletBalance(r.newBalance);
    walletModal.close();
  } else showNotification(r.message, 'error');
}

async function loadTransactions() {
  if (!getToken()) return;
  const r = await apiFetch('/wallet/transactions');
  const box = document.getElementById('transactions-list');
  if (!box) return;
  if (!r.success || !r.transactions.length) {
    box.innerHTML = '<div class="empty-state">No transactions yet</div>';
    return;
  }
  box.innerHTML = r.transactions.map(t => `
    <div class="transaction-item">
      <div>
        <span class="tx-type">${t.type} · ${t.status}</span>
        <span class="tx-date">${new Date(t.date).toLocaleString()}</span>
      </div>
      <span class="tx-amount ${['deposit','win'].includes(t.type) ? 'credit' : 'debit'}">
        ₹${t.amount}
      </span>
    </div>`).join('');
}