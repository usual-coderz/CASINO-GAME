const mobileMenuButton = document.getElementById('mobile-menu-btn');
const mobileNav = document.getElementById('site-nav');

const toast = document.getElementById('scheme-toast');
const toastTitle = document.getElementById('toast-title');
const toastMessage = document.getElementById('toast-message');
const toastClose = document.getElementById('toast-close');

let toastTimer;

function openMenu() {
  if (!mobileNav || !mobileMenuButton) return;

  mobileNav.classList.add('mobile-open');

  mobileMenuButton.setAttribute('aria-expanded', 'true');
  mobileMenuButton.setAttribute('aria-label', 'Close menu');

  const icon = mobileMenuButton.querySelector('i');

  if (icon) {
    icon.className = 'fa-solid fa-xmark';
  }
}

function closeMenu() {
  if (!mobileNav || !mobileMenuButton) return;

  mobileNav.classList.remove('mobile-open');

  mobileMenuButton.setAttribute('aria-expanded', 'false');
  mobileMenuButton.setAttribute('aria-label', 'Open menu');

  const icon = mobileMenuButton.querySelector('i');

  if (icon) {
    icon.className = 'fa-solid fa-bars';
  }
}

mobileMenuButton?.addEventListener('click', () => {
  const isOpen = mobileNav?.classList.contains('mobile-open');

  if (isOpen) {
    closeMenu();
  } else {
    openMenu();
  }
});

mobileNav?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    closeMenu();
  });
});

document.addEventListener('click', event => {
  if (!mobileNav || !mobileMenuButton) return;

  if (!mobileNav.classList.contains('mobile-open')) return;

  if (
    mobileNav.contains(event.target) ||
    mobileMenuButton.contains(event.target)
  ) {
    return;
  }

  closeMenu();
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    closeMenu();
  }
});


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
  }, 3500);
}


toastClose?.addEventListener('click', () => {
  toast?.classList.remove('show');
  clearTimeout(toastTimer);
});


document.querySelectorAll('.scheme-action').forEach(button => {
  button.addEventListener('click', () => {
    const title = button.dataset.title || 'Khelza';
    const message =
      button.dataset.message ||
      'Thanks for checking the Khelza offers.';

    showToast(title, message);
  });
});