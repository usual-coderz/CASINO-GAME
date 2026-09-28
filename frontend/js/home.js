const toast = document.getElementById('home-toast');
const toastTitle = document.getElementById('toast-title');
const toastMessage = document.getElementById('toast-message');
const toastClose = document.getElementById('toast-close');

let toastTimer;

function showToast(title, message) {
  toastTitle.textContent = title;
  toastMessage.textContent = message;

  toast.classList.add('show');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

toastClose?.addEventListener('click', () => {
  toast.classList.remove('show');
});

document.getElementById('notification-btn')?.addEventListener('click', () => {
  showToast(
    'Notifications',
    'You are all caught up.'
  );
});

document.getElementById('notice-detail')?.addEventListener('click', () => {
  showToast(
    'Account notice',
    'Keep your account information private and secure.'
  );
});

document.querySelectorAll('.category-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.category-tab').forEach(item => {
      item.classList.remove('active');
    });

    tab.classList.add('active');

    const category = tab.dataset.category;

    document.querySelectorAll('.game-card').forEach(card => {
      const cardCategory = card.dataset.category;

      if (category === 'all' || category === cardCategory) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  });
});

document.querySelectorAll('.coming-btn').forEach(button => {
  button.addEventListener('click', () => {
    showToast(
      'Coming soon',
      'This game will be available in a future update.'
    );
  });
});