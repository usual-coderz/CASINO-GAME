const amountInput = document.getElementById('amount');
const selectedAmount = document.getElementById('selected-amount');
const currentBalance = document.getElementById('current-balance');
const continueButton = document.getElementById('continue-button');

const toast = document.getElementById('deposit-toast');
const toastTitle = document.getElementById('toast-title');
const toastMessage = document.getElementById('toast-message');
const toastClose = document.getElementById('toast-close');

let selectedValue = 0;
let toastTimer;
let isProcessing = false;

const API_BASE_URL = window.location.origin.includes('localhost') 
  ? 'http://localhost:5000' 
  : 'https://casinogame-c34130ca80b6.herokuapp.com';

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
}

function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('authToken') || '';
}

function loadBalance() {
  const user = getUser();
  const balance = Number(user?.balance || 0);
  if (currentBalance) {
    currentBalance.textContent = `₹${balance.toFixed(2)}`;
  }
}

function formatAmount(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

function updateAmount(value) {
  selectedValue = Number(value) || 0;
  if (selectedAmount) {
    selectedAmount.textContent = formatAmount(selectedValue);
  }

  document.querySelectorAll('.amount-option').forEach(button => {
    button.classList.toggle(
      'selected',
      Number(button.dataset.amount) === selectedValue
    );
  });
}

function showToast(title, message, type = 'info') {
  if (!toast) return;
  
  toastTitle.textContent = title;
  toastMessage.textContent = message;
  
  toast.className = `toast show ${type}`;
  
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

function setLoading(loading) {
  isProcessing = loading;
  if (continueButton) {
    continueButton.disabled = loading;
    continueButton.innerHTML = loading 
      ? '<span class="spinner"></span> Processing...' 
      : 'Continue';
  }
}

async function createDeposit() {
  const user = getUser();
  const token = getToken();

  if (!user) {
    showToast('Login Required', 'Please log in to make a deposit.', 'error');
    setTimeout(() => window.location.href = '/login.html', 1500);
    return;
  }

  if (!token) {
    showToast('Session Expired', 'Please log in again.', 'error');
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(`${API_BASE_URL}/api/payin/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount: selectedValue })
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to initiate deposit');
    }

    if (!data.cashierUrl) {
      throw new Error('No payment URL received from gateway');
    }

    // Store pending order for return handling
    localStorage.setItem('pendingDepositOrder', data.orderId);
    localStorage.setItem('pendingDepositAmount', selectedValue);
    
    showToast('Redirecting...', 'Taking you to secure payment page...', 'success');
    
    // Redirect to BladePay cashier
    setTimeout(() => {
      window.location.href = data.cashierUrl;
    }, 800);

  } catch (error) {
    console.error('Deposit error:', error);
    showToast('Deposit Failed', error.message || 'Something went wrong. Please try again.', 'error');
  } finally {
    setLoading(false);
  }
}

// Event Listeners
document.querySelectorAll('.amount-option').forEach(button => {
  button.addEventListener('click', () => {
    const value = Number(button.dataset.amount);
    if (amountInput) amountInput.value = value;
    updateAmount(value);
  });
});

if (amountInput) {
  amountInput.addEventListener('input', (e) => {
    updateAmount(e.target.value);
  });
  
  amountInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      continueButton?.click();
    }
  });
}

if (continueButton) {
  continueButton.addEventListener('click', () => {
    if (isProcessing) return;

    if (!selectedValue || selectedValue <= 0) {
      showToast('Select Amount', 'Please choose a deposit amount.', 'error');
      return;
    }

    if (selectedValue < 100) {
      showToast('Minimum Deposit', 'Minimum deposit amount is ₹100.', 'error');
      return;
    }

    if (selectedValue > 100000) {
      showToast('Maximum Exceeded', 'Maximum deposit amount is ₹1,00,000.', 'error');
      return;
    }

    createDeposit();
  });
}

document.getElementById('help-button')?.addEventListener('click', () => {
  showToast('How to Deposit', 'Select an amount, click Continue, and complete payment on the secure gateway.');
});

toastClose?.addEventListener('click', () => {
  toast?.classList.remove('show');
});

// Handle return from payment gateway
function handlePaymentReturn() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order');
  const status = urlParams.get('status');
  const pendingOrder = localStorage.getItem('pendingDepositOrder');
  
  if (orderId && orderId === pendingOrder) {
    if (status === 'success') {
      showToast('Payment Successful!', 'Your deposit has been credited to your wallet.', 'success');
      localStorage.removeItem('pendingDepositOrder');
      localStorage.removeItem('pendingDepositAmount');
      
      // Refresh user data to show updated balance
      setTimeout(() => {
        fetch(`${API_BASE_URL}/api/user/profile`, {
          headers: { 'Authorization': `Bearer ${getToken()}` }
        })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            localStorage.setItem('user', JSON.stringify(data.user));
            loadBalance();
          }
        })
        .catch(console.error);
      }, 1000);
    } else if (status === 'failed' || status === 'cancelled') {
      showToast('Payment Failed', 'Your deposit was not completed. Please try again.', 'error');
      localStorage.removeItem('pendingDepositOrder');
      localStorage.removeItem('pendingDepositAmount');
    }
    
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// Initialize
loadBalance();
handlePaymentReturn();