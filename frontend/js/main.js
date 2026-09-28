document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        authModal.close();
        walletModal.close();
    }
});

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .transaction-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.8rem;
        border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .tx-type {
        font-weight: 500;
        color: var(--gold);
    }

    .tx-date {
        font-size: 0.8rem;
        color: var(--text-muted);
        display: block;
    }

    .tx-amount {
        font-weight: 600;
    }

    .tx-amount.credit {
        color: var(--success);
    }

    .tx-amount.debit {
        color: var(--accent);
    }
`;
document.head.appendChild(style);