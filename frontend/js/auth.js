function generateCasinoId() {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const stamp = Date.now().toString(36).substring(0, 3).toUpperCase();
  return `RV-${random}-${stamp}`;
}

const authModal = {
  modal: document.getElementById('auth-modal'),
  open(tab = 'login') { this.modal.classList.add('active'); this.switch(tab); },
  close() { this.modal.classList.remove('active'); },
  switch(tab) {
    document.querySelectorAll('.tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === tab));
    document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
    document.getElementById('signup-form').classList.toggle('hidden', tab !== 'signup');
  }
};

document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    name: document.getElementById('signup-name').value,
    email: document.getElementById('signup-email').value,
    phone: document.getElementById('signup-phone').value,
    password: document.getElementById('signup-password').value,
    casinoName: document.getElementById('signup-casino-name').value,
    casinoId: generateCasinoId()
  };
  const r = await apiFetch('/auth/signup', { method: 'POST', body: data });
  if (r.success) {
    setSession(r.token, r.user);
    updateUIForLoggedInUser(r.user);
    authModal.close();
    showNotification('Welcome to Royal Vegas!', 'success');
  } else showNotification(r.message, 'error');
});

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    email: document.getElementById('login-email').value,
    password: document.getElementById('login-password').value
  };
  const r = await apiFetch('/auth/login', { method: 'POST', body: data });
  if (r.success) {
    setSession(r.token, r.user);
    updateUIForLoggedInUser(r.user);
    authModal.close();
    showNotification('Welcome back!', 'success');
  } else showNotification(r.message, 'error');
});

function updateUIForLoggedInUser(user) {
  document.getElementById('guest-view').classList.add('hidden');
  document.getElementById('user-view').classList.remove('hidden');
  document.getElementById('username-display').textContent = user.casinoName || user.name;
  document.getElementById('player-id').textContent = user.casinoId;
  document.getElementById('player-name').textContent = user.casinoName || user.name;
  updateWalletBalance(user.balance || 0);
}

function logout() {
  clearSession();
  document.getElementById('guest-view').classList.remove('hidden');
  document.getElementById('user-view').classList.add('hidden');
  showNotification('Logged out', 'info');
}

function toggleProfile() {
  document.getElementById('profile-menu').classList.toggle('active');
}

function checkAuth() {
  const user = getUser();
  if (user) { updateUIForLoggedInUser(user); fetchWalletBalance(); }
}

function startPlaying() {
  if (!getToken()) return authModal.open('signup');
  location.href = '/games/dice';
}

document.addEventListener('DOMContentLoaded', checkAuth);