const API_URL = `${location.origin}/api`;

function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
}

function setSession(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

async function apiFetch(path, { method = 'GET', body } = {}) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await response.text();

    console.error('Non-JSON API response:', {
      status: response.status,
      url: response.url,
      response: text
    });

    throw new Error(
      `Server returned ${response.status} instead of JSON`
    );
  }

  const data = await response.json();

  console.log('API:', path, response.status, data);

  return data;
}

function showNotification(message, type = 'info') {
  const colors = {
    success: '#22c55e',
    error: '#ef4444',
    info: '#333'
  };

  const notification = document.createElement('div');

  notification.textContent = message;

  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    color: #fff;
    font-weight: 600;
    z-index: 3000;
    background: ${colors[type] || colors.info};
    box-shadow: 0 8px 24px rgba(0,0,0,.4);
    animation: slideIn .3s ease;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}