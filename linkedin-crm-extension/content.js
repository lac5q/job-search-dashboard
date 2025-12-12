// LinkedIn CRM Sync - Content Script
// Monitors LinkedIn messaging page and syncs conversations

console.log('LinkedIn CRM Sync: Content script loaded');

// Configuration
let syncEnabled = true;
let supabaseUrl = '';
let supabaseKey = '';
let lastProcessedMessages = new Set();

// Load settings from storage
chrome.storage.sync.get(['syncEnabled', 'supabaseUrl', 'supabaseKey', 'lastProcessedMessages'], (result) => {
    syncEnabled = result.syncEnabled !== false; // Default to true
    supabaseUrl = result.supabaseUrl || '';
    supabaseKey = result.supabaseKey || '';
    lastProcessedMessages = new Set(result.lastProcessedMessages || []);

    if (syncEnabled && supabaseUrl && supabaseKey) {
        console.log('LinkedIn CRM Sync: Enabled and configured');
        startMonitoring();
    } else {
        console.log('LinkedIn CRM Sync: Not configured. Please set up in extension popup.');
    }
});

// Listen for settings updates
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        if (changes.syncEnabled) syncEnabled = changes.syncEnabled.newValue;
        if (changes.supabaseUrl) supabaseUrl = changes.supabaseUrl.newValue;
        if (changes.supabaseKey) supabaseKey = changes.supabaseKey.newValue;

        if (syncEnabled && supabaseUrl && supabaseKey) {
            startMonitoring();
        }
    }
});

function startMonitoring() {
    console.log('LinkedIn CRM Sync: Starting conversation monitor...');

    // Monitor for messaging page
    const observer = new MutationObserver((mutations) => {
        if (isMessagingPage()) {
            checkForNewMessages();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Initial check
    if (isMessagingPage()) {
        checkForNewMessages();
    }

    // Periodic check every 10 seconds
    setInterval(() => {
        if (isMessagingPage()) {
            checkForNewMessages();
        }
    }, 10000);
}

function isMessagingPage() {
    return window.location.href.includes('linkedin.com/messaging');
}

function checkForNewMessages() {
    // LinkedIn messaging structure (may need updates if LinkedIn changes their DOM)
    const conversationThreads = document.querySelectorAll('.msg-conversation-listitem');

    conversationThreads.forEach(thread => {
        const contactName = extractContactName(thread);
        const lastMessage = extractLastMessage(thread);
        const timestamp = extractTimestamp(thread);
        const conversationId = extractConversationId(thread);

        if (contactName && lastMessage && !lastProcessedMessages.has(conversationId)) {
            console.log('New LinkedIn message detected:', { contactName, lastMessage, timestamp });

            // Mark as processed
            lastProcessedMessages.add(conversationId);
            saveProcessedMessages();

            // Sync to CRM
            syncMessageToCRM({
                contactName,
                message: lastMessage,
                timestamp,
                conversationId,
                url: window.location.href
            });
        }
    });
}

function extractContactName(threadElement) {
    try {
        const nameElement = threadElement.querySelector('.msg-conversation-listitem__participant-names');
        return nameElement ? nameElement.textContent.trim() : null;
    } catch (e) {
        console.error('Error extracting contact name:', e);
        return null;
    }
}

function extractLastMessage(threadElement) {
    try {
        const messageElement = threadElement.querySelector('.msg-conversation-listitem__message-snippet');
        return messageElement ? messageElement.textContent.trim() : null;
    } catch (e) {
        console.error('Error extracting message:', e);
        return null;
    }
}

function extractTimestamp(threadElement) {
    try {
        const timeElement = threadElement.querySelector('time');
        return timeElement ? timeElement.getAttribute('datetime') || new Date().toISOString() : new Date().toISOString();
    } catch (e) {
        return new Date().toISOString();
    }
}

function extractConversationId(threadElement) {
    try {
        // Use data attribute or href to create unique ID
        const link = threadElement.querySelector('a[href*="messaging"]');
        if (link) {
            const href = link.getAttribute('href');
            const match = href.match(/messaging\/thread\/([^/]+)/);
            return match ? match[1] : null;
        }

        // Fallback: use timestamp + contact name as ID
        return `${extractContactName(threadElement)}-${Date.now()}`;
    } catch (e) {
        return `fallback-${Date.now()}`;
    }
}

function saveProcessedMessages() {
    // Keep only last 1000 messages in memory
    const messagesArray = Array.from(lastProcessedMessages).slice(-1000);
    chrome.storage.sync.set({ lastProcessedMessages: messagesArray });
}

async function syncMessageToCRM(messageData) {
    try {
        // Content scripts run in page context and CAN access Supabase directly!
        const SUPABASE_URL = 'https://dkufgfmwqsxecylyvidi.supabase.co';
        const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrdWZnZm13cXN4ZWN5bHl2aWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5NjAxODMsImV4cCI6MjA0OTUzNjE4M30.sRjuUO41AoN9lqCWmRKjxVDN48rVWnNyIz8n2ShdHqE';

        console.log('Fetching existing conversations from Supabase...');

        // Get existing data
        const response = await fetch(`${SUPABASE_URL}/rest/v1/job_search_data?id=eq.main`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch: HTTP ${response.status}`);
        }

        const data = await response.json();
        let linkedinConversations = data[0]?.linkedin_conversations || [];

        // Add new conversation
        const conversationLog = {
            id: messageData.conversationId,
            contactName: messageData.contactName,
            lastMessage: messageData.message,
            timestamp: messageData.timestamp,
            url: messageData.url,
            syncedAt: new Date().toISOString()
        };

        const existingIndex = linkedinConversations.findIndex(c => c.id === messageData.conversationId);
        if (existingIndex >= 0) {
            linkedinConversations[existingIndex] = conversationLog;
            console.log('Updating existing conversation');
        } else {
            linkedinConversations.unshift(conversationLog);
            console.log('Adding new conversation');
        }

        linkedinConversations = linkedinConversations.slice(0, 500);

        // Update Supabase
        console.log('Saving to Supabase...');
        const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/job_search_data?id=eq.main`, {
            method: 'PATCH',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                linkedin_conversations: linkedinConversations
            })
        });

        if (!updateResponse.ok) {
            throw new Error(`Update failed: HTTP ${updateResponse.status}`);
        }

        console.log('✅ Message synced to CRM:', messageData.contactName);
        showNotification('LinkedIn message synced to CRM');

        // Update stats in extension storage
        chrome.storage.sync.set({
            messageCount: linkedinConversations.length,
            lastSync: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error syncing to CRM:', error);
        showNotification('Sync failed: ' + error.message);
    }
}

function showNotification(message) {
    // Create subtle notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: linear-gradient(135deg, #0a66c2, #0073b1);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 999999;
        font-family: -apple-system, system-ui, sans-serif;
        font-size: 14px;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = '✓ ' + message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_CURRENT_CONVERSATION') {
        const conversation = extractCurrentConversation();
        sendResponse({ conversation });
    }
    return true;
});

function extractCurrentConversation() {
    // Extract full conversation if user is viewing a thread
    const messages = [];
    const messageElements = document.querySelectorAll('.msg-s-message-list__event');

    messageElements.forEach(msgEl => {
        try {
            const sender = msgEl.querySelector('.msg-s-message-group__profile-link')?.textContent.trim();
            const text = msgEl.querySelector('.msg-s-event-listitem__body')?.textContent.trim();
            const time = msgEl.querySelector('time')?.getAttribute('datetime');

            if (sender && text) {
                messages.push({ sender, text, time });
            }
        } catch (e) {
            console.error('Error extracting message:', e);
        }
    });

    return messages;
}
