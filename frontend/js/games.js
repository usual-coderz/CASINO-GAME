const tabs = document.querySelectorAll('.game-tab');
const cards = document.querySelectorAll('.lobby-card');
const count = document.getElementById('games-count');
const emptyGames = document.getElementById('empty-games');

const toast = document.getElementById('games-toast');
const toastTitle = document.getElementById('games-toast-title');
const toastMessage = document.getElementById('games-toast-message');
const toastClose = document.getElementById('games-toast-close');

let toastTimer;

function showToast(title, message) {
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


tabs.forEach(tab => {
  tab.addEventListener('click', () => {

    tabs.forEach(item => {
      item.classList.remove('active');
    });

    tab.classList.add('active');

    const filter = tab.dataset.filter;
    let visible = 0;

    cards.forEach(card => {

      const status = card.dataset.status;

      const shouldShow =
        filter === 'all' ||
        filter === status;

      if (shouldShow) {
        card.classList.remove('hidden');
        visible++;
      } else {
        card.classList.add('hidden');
      }

    });

    count.textContent = visible;

    emptyGames.classList.toggle('show', visible === 0);
  });
});


document.querySelectorAll('.notify-game-btn').forEach(button => {

  button.addEventListener('click', () => {

    const game = button.dataset.game;

    showToast(
      `${game} — Coming soon`,
      'This game is not available yet.'
    );

  });

});


document.querySelector('.mobile-menu-btn')?.addEventListener('click', () => {

  const nav = document.querySelector('.desktop-nav');

  if (!nav) return;

  nav.classList.toggle('mobile-open');

});