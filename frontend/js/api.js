const API_URL = `${location.origin}/api`;

function getToken() { return localStorage.getItem('token'); }
function getUser()  { try { return JSON.parse(localStorage.getItem('user')) || null; } catch { return null; } }

function setSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

async function apiFetch(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

function showNotification(message, type = 'info') {
  const colors = { success: '#22c55e', error: '#ef4444', info: '#333' };
  const n = document.createElement('div');
  n.textContent = message;
  n.style.cssText = `
    position:fixed; top:80px; right:20px; padding:1rem 1.5rem;
    border-radius:8px; color:#fff; font-weight:600; z-index:3000;
    background:${colors[type] || colors.info}; box-shadow:0 8px 24px rgba(0,0,0,.4);
    animation:slideIn .3s ease;`;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3000);
}