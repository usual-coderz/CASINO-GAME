/**
 * MAIN APPLICATION
 * Socket client, shared state, and view coordination
 */

import { Router } from './router.js';
import { HomeView } from './views/home.js';
import { GamesView } from './views/games.js';
import { CrashView } from './views/crash.js';
import { ProfileView } from './views/profile.js';

class App {
  constructor() {
    this.socket = null;
    this.router = null;
    this.currentView = null;
    this.state = {
      balance: 10000.00,
      history: [],
      roundState: 'WAITING',
      currentMultiplier: 1.00
    };
    
    this.init();
  }

  init() {
    this.connectSocket();
    this.setupRouter();
    this.setupGlobalEvents();
  }

  connectSocket() {
    this.socket = io({
      withCredentials: true
    });

    this.socket.on('connect', () => {
      console.log('Connected to game server');
    });

    this.socket.on('you:balance', (data) => {
      this.state.balance = data.balance;
      this.updateBalanceDisplay();
    });

    this.socket.on('history:update', (data) => {
      this.state.history = data.results;
    });

    this.socket.on('round:update', (data) => {
      this.state.currentMultiplier = data.multiplier;
      this.state.roundState = 'RUNNING';
    });

    this.socket.on('round:waiting', () => {
      this.state.roundState = 'WAITING';
      this.state.currentMultiplier = 1.00;
    });

    this.socket.on('round:crash', () => {
      this.state.roundState = 'CRASHED';
    });

    this.socket.on('error', (data) => {
      this.showToast('Error', data.message, 'error');
    });
  }

  setupRouter() {
    this.router = new Router({
      '/': HomeView,
      '/games': GamesView,
      '/games/crash': CrashView,
      '/profile': ProfileView
    }, this);
  }

  setupGlobalEvents() {
    // Reset balance button
    document.getElementById('reset-balance-btn')?.addEventListener('click', () => {
      this.socket.emit('player:resetBalance', {}, (response) => {
        if (response.success) {
          this.showToast('Balance Reset', `New balance: ₹${response.balance.toFixed(2)}`, 'success');
        }
      });
    });
  }

  updateBalanceDisplay() {
    const display = document.getElementById('balance-display');
    if (display) {
      display.textContent = this.state.balance.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  }

  showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    `;
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  mountView(ViewClass, params) {
    // Cleanup current view
    if (this.currentView && this.currentView.destroy) {
      this.currentView.destroy();
    }

    // Mount new view
    const container = document.getElementById('app');
    container.innerHTML = '';
    
    this.currentView = new ViewClass(container, this.socket, this.state, params);
  }
}

// Start app
window.app = new App();