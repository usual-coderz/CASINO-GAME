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

const API_BASE_URL = 'https://casinogame-c34130ca80b6.herokuapp.com';

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
}

function getToken() {
  return localStorage.getItem('token') || '';
}

function loadBalance() {
  const user = getUser();
  const balance = Number(user?.balance || 0);
  currentBalance.textContent = `₹${balance.toFixed(2)}`;
}

function formatAmount(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

function updateAmount(value) {
  selectedValue = Number(value) || 0;
  selectedAmount.textContent = formatAmount(selectedValue);

  document
    .querySelectorAll('.amount-option')
    .forEach(button => {
      button.classList.toggle(
        'selected',
        Number(button.dataset.amount) === selectedValue
      );
    });
}

function showToast(title, message, type = 'info') {
  toastTitle.textContent = title;
  toastMessage.textContent = message;
  
  toast.className = 'toast show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

function setLoading(loading) {
  isProcessing = loading;
  continueButton.disabled = loading;
  continueButton.textContent = loading ? 'Processing...' : 'Continue';
}

async function createDeposit() {
  const user = getUser();
  const token = getToken();

  if (!user || !token) {
    showToast('Login required', 'Please log in to make a deposit.', 'error');
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

    if (!data.success) {
      throw new Error(data.message || 'Failed to create deposit');
    }

    // Save order ID for reference
    localStorage.setItem('pendingDepositOrder', data.orderId);
    
    showToast('Redirecting...', 'Taking you to secure payment page.', 'success');
    
    // Redirect to BladePay cashier
    setTimeout(() => {
      window.location.href = data.cashierUrl;
    }, 500);

  } catch (error) {
    console.error('Deposit error:', error);
    showToast('Deposit Failed', error.message || 'Something went wrong. Try again.', 'error');
  } finally {
    setLoading(false);
  }
}

// Event Listeners
document
  .querySelectorAll('.amount-option')
  .forEach(button => {
    button.addEventListener('click', () => {
      const value = Number(button.dataset.amount);
      amountInput.value = value;
      updateAmount(value);
    });
  });

amountInput.addEventListener('input', () => {
  updateAmount(amountInput.value);
});

continueButton.addEventListener('click', () => {
  if (isProcessing) return;

  if (!selectedValue) {
    showToast('Select an amount', 'Please choose an amount before continuing.', 'error');
    return;
  }

  if (selectedValue < 100) {
    showToast('Amount too low', 'Minimum amount is ₹100.', 'error');
    return;
  }

  if (selectedValue > 10000) {
    showToast('Amount too high', 'Maximum amount is ₹10,000.', 'error');
    return;
  }

  createDeposit();
});

document.getElementById('help-button')?.addEventListener('click', () => {
  showToast('Deposit help', 'Select an amount and continue to view available options.');
});

toastClose?.addEventListener('click', () => {
  toast.classList.remove('show');
});

// Check for returning from payment
function checkPaymentReturn() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('order');
  const status = urlParams.get('status');
  
  if (orderId && status === 'success') {
    showToast('Payment Successful', 'Your deposit has been credited!', 'success');
    localStorage.removeItem('pendingDepositOrder');
    // Refresh balance after successful payment
    setTimeout(() => window.location.reload(), 2000);
  }
}

loadBalance();
checkPaymentReturn();