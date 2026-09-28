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
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function loadUser() {
  const user = getUser();

  if (!user) {
    if (playerName) {
      playerName.textContent = 'Guest Player';
    }

    if (playerId) {
      playerId.textContent = 'KZ-XXXXXX';
    }

    if (balanceValue) {
      balanceValue.dataset.balance = '0.00';
      balanceValue.textContent = '₹0.00';
    }

    return;
  }

  if (playerName) {
    playerName.textContent = user.name || 'Player';
  }

  if (playerId) {
    playerId.textContent = user.casinoId || 'KZ-XXXXXX';
  }

  const balance = Number(user.balance || 0);

  if (balanceValue) {
    balanceValue.dataset.balance = balance.toFixed(2);
    balanceValue.textContent = `₹${balance.toFixed(2)}`;
  }
}

function showToast(title, message) {
  if (!toast) return;

  if (toastTitle) {
    toastTitle.textContent = title;
  }

  if (toastMessage) {
    toastMessage.textContent = message;
  }

  toast.classList.add('show');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

function updateBalanceVisibility() {
  if (!balanceValue) return;

  const balance = balanceValue.dataset.balance || '0.00';

  if (balanceVisible) {
    balanceValue.textContent = `₹${balance}`;

    if (toggleBalance) {
      toggleBalance.innerHTML =
        '<i class="fa-regular fa-eye"></i>';

      toggleBalance.setAttribute(
        'aria-label',
        'Hide balance'
      );
    }
  } else {
    balanceValue.textContent = '₹••••••';

    if (toggleBalance) {
      toggleBalance.innerHTML =
        '<i class="fa-regular fa-eye-slash"></i>';

      toggleBalance.setAttribute(
        'aria-label',
        'Show balance'
      );
    }
  }
}

toggleBalance?.addEventListener('click', () => {
  balanceVisible = !balanceVisible;
  updateBalanceVisibility();
});

document
  .getElementById('profile-menu')
  ?.addEventListener('click', () => {
    window.location.href = '/profile.html';
  });

document
  .querySelectorAll('.wallet-action')
  .forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;

      if (action === 'deposit') {
        window.location.href = '/deposit.html';
        return;
      }

      if (action === 'withdraw') {
        window.location.href = '/withdraw.html';
      }
    });
  });

document
  .querySelectorAll('.shortcut-card')
  .forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;

      if (action === 'history') {
        window.location.href = '/activity.html';
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

document
  .getElementById('view-history')
  ?.addEventListener('click', () => {
    window.location.href = '/activity.html';
  });

document
  .getElementById('activity-nav')
  ?.addEventListener('click', event => {
    event.preventDefault();
    window.location.href = '/activity.html';
  });

document
  .getElementById('wallet-notification')
  ?.addEventListener('click', () => {
    showToast(
      'Notifications',
      'You are all caught up.'
    );
  });

toastClose?.addEventListener('click', () => {
  toast?.classList.remove('show');
  clearTimeout(toastTimer);
});

loadUser();