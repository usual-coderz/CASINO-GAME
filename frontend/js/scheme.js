const toast = document.getElementById('scheme-toast');
const toastTitle = document.getElementById('toast-title');
const toastMessage = document.getElementById('toast-message');
const toastClose = document.getElementById('toast-close');

let toastTimer;

function showSchemeToast(title, message) {
  toastTitle.textContent = title;
  toastMessage.textContent = message;

  toast.classList.add('show');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3500);
}

toastClose?.addEventListener('click', () => {
  toast.classList.remove('show');
});

document.querySelectorAll('.scheme-action').forEach(button => {
  button.addEventListener('click', () => {
    const action = button.dataset.action;

    if (action === 'featured') {
      showSchemeToast(
        'Featured offer',
        'Offer details will appear here when published.'
      );
      return;
    }

    if (action === 'coming') {
      showSchemeToast(
        'Coming soon',
        'New promotions will be announced here.'
      );
      return;
    }

    if (action === 'updates') {
      showSchemeToast(
        'Khelza updates',
        'Check back regularly for the latest announcements.'
      );
      return;
    }

    if (action === 'soon') {
      showSchemeToast(
        'You are all set',
        'New promotions will appear on this page.'
      );
    }
  });
});


document.querySelector('.mobile-menu-btn')?.addEventListener('click', () => {
  const nav = document.querySelector('.desktop-nav');

  if (!nav) return;

  nav.classList.toggle('mobile-open');
});