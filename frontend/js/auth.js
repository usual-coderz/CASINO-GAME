const API_URL = 'https://casinogame-c34130ca80b6.herokuapp.com/api';

// Generate unique casino-style ID
function generateCasinoId() {
    const prefix = 'RV';
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const timestamp = Date.now().toString(36).substring(0, 3).toUpperCase();
    return `${prefix}-${random}-${timestamp}`;
}

// Auth Modal Controller
const authModal = {
    modal: document.getElementById('auth-modal'),
    loginForm: document.getElementById('login-form'),
    signupForm: document.getElementById('signup-form'),
    
    open(tab = 'login') {
        this.modal.classList.add('active');
        this.switch(tab);
    },
    
    close() {
        this.modal.classList.remove('active');
    },
    
    switch(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        if (tab === 'login') {
            this.loginForm.classList.remove('hidden');
            this.signupForm.classList.add('hidden');
        } else {
            this.loginForm.classList.add('hidden');
            this.signupForm.classList.remove('hidden');
        }
    }
};

// Signup Handler
document.getElementById('signup-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        name: document.getElementById('signup-name').value,
        email: document.getElementById('signup-email').value,
        phone: document.getElementById('signup-phone').value,
        password: document.getElementById('signup-password').value,
        casinoName: document.getElementById('signup-casino-name').value,
        casinoId: generateCasinoId()
    };
    
    try {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            updateUIForLoggedInUser(result.user);
            authModal.close();
            showNotification('Welcome to Royal Vegas!', 'success');
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Registration failed', 'error');
    }
});

// Login Handler
document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        email: document.getElementById('login-email').value,
        password: document.getElementById('login-password').value
    };
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            updateUIForLoggedInUser(result.user);
            authModal.close();
            showNotification('Welcome back!', 'success');
        } else {
            showNotification(result.message, 'error');
        }
    } catch (error) {
        showNotification('Login failed', 'error');
    }
});

// Update UI for logged in user
function updateUIForLoggedInUser(user) {
    document.getElementById('guest-view').classList.add('hidden');
    document.getElementById('user-view').classList.remove('hidden');
    document.getElementById('username-display').textContent = user.casinoName || user.name;
    document.getElementById('player-id').textContent = user.casinoId;
    document.getElementById('player-name').textContent = user.casinoName || user.name;
    updateWalletBalance(user.balance || 0);
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.getElementById('guest-view').classList.remove('hidden');
    document.getElementById('user-view').classList.add('hidden');
    document.getElementById('profile-menu').classList.remove('active');
    showNotification('Logged out successfully', 'info');
}

// Toggle Profile Menu
function toggleProfile() {
    document.getElementById('profile-menu').classList.toggle('active');
}

// Close profile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.profile-dropdown')) {
        document.getElementById('profile-menu')?.classList.remove('active');
    }
});

// Check auth status on load
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        updateUIForLoggedInUser(user);
        fetchWalletBalance();
    }
}

// Notification helper
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 3000;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--accent)' : '#333'};
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', checkAuth);