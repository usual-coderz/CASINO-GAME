const balanceValue = document.getElementById('balance-value');
const toggleBalance = document.getElementById('toggle-balance');

const playerName = document.getElementById('wallet-player-name');
const playerId = document.getElementById('wallet-player-id');

const toast = document.getElementById('wallet-toast');
const toastTitle = document.getElementById('wallet-toast-title');
const toastMessage = document.getElementById('wallet-toast-message');
const toastClose = document.getElementById('wallet-toast-close');

let balanceVisible = true;
let toastTimer;

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
}

function loadUser() {
  const user = getUser();

  if (!user) {
    return;
  }

  playerName.textContent = user.name || 'Player';
  playerId.textContent = user.casinoId || 'KZ-XXXXXX';

  const balance = Number(user.balance || 0);

  balanceValue.dataset.balance = balance.toFixed(2);
  balanceValue.textContent = `₹${balance.toFixed(2)}`;
}

function showToast(title, message) {
  toastTitle.textContent = title;
  toastMessage.textContent = message;

  toast.classList.add('show');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

function updateBalanceVisibility() {
  const balance = balanceValue.dataset.balance || '0.00';

  if (balanceVisible) {
    balanceValue.textContent = `₹${balance}`;

    toggleBalance.innerHTML =
      '<i class="fa-regular fa-eye"></i>';

    toggleBalance.setAttribute(
      'aria-label',
      'Hide balance'
    );
  } else {
    balanceValue.textContent = '₹••••••';

    toggleBalance.innerHTML =
      '<i class="fa-regular fa-eye-slash"></i>';

    toggleBalance.setAttribute(
      'aria-label',
      'Show balance'
    );
  }
}

toggleBalance?.addEventListener('click', () => {
  balanceVisible = !balanceVisible;
  updateBalanceVisibility();
});

toastClose?.addEventListener('click', () => {
  toast.classList.remove('show');
});

document
  .querySelectorAll('.wallet-action')
  .forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;

      if (action === 'deposit') {
        showToast(
          'Deposit',
          'Wallet funding is available in the full account flow.'
        );
        return;
      }

      if (action === 'withdraw') {
        showToast(
          'Coming soon',
          'Withdraw functionality is not available yet.'
        );
      }
    });
  });

document
  .querySelectorAll('.shortcut-card')
  .forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;

      if (action === 'history') {
        showToast(
          'Transaction history',
          'Your activity history will appear here.'
        );
        return;
      }

      if (action === 'support') {
        showToast(
          'Support',
          'Support options will be available soon.'
        );
      }
    });
  });

document.getElementById('view-history')?.addEventListener('click', () => {
  showToast(
    'Transaction history',
    'There are no transactions to display.'
  );
});

document.getElementById('activity-nav')?.addEventListener('click', event => {
  event.preventDefault();

  document
    .querySelector('.activity-section')
    ?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
});

document
  .getElementById('wallet-notification')
  ?.addEventListener('click', () => {
    showToast(
      'Notifications',
      'You are all caught up.'
    );
  });

document
  .getElementById('profile-menu')
  ?.addEventListener('click', () => {
    showToast(
      'Profile',
      'Profile settings will be available soon.'
    );
  });

loadUser();