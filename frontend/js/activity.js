const activityCount = document.getElementById('activity-count');
const currentBalance = document.getElementById('current-balance');
const activityList = document.getElementById('activity-list');
const emptyState = document.getElementById('empty-state');

const toast = document.getElementById('activity-toast');
const toastTitle = document.getElementById('toast-title');
const toastMessage = document.getElementById('toast-message');
const toastClose = document.getElementById('toast-close');

let toastTimer;
let currentFilter = 'all';

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
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

function loadAccount() {
  const user = getUser();

  if (!user) {
    window.location.href = '/login.html';
    return;
  }

  const balance = Number(user.balance || 0);

  currentBalance.textContent =
    `₹${balance.toFixed(2)}`;

  renderActivity();
}

function renderActivity() {
  const items = [];

  const filteredItems = items.filter(item => {
    return currentFilter === 'all' || item.type === currentFilter;
  });

  activityCount.textContent = filteredItems.length;

  if (!filteredItems.length) {
    activityList.innerHTML = '';

    const clone = emptyState.cloneNode(true);
    clone.style.display = 'flex';

    activityList.appendChild(clone);
    return;
  }

  activityList.innerHTML = filteredItems.map(item => `
    <div class="activity-item">
      <div class="activity-item-icon">
        <i class="${item.icon}"></i>
      </div>

      <div class="activity-item-content">
        <strong>${item.title}</strong>
        <span>${item.date}</span>
      </div>

      <div class="activity-item-amount">
        <strong>${item.amount}</strong>
        <span>${item.status}</span>
      </div>
    </div>
  `).join('');
}

document
  .querySelectorAll('.filter-tab')
  .forEach(button => {
    button.addEventListener('click', () => {
      document
        .querySelectorAll('.filter-tab')
        .forEach(tab => tab.classList.remove('active'));

      button.classList.add('active');

      currentFilter = button.dataset.filter;

      renderActivity();
    });
  });

document
  .getElementById('filter-button')
  ?.addEventListener('click', () => {
    showToast(
      'Activity filters',
      'Choose a category below to filter your activity.'
    );
  });

document
  .getElementById('clear-button')
  ?.addEventListener('click', () => {
    showToast(
      'Nothing to clear',
      'There is currently no activity history.'
    );
  });

toastClose?.addEventListener('click', () => {
  toast.classList.remove('show');
});

loadAccount();