const profileName = document.getElementById('profile-name');
const profileId = document.getElementById('profile-id');
const avatar = document.getElementById('avatar');

const detailName = document.getElementById('detail-name');
const detailEmail = document.getElementById('detail-email');
const detailPhone = document.getElementById('detail-phone');
const detailPlayerName = document.getElementById('detail-player-name');
const detailPlayerId = document.getElementById('detail-player-id');
const profileBalance = document.getElementById('profile-balance');

const toast = document.getElementById('profile-toast');
const toastTitle = document.getElementById('toast-title');
const toastMessage = document.getElementById('toast-message');
const toastClose = document.getElementById('toast-close');

let toastTimer;

function getUser() {
  try {
    const data = localStorage.getItem('user');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
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

function loadProfile() {
  const user = getUser();

  if (!user) {
    profileName.textContent = 'Player';
    profileId.textContent = 'KZ-XXXXXX';
    detailName.textContent = '—';
    detailEmail.textContent = '—';
    detailPhone.textContent = '—';
    detailPlayerName.textContent = '—';
    detailPlayerId.textContent = '—';
    profileBalance.textContent = '₹0.00';
    avatar.textContent = 'P';
    return;
  }

  const name = user.name || 'Player';
  const playerId = user.casinoId || 'KZ-XXXXXX';

  profileName.textContent = name;
  profileId.textContent = playerId;

  detailName.textContent = name;
  detailEmail.textContent = user.email || '—';
  detailPhone.textContent = user.phone || '—';
  detailPlayerName.textContent = user.casinoName || '—';
  detailPlayerId.textContent = playerId;

  profileBalance.textContent =
    `₹${Number(user.balance || 0).toFixed(2)}`;

  avatar.textContent =
    name.trim().charAt(0).toUpperCase() || 'P';
}

document
  .getElementById('settings-button')
  ?.addEventListener('click', () => {
    showToast(
      'Settings',
      'Account settings will be available soon.'
    );
  });

document
  .getElementById('security-button')
  ?.addEventListener('click', () => {
    showToast(
      'Security',
      'Security settings are coming soon.'
    );
  });

document
  .getElementById('notifications-button')
  ?.addEventListener('click', () => {
    showToast(
      'Notifications',
      'Notification preferences are coming soon.'
    );
  });

document
  .getElementById('support-button')
  ?.addEventListener('click', () => {
    showToast(
      'Help & Support',
      'Support options will be available soon.'
    );
  });

document
  .getElementById('logout-button')
  ?.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    window.location.replace('/login.html');
  });

toastClose?.addEventListener('click', () => {
  toast?.classList.remove('show');
  clearTimeout(toastTimer);
});

loadProfile();