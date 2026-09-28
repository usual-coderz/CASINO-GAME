const loginForm = document.getElementById('login-form');
const loginValue = document.getElementById('login-value');
const password = document.getElementById('password');

const loginValueError = document.getElementById('login-value-error');
const passwordError = document.getElementById('password-error');

const loginSubmit = document.getElementById('login-submit');

const passwordToggle = document.getElementById('password-toggle');
const forgotPassword = document.getElementById('forgot-password');

const toast = document.getElementById('auth-toast');
const toastTitle = document.getElementById('toast-title');
const toastMessage = document.getElementById('toast-message');
const toastClose = document.getElementById('toast-close');

let toastTimer;

function showToast(title, message, type = 'success') {
  toastTitle.textContent = title;
  toastMessage.textContent = message;

  toast.classList.remove('error');

  if (type === 'error') {
    toast.classList.add('error');
  }

  toast.classList.add('show');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

toastClose?.addEventListener('click', () => {
  toast.classList.remove('show');
});


function clearErrors() {
  loginValueError.textContent = '';
  passwordError.textContent = '';
}


function validateLogin() {
  clearErrors();

  let valid = true;

  if (!loginValue.value.trim()) {
    loginValueError.textContent = 'Enter your email or Player ID.';
    valid = false;
  }

  if (!password.value) {
    passwordError.textContent = 'Enter your password.';
    valid = false;
  }

  return valid;
}


passwordToggle?.addEventListener('click', () => {
  const hidden = password.type === 'password';

  password.type = hidden ? 'text' : 'password';

  passwordToggle.innerHTML = hidden
    ? '<i class="fa-regular fa-eye-slash"></i>'
    : '<i class="fa-regular fa-eye"></i>';

  passwordToggle.setAttribute(
    'aria-label',
    hidden ? 'Hide password' : 'Show password'
  );
});


forgotPassword?.addEventListener('click', () => {
  showToast(
    'Password recovery',
    'Password recovery will be available soon.',
    'error'
  );
});


loginForm?.addEventListener('submit', async event => {
  event.preventDefault();

  if (!validateLogin()) {
    return;
  }

  loginSubmit.disabled = true;
  loginSubmit.classList.add('loading');

  try {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      body: {
        email: loginValue.value.trim(),
        password: password.value
      }
    });

    if (!response.success) {
      throw new Error(response.message || 'Login failed');
    }

    setSession(response.token, response.user);

    showToast(
      'Welcome back',
      'Login successful. Redirecting...'
    );

    setTimeout(() => {
      window.location.href = '/games.html';
    }, 700);

  } catch (error) {
    showToast(
      'Login failed',
      error.message || 'Unable to sign in.',
      'error'
    );

  } finally {
    loginSubmit.disabled = false;
    loginSubmit.classList.remove('loading');
  }
});