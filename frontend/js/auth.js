function generateCasinoId() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return `RV-${window.crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase()}`;
  }

  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `RV-${random}`;
}

const authModal = {
  modal: document.getElementById('auth-modal'),

  open(tab = 'login') {
    this.modal?.classList.add('active');
    this.switch(tab);
  },

  close() {
    this.modal?.classList.remove('active');
  },

  switch(tab) {
    document.querySelectorAll('.tab-btn').forEach(button => {
      button.classList.toggle('active', button.dataset.tab === tab);
    });

    document.getElementById('login-form')?.classList.toggle('hidden', tab !== 'login');
    document.getElementById('signup-form')?.classList.toggle('hidden', tab !== 'signup');
  }
};

document.getElementById('signup-form')?.addEventListener('submit', async event => {
  event.preventDefault();

  const data = {
    name: document.getElementById('signup-name').value.trim(),
    email: document.getElementById('signup-email').value.trim().toLowerCase(),
    phone: document.getElementById('signup-phone').value.trim(),
    password: document.getElementById('signup-password').value,
    casinoName: document.getElementById('signup-casino-name').value.trim(),
    casinoId: generateCasinoId()
  };

  if (!data.name || !data.email || !data.phone || !data.password || !data.casinoName) {
    showNotification('Please fill all fields', 'error');
    return;
  }

  if (data.password.length < 6) {
    showNotification('Password must be at least 6 characters', 'error');
    return;
  }

  try {
    const response = await apiFetch('/auth/signup', {
      method: 'POST',
      body: data
    });

    console.log('Signup response:', response);

    if (!response.success) {
      showNotification(response.message || 'Registration failed', 'error');
      return;
    }

    setSession(response.token, response.user);
    updateUIForLoggedInUser(response.user);
    authModal.close();

    showNotification(
      `Welcome to Royal Vegas, ${response.user.casinoName}!`,
      'success'
    );
  } catch (error) {
    console.error('Signup error:', error);
    showNotification('Unable to connect to server', 'error');
  }
});

document.getElementById('login-form')?.addEventListener('submit', async event => {
  event.preventDefault();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) {
    showNotification('Please enter your login details', 'error');
    return;
  }

  try {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: {
        email,
        password
      }
    });

    if (!response.success) {
      showNotification(response.message || 'Login failed', 'error');
      return;
    }

    setSession(response.token, response.user);
    updateUIForLoggedInUser(response.user);
    authModal.close();

    showNotification('Welcome back!', 'success');
  } catch (error) {
    console.error('Login error:', error);
    showNotification('Unable to connect to server', 'error');
  }
});

function updateUIForLoggedInUser(user) {
  document.getElementById('guest-view').classList.add('hidden');
  document.getElementById('user-view').classList.remove('hidden');

  document.getElementById('username-display').textContent =
    user.casinoName || user.name;

  document.getElementById('player-id').textContent =
    user.casinoId || '-';

  document.getElementById('player-name').textContent =
    user.casinoName || user.name;

  updateWalletBalance(user.balance || 0);
}

function logout() {
  clearSession();

  document.getElementById('guest-view').classList.remove('hidden');
  document.getElementById('user-view').classList.add('hidden');
  document.getElementById('profile-menu')?.classList.remove('active');

  showNotification('Logged out', 'info');
}

function toggleProfile() {
  document.getElementById('profile-menu')?.classList.toggle('active');
}

async function checkAuth() {
  const user = getUser();

  if (!user || !getToken()) {
    document.getElementById('guest-view').classList.remove('hidden');
    document.getElementById('user-view').classList.add('hidden');
    return;
  }

  updateUIForLoggedInUser(user);

  try {
    await fetchWalletBalance();
  } catch (error) {
    console.error('Wallet error:', error);
  }
}

function startPlaying() {
  if (!getToken()) {
    authModal.open('signup');
    return;
  }

  location.href = '/games/dice';
}

document.addEventListener('DOMContentLoaded', checkAuth);