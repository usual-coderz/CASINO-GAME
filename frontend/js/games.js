const tabs = document.querySelectorAll('.game-tab');
const cards = document.querySelectorAll('.lobby-card');
const count = document.getElementById('games-count');
const emptyGames = document.getElementById('empty-games');

const toast = document.getElementById('games-toast');
const toastTitle = document.getElementById('games-toast-title');
const toastMessage = document.getElementById('games-toast-message');
const toastClose = document.getElementById('games-toast-close');

const mobileMenuButton = document.querySelector('.mobile-menu-btn');
const mobileNav = document.querySelector('.desktop-nav');

let toastTimer;

function showToast(title, message) {
  if (!toast) return;

  if (toastTitle) toastTitle.textContent = title;
  if (toastMessage) toastMessage.textContent = message;

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

function filterGames(filter) {
  let visible = 0;

  cards.forEach(card => {
    const status = card.dataset.status;
    const shouldShow = filter === 'all' || filter === status;

    card.classList.toggle('hidden', !shouldShow);

    if (shouldShow) {
      visible++;
    }
  });

  if (count) {
    count.textContent = visible;
  }

  emptyGames?.classList.toggle('show', visible === 0);
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(item => item.classList.remove('active'));
    tab.classList.add('active');

    filterGames(tab.dataset.filter || 'all');
  });
});

document.querySelectorAll('.notify-game-btn').forEach(button => {
  button.addEventListener('click', () => {
    const game = button.dataset.game || 'Game';

    showToast(
      `${game} — Coming soon`,
      'This game is not available yet.'
    );
  });
});

mobileMenuButton?.addEventListener('click', () => {
  if (!mobileNav) return;

  const isOpen = mobileNav.classList.toggle('mobile-open');
  const icon = mobileMenuButton.querySelector('i');

  if (icon) {
    icon.className = isOpen
      ? 'fa-solid fa-xmark'
      : 'fa-solid fa-bars';
  }

  mobileMenuButton.setAttribute('aria-expanded', String(isOpen));
});

mobileNav?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('mobile-open');

    const icon = mobileMenuButton?.querySelector('i');

    if (icon) {
      icon.className = 'fa-solid fa-bars';
    }

    mobileMenuButton?.setAttribute('aria-expanded', 'false');
  });
});

document.addEventListener('click', event => {
  if (!mobileNav || !mobileMenuButton) return;
  if (!mobileNav.classList.contains('mobile-open')) return;

  if (
    !mobileNav.contains(event.target) &&
    !mobileMenuButton.contains(event.target)
  ) {
    mobileNav.classList.remove('mobile-open');

    const icon = mobileMenuButton.querySelector('i');

    if (icon) {
      icon.className = 'fa-solid fa-bars';
    }

    mobileMenuButton.setAttribute('aria-expanded', 'false');
  }
});

filterGames('all');