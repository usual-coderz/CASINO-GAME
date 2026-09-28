const walletModal = {
    modal: document.getElementById('wallet-modal'),

    open() {
        this.modal.classList.add('active');
        fetchWalletBalance();
        loadTransactions();
    },

    close() {
        this.modal.classList.remove('active');
    }
};

function showDeposit() {
    document.getElementById('deposit-section').classList.remove('hidden');
    document.getElementById('withdraw-section').classList.add('hidden');
}

function showWithdraw() {
    document.getElementById('deposit-section').classList.add('hidden');
    document.getElementById('withdraw-section').classList.remove('hidden');
}

function setAmount(amount) {
    document.getElementById('deposit-amount').value = amount;
}

function updateWalletBalance(balance) {
    const formatted = parseFloat(balance).toFixed(2);
    document.getElementById('wallet-balance').textContent = formatted;
    document.getElementById('modal-wallet-balance').textContent = formatted;
}

async function fetchWalletBalance() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/wallet/balance`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (result.success) {
            updateWalletBalance(result.balance);

            const user = JSON.parse(localStorage.getItem('user'));
            user.balance = result.balance;
            localStorage.setItem('user', JSON.stringify(user));
        }
    } catch (error) {
        console.error('Failed to fetch balance:', error);
    }
}

async function processDeposit() {
    const amount = parseFloat(document.getElementById('deposit-amount').value);

    if (!amount || amount < 100) {
        showNotification('Minimum deposit amount is \u20b9100', 'error');
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/wallet/deposit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amount })
        });

        const result = await response.json();

        if (result.success && result.paymentUrl) {
            window.location.href = result.paymentUrl;
        } else {
            showNotification(result.message || 'Deposit failed', 'error');
        }
    } catch (error) {
        showNotification('Deposit failed', 'error');
    }
}

async function processWithdraw() {
    const upiId = document.getElementById('withdraw-upi').value;
    const name = document.getElementById('withdraw-name').value;
    const amount = parseFloat(document.getElementById('withdraw-amount').value);

    if (!upiId || !name || !amount) {
        showNotification('Please fill all fields', 'error');
        return;
    }

    if (amount < 100) {
        showNotification('Minimum withdrawal is \u20b9100', 'error');
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch(`${API_URL}/payout/withdraw`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                upiId,
                name,
                amount,
                phone: JSON.parse(localStorage.getItem('user')).phone
            })
        });

        const result = await response.json();

        if (result.success) {
            showNotification('Withdrawal request submitted! Processing via UPI...', 'success');
            updateWalletBalance(result.newBalance);
            walletModal.close();
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Withdrawal failed', 'error');
    }
}

async function loadTransactions() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await fetch(`${API_URL}/wallet/transactions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const result = await response.json();

        if (result.success && result.transactions.length > 0) {
            const container = document.getElementById('transactions-list');
            container.innerHTML = result.transactions.map(tx => `
                <div class="transaction-item">
                    <div class="tx-info">
                        <span class="tx-type">${tx.type}</span>
                        <span class="tx-date">${new Date(tx.createdAt).toLocaleDateString()}</span>
                    </div>
                    <span class="tx-amount ${tx.status === 'FAILED' ? 'debit' : 'credit'}">\u20b9${tx.amount}</span>
                </div>
            `).join('');
        } else {
            document.getElementById('transactions-list').innerHTML = '<div class="empty-state">No transactions yet</div>';
        }
    } catch (error) {
        console.error('Failed to load transactions:', error);
    }
}

function startPlaying() {
    const token = localStorage.getItem('token');
    if (!token) {
        authModal.open('signup');
    } else {
        document.getElementById('games').scrollIntoView({ behavior: 'smooth' });
    }
}