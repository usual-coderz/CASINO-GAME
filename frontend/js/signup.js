const signupForm = document.getElementById('signup-form');

const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const casinoNameInput = document.getElementById('casino-name');
const casinoIdInput = document.getElementById('casino-id');
const passwordInput = document.getElementById('password');
const termsInput = document.getElementById('terms');

const signupSubmit = document.getElementById('signup-submit');
const generateIdButton = document.getElementById('generate-id');
const passwordToggle = document.getElementById('password-toggle');

const strengthBox = document.querySelector('.password-strength');
const strengthText = document.getElementById('strength-text');

const toast = document.getElementById('auth-toast');
const toastTitle = document.getElementById('toast-title');
const toastMessage = document.getElementById('toast-message');
const toastClose = document.getElementById('toast-close');

let toastTimer;

function showToast(title, message, type = 'success') {
  toastTitle.textContent = title;
  toastMessage.textContent = message;

  toast.classList.toggle('error', type === 'error');
  toast.classList.add('show');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

toastClose?.addEventListener('click', () => {
  toast.classList.remove('show');
});


function generatePlayerId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  let value = '';

  for (let i = 0; i < 6; i++) {
    value += chars[Math.floor(Math.random() * chars.length)];
  }

  casinoIdInput.value = `KZ-${value}`;
}

generateIdButton?.addEventListener('click', generatePlayerId);

if (!casinoIdInput.value) {
  generatePlayerId();
}


passwordToggle?.addEventListener('click', () => {
  const hidden = passwordInput.type === 'password';

  passwordInput.type = hidden ? 'text' : 'password';

  passwordToggle.innerHTML = hidden
    ? '<i class="fa-regular fa-eye-slash"></i>'
    : '<i class="fa-regular fa-eye"></i>';
});


function updatePasswordStrength() {
  const value = passwordInput.value;

  strengthBox.classList.remove(
    'weak',
    'medium',
    'good',
    'strong'
  );

  if (!value) {
    strengthText.textContent = 'Use 6 or more characters';
    return;
  }

  let score = 0;

  if (value.length >= 6) score++;
  if (value.length >= 10) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;

  if (score <= 1) {
    strengthBox.classList.add('weak');
    strengthText.textContent = 'Weak password';
    return;
  }

  if (score === 2) {
    strengthBox.classList.add('medium');
    strengthText.textContent = 'Medium password';
    return;
  }

  if (score === 3) {
    strengthBox.classList.add('good');
    strengthText.textContent = 'Good password';
    return;
  }

  strengthBox.classList.add('strong');
  strengthText.textContent = 'Strong password';
}

passwordInput?.addEventListener('input', updatePasswordStrength);


function clearErrors() {
  document.querySelectorAll('.field-error').forEach(error => {
    error.textContent = '';
  });
}


function setError(id, message) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = message;
  }
}


function validateForm() {
  clearErrors();

  let valid = true;

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const casinoName = casinoNameInput.value.trim();
  const casinoId = casinoIdInput.value.trim();
  const password = passwordInput.value;

  if (name.length < 2) {
    setError('name-error', 'Enter your full name.');
    valid = false;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError('email-error', 'Enter a valid email address.');
    valid = false;
  }

  if (!/^[0-9+\-\s()]{7,15}$/.test(phone)) {
    setError('phone-error', 'Enter a valid phone number.');
    valid = false;
  }

  if (casinoName.length < 3) {
    setError(
      'casino-name-error',
      'Player name must contain at least 3 characters.'
    );
    valid = false;
  }

  if (casinoId.length < 5) {
    setError(
      'casino-id-error',
      'Generate a valid Player ID.'
    );
    valid = false;
  }

  if (password.length < 6) {
    setError(
      'password-error',
      'Password must be at least 6 characters.'
    );
    valid = false;
  }

  if (!termsInput.checked) {
    setError(
      'terms-error',
      'Please accept the terms to continue.'
    );
    valid = false;
  }

  return valid;
}


signupForm?.addEventListener('submit', async event => {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  signupSubmit.disabled = true;
  signupSubmit.classList.add('loading');

  try {
    const response = await apiFetch('/auth/signup', {
      method: 'POST',
      body: {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        password: passwordInput.value,
        casinoName: casinoNameInput.value.trim(),
        casinoId: casinoIdInput.value.trim()
      }
    });

    if (!response.success) {
      throw new Error(
        response.message || 'Registration failed'
      );
    }

    setSession(response.token, response.user);

    showToast(
      'Account created',
      'Your Khelza account has been created.'
    );

    setTimeout(() => {
      window.location.href = '/games.html';
    }, 900);

  } catch (error) {

    showToast(
      'Registration failed',
      error.message || 'Unable to create your account.',
      'error'
    );

  } finally {

    signupSubmit.disabled = false;
    signupSubmit.classList.remove('loading');

  }
});