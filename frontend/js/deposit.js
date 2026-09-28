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

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
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

continueButton.addEventListener('click', () => {
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
      'Minimum amount is ₹100.'
    );
    return;
  }

  if (selectedValue > 10000) {
    showToast(
      'Amount too high',
      'Maximum amount is ₹10,000.'
    );
    return;
  }

  showToast(
    'Payment flow',
    'Payment options will be available when this feature is enabled.'
  );
});

document.getElementById('help-button')?.addEventListener('click', () => {
  showToast(
    'Deposit help',
    'Select an amount and continue to view available options.'
  );
});

toastClose?.addEventListener('click', () => {
  toast.classList.remove('show');
});

loadBalance();