const amountInput = document.getElementById('amount');
const selectedAmount = document.getElementById('selected-amount');
const availableBalance = document.getElementById('available-balance');
const withdrawButton = document.getElementById('withdraw-button');

const toast = document.getElementById('withdraw-toast');
const toastTitle = document.getElementById('toast-title');
const toastMessage = document.getElementById('toast-message');
const toastClose = document.getElementById('toast-close');

let selectedValue = 0;
let currentBalance = 0;
let toastTimer;

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
}

function loadBalance() {
  const user = getUser();

  currentBalance = Number(user?.balance || 0);

  availableBalance.textContent =
    `₹${currentBalance.toFixed(2)}`;
}

function formatAmount(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

function updateAmount(value) {
  selectedValue = Number(value) || 0;

  selectedAmount.textContent =
    formatAmount(selectedValue);

  document
    .querySelectorAll('.amount-option')
    .forEach(button => {
      button.classList.toggle(
        'selected',
        Number(button.dataset.amount) === selectedValue
      );
    });
}

function showToast(title, message) {
  toastTitle.textContent = title;
  toastMessage.textContent = message;

  toast.classList.add('show');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

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

withdrawButton.addEventListener('click', () => {
  if (!selectedValue) {
    showToast(
      'Select an amount',
      'Please choose an amount before continuing.'
    );
    return;
  }

  if (selectedValue < 100) {
    showToast(
      'Amount too low',
      'Minimum request is ₹100.'
    );
    return;
  }

  if (selectedValue > 10000) {
    showToast(
      'Amount too high',
      'Maximum request is ₹10,000.'
    );
    return;
  }

  if (selectedValue > currentBalance) {
    showToast(
      'Insufficient balance',
      'The requested amount exceeds your current balance.'
    );
    return;
  }

  showToast(
    'Withdrawal',
    'Withdrawal requests are not enabled in this demo.'
  );
});

document
  .querySelector('.method-row')
  ?.addEventListener('click', () => {
    showToast(
      'Account details',
      'Payout account setup will be available soon.'
    );
  });

document
  .getElementById('help-button')
  ?.addEventListener('click', () => {
    showToast(
      'Withdrawal help',
      'Choose an amount and review your account details.'
    );
  });

toastClose?.addEventListener('click', () => {
  toast.classList.remove('show');
});

loadBalance();