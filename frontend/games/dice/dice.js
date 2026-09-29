const dice = document.getElementById('dice');
const rollButton = document.getElementById('roll-button');
const resultValue = document.getElementById('result-value');
const rollStatus = document.getElementById('roll-status');

const pointsElement = document.getElementById('points');
const totalRollsElement = document.getElementById('total-rolls');
const highestRollElement = document.getElementById('highest-roll');
const lastRollElement = document.getElementById('last-roll');

const historyList = document.getElementById('history-list');
const emptyHistory = document.getElementById('empty-history');
const clearHistoryButton = document.getElementById('clear-history');

const toast = document.getElementById('toast');
const toastTitle = document.getElementById('toast-title');
const toastMessage = document.getElementById('toast-message');
const toastClose = document.getElementById('toast-close');

const STORAGE_KEY = 'khelza_demo_dice';

let state = {
  points: 1000,
  rolls: []
};

let toastTimer;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return;
    }

    const parsed = JSON.parse(saved);

    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray(parsed.rolls)
    ) {
      state.points = Number(parsed.points) || 1000;
      state.rolls = parsed.rolls.slice(0, 20);
    }
  } catch {
    state = {
      points: 1000,
      rolls: []
    };
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
}

function formatPoints(value) {
  return Number(value).toLocaleString('en-IN');
}

function updateStats() {
  pointsElement.textContent = formatPoints(state.points);

  totalRollsElement.textContent = state.rolls.length;

  if (state.rolls.length) {
    const highest = Math.max(
      ...state.rolls.map(item => item.value)
    );

    highestRollElement.textContent = highest;
    lastRollElement.textContent =
      state.rolls[0].value;
  } else {
    highestRollElement.textContent = '—';
    lastRollElement.textContent = '—';
  }
}

function renderHistory() {
  if (!state.rolls.length) {
    historyList.innerHTML = '';
    historyList.appendChild(emptyHistory);
    return;
  }

  historyList.innerHTML = state.rolls
    .map(item => {
      return `
        <div class="history-item">
          <div class="history-number">
            ${item.value}
          </div>

          <div class="history-info">
            <strong>Dice Roll</strong>
            <span>${item.time}</span>
          </div>

          <div class="history-result">
            #${item.value}
          </div>
        </div>
      `;
    })
    .join('');
}

function updateDice(value) {
  dice.className = `dice show-${value}`;
}

function showToast(title, message) {
  if (!toast) {
    return;
  }

  toastTitle.textContent = title;
  toastMessage.textContent = message;

  toast.classList.add('show');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function getTime() {
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date());
}

function rollDice() {
  if (rollButton.disabled) {
    return;
  }

  rollButton.disabled = true;

  rollStatus.textContent = 'Rolling...';
  resultValue.textContent = '…';

  dice.classList.remove(
    'show-1',
    'show-2',
    'show-3',
    'show-4',
    'show-5',
    'show-6'
  );

  dice.classList.remove('rolling');

  void dice.offsetWidth;

  dice.classList.add('rolling');

  const value = Math.floor(Math.random() * 6) + 1;

  setTimeout(() => {
    updateDice(value);

    resultValue.textContent = value;
    rollStatus.textContent = 'Complete';

    state.rolls.unshift({
      value,
      time: getTime()
    });

    state.rolls = state.rolls.slice(0, 20);

    if (value === 6) {
      state.points += 25;

      showToast(
        'Great roll',
        'You rolled a 6 and earned 25 demo points.'
      );
    } else if (value === 1) {
      state.points = Math.max(
        0,
        state.points - 5
      );

      showToast(
        'Roll complete',
        'You rolled a 1. 5 demo points were used.'
      );
    } else {
      state.points += 5;

      showToast(
        'Roll complete',
        `You rolled ${value} and earned 5 demo points.`
      );
    }

    saveState();
    updateStats();
    renderHistory();

    rollButton.disabled = false;

    setTimeout(() => {
      rollStatus.textContent = 'Ready';
    }, 1000);
  }, 850);
}

rollButton?.addEventListener(
  'click',
  rollDice
);

clearHistoryButton?.addEventListener(
  'click',
  () => {
    if (!state.rolls.length) {
      showToast(
        'Nothing to clear',
        'Your roll history is already empty.'
      );

      return;
    }

    state.rolls = [];

    saveState();
    updateStats();
    renderHistory();

    showToast(
      'History cleared',
      'Your demo roll history has been cleared.'
    );
  }
);

toastClose?.addEventListener(
  'click',
  () => {
    toast.classList.remove('show');
    clearTimeout(toastTimer);
  }
);

loadState();
updateDice(1);
updateStats();
renderHistory();