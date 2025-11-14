// Socrate AI - Authentication & Chat Management
const API_URL = window.location.origin;

// Authentication state
let authToken = localStorage.getItem('auth_token');
let currentUser = null;

// Check authentication on load
async function checkAuth() {
    if (!authToken) {
        window.location.href = '/auth.html';
        return false;
    }

    try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Authentication failed');
        }

        const data = await response.json();
        currentUser = data.user;

        // Update UI with user info
        updateUserInfo(currentUser);

        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/auth.html';
        return false;
    }
}

// Update user info in UI
function updateUserInfo(user) {
    const userInfoHtml = `
        <div style="font-size: 0.9rem; font-weight: 600; margin-bottom: 0.5rem;">${user.email}</div>

        <div style="font-size: 1.1rem; font-weight: 700; margin-bottom: 1rem;">
            ${user.messagesUsed}/${user.messagesLimit} mesaje
        </div>

        ${user.subscriptionType === 'free' && !user.freeExpired ? `
            <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 1rem;">
                ${user.hoursRemaining} ore rămase<br>din perioada free
            </div>
        ` : ''}

        ${user.freeExpired || user.paidExpired ? `
            <div style="font-size: 0.85rem; color: #fca5a5; margin-bottom: 1rem; line-height: 1.4;">
                ⚠️ Perioada ${user.subscriptionType === 'free' ? 'gratuită' : 'de abonament'} a expirat
            </div>
        ` : ''}

        ${user.subscriptionType === 'paid' && !user.paidExpired && user.subscriptionCancelAt ? `
            <div style="font-size: 0.85rem; color: #fbbf24; margin-bottom: 1rem; line-height: 1.4;">
                ⏱️ Abonament anulat<br>Activ până pe ${new Date(user.subscriptionCancelAt).toLocaleDateString('ro-RO', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
        ` : ''}

        <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%;">
            ${(user.subscriptionType === 'free' && user.messagesUsed >= user.messagesLimit) || user.freeExpired || user.paidExpired ? `
                <button onclick="upgradeSubscription()" style="background: #fbbf24; color: #000; padding: 0.75rem 1rem; border-radius: 0.5rem; font-weight: 600; font-size: 0.9rem; border: none; cursor: pointer; width: 100%;">
                    ${user.subscriptionType === 'free' ? 'Upgrade la Paid' : 'Reînnoiește'}
                </button>
            ` : ''}
            ${user.subscriptionType === 'free' && user.messagesUsed < user.messagesLimit && !user.freeExpired ? `
                <button onclick="upgradeSubscription()" style="background: rgba(255,255,255,0.2); color: white; padding: 0.75rem 1rem; border-radius: 0.5rem; font-weight: 600; font-size: 0.9rem; border: 2px solid white; cursor: pointer; width: 100%;">
                    Upgrade la Paid
                </button>
            ` : ''}
            ${user.subscriptionType === 'paid' && !user.paidExpired && !user.subscriptionCancelAt ? `
                <button onclick="cancelSubscription()" style="background: transparent; color: #fca5a5; padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.9rem; border: 1px solid #fca5a5; cursor: pointer; width: 100%;">
                    Anulează Abonament
                </button>
            ` : ''}
            <button onclick="logout()" style="background: rgba(255,255,255,0.15); color: white; padding: 0.75rem 1rem; border-radius: 0.5rem; font-size: 0.9rem; border: 1px solid rgba(255,255,255,0.3); cursor: pointer; width: 100%;">
                Logout
            </button>
        </div>
    `;

    // Insert user info into the right sidebar
    const userInfoBox = document.querySelector('#user-info-box');
    if (userInfoBox) {
        userInfoBox.innerHTML = userInfoHtml;
    }
}

// Logout function
window.logout = function() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('socrate_ai_thread_id');
    window.location.href = '/auth.html';
};

// Upgrade subscription
window.upgradeSubscription = async function() {
    try {
        const response = await fetch(`${API_URL}/api/stripe/create-checkout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to create checkout session');
        }

        const data = await response.json();
        window.location.href = data.url;
    } catch (error) {
        console.error('Upgrade error:', error);
        alert('Eroare la crearea sesiunii de plată. Te rugăm să încerci din nou.');
    }
};

// Cancel subscription
window.cancelSubscription = async function() {
    if (!confirm('Ești sigur că vrei să anulezi abonamentul? Vei păstra accesul până la sfârșitul perioadei curente de facturare.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/stripe/cancel-subscription`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to cancel subscription');
        }

        const data = await response.json();
        alert('Abonamentul a fost anulat cu succes. Vei păstra accesul până la ' + new Date(data.endsAt).toLocaleDateString('ro-RO'));

        // Refresh user data
        await checkAuth();
    } catch (error) {
        console.error('Cancel error:', error);
        alert('Eroare la anularea abonamentului. Te rugăm să încerci din nou.');
    }
};

// Enhanced chat app function with authentication
window.chatApp = function() {
    return {
        messages: [],
        currentMessage: '',
        isLoading: false,
        threadId: null,
        localStorageKey: 'socrate_ai_thread_id',
        user: currentUser,

        async initChat() {
            console.log("Initializing chat...");

            // Check for welcome parameter
            const urlParams = new URLSearchParams(window.location.search);
            const isWelcome = urlParams.get('welcome') === 'true';
            const isSuccess = urlParams.get('success') === 'true';

            if (isSuccess) {
                this.messages.push({
                    id: Date.now() + '_success',
                    role: 'assistant',
                    content: "✅ Plata a fost procesată cu succes! Abonamentul tău este acum activ. Ai 300 de mesaje pe lună. Bine ai venit!"
                });
            } else if (isWelcome) {
                this.messages.push({
                    id: Date.now() + '_welcome_new_user',
                    role: 'assistant',
                    content: "Bine ai venit! Contul tău este activ pentru următoarele 72 de ore cu 20 de mesaje gratuite. Să începem călătoria noastră socratică!"
                });
            }

            this.loadThreadFromLocalStorage();

            if (this.threadId && !isWelcome && !isSuccess) {
                this.messages.push({
                    id: Date.now() + '_welcome_back',
                    role: 'assistant',
                    content: "Bine ai revenit! Conversația noastră continuă. Cu ce gând mergem mai departe?"
                });
                await this.fetchAndDisplayThreadMessages(this.threadId);
            } else if (!isWelcome && !isSuccess) {
                this.messages.push({
                    id: Date.now() + '_welcome',
                    role: 'assistant',
                    content: "Bună! Sunt Socrate AI, gata să explorăm împreună. Cu ce gând sau idee ai dori să începem astăzi călătoria noastră socratică?"
                });
            }

            this.$nextTick(() => this.scrollToBottom());
        },

        loadThreadFromLocalStorage() {
            const savedThreadId = localStorage.getItem(this.localStorageKey);
            if (savedThreadId) {
                this.threadId = savedThreadId;
                console.log("Loaded threadId from localStorage:", this.threadId);
            } else {
                this.threadId = null;
                console.log("No threadId found in localStorage.");
            }
        },

        saveThreadToLocalStorage(threadId) {
            if (threadId) {
                localStorage.setItem(this.localStorageKey, threadId);
                console.log("Saved threadId to localStorage:", threadId);
            }
        },

        startNewChat() {
            console.log("Starting new chat...");
            this.threadId = null;
            localStorage.removeItem(this.localStorageKey);
            this.messages = [];
            this.messages.push({
                id: Date.now() + '_welcome_new',
                role: 'assistant',
                content: "Salut! Am început o nouă conversație. Cu ce idee sau întrebare vrei să pornim la drum astăzi?"
            });
            this.$nextTick(() => this.scrollToBottom());
        },

        async fetchAndDisplayThreadMessages(threadId) {
            this.isLoading = true;

            try {
                const response = await fetch(`${API_URL}/api/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ threadId: threadId, action: 'get_messages' })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: "Server error" }));
                    this.messages.push({
                        id: Date.now() + '_error_history',
                        role: 'assistant',
                        content: `⛔ Nu am putut încărca istoricul: ${this.escapeHtml(errorData.error || 'Unknown error')}`,
                        isError: true
                    });
                    return;
                }

                const data = await response.json();

                if (Array.isArray(data.messages) && data.messages.length > 0) {
                    const historyMessages = data.messages.map(msg => ({
                        id: msg.id,
                        role: msg.role,
                        content: this.escapeHtml(msg.content)
                    }));
                    this.messages = [...historyMessages, ...this.messages];
                } else {
                    this.messages.push({
                        id: Date.now() + '_empty_history',
                        role: 'assistant',
                        content: "Nu am găsit mesaje anterioare în această conversație salvată, dar putem continua de aici!"
                    });
                }
                this.scrollToBottom();

            } catch (error) {
                console.error('Error fetching thread messages:', error);
                this.messages.push({
                    id: Date.now() + '_error_history',
                    role: 'assistant',
                    content: `⛔ Nu am putut încărca istoricul conversației: ${this.escapeHtml(error.message)}.`,
                    isError: true
                });
            } finally {
                this.isLoading = false;
            }
        },

        async sendMessage() {
            if (!this.currentMessage.trim() || this.isLoading) {
                return;
            }

            const userMessageText = this.currentMessage;
            this.messages.push({ id: Date.now() + '_user', role: 'user', content: this.escapeHtml(userMessageText) });

            this.currentMessage = '';
            this.isLoading = true;
            this.scrollToBottom();

            try {
                const response = await fetch(`${API_URL}/api/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({
                        message: userMessageText,
                        threadId: this.threadId
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();

                    // Handle specific error codes
                    if (errorData.code === 'LIMIT_EXCEEDED') {
                        this.messages.push({
                            id: Date.now() + '_limit',
                            role: 'assistant',
                            content: `⚠️ ${this.escapeHtml(errorData.error)}<br><br><button onclick="upgradeSubscription()" style="background: var(--brand-medium-blue); color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; border: none; cursor: pointer; font-weight: 600;">Upgrade Acum</button>`,
                            isError: true
                        });
                        this.isLoading = false;
                        this.scrollToBottom();

                        // Refresh user info
                        await checkAuth();
                        return;
                    }

                    if (errorData.code === 'UNAUTHORIZED') {
                        logout();
                        return;
                    }

                    throw new Error(errorData.error || `HTTP ${response.status}`);
                }

                const data = await response.json();

                if (data.threadId) {
                    this.threadId = data.threadId;
                    this.saveThreadToLocalStorage(this.threadId);
                }

                const assistantResponse = data.assistantMessage.content
                    .filter(item => item.type === 'text')
                    .map(item => this.escapeHtml(item.text.value))
                    .join('<br>');

                this.messages.push({ id: Date.now() + '_assistant', role: 'assistant', content: assistantResponse });

                // Update usage info in UI
                if (data.usage) {
                    currentUser.messagesUsed = data.usage.messagesUsed;
                    updateUserInfo(currentUser);
                }

            } catch (error) {
                console.error('Error sending message:', error);
                this.messages.push({
                    id: Date.now() + '_error',
                    role: 'assistant',
                    content: `⛔ A apărut o eroare: ${this.escapeHtml(error.message)}. Te rog să încerci din nou.`,
                    isError: true
                });
            } finally {
                this.isLoading = false;
                this.scrollToBottom();
            }
        },

        scrollToBottom() {
            this.$nextTick(() => {
                const messagesDiv = document.getElementById('messages');
                if (messagesDiv) {
                    messagesDiv.scrollTop = messagesDiv.scrollHeight;
                }
            });
        },

        escapeHtml(unsafe) {
            if (typeof unsafe !== 'string') return unsafe;
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
    };
};

// Initialize authentication check when page loads
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
});
