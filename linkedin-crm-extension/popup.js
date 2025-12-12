// Popup script for LinkedIn CRM Sync extension

document.addEventListener('DOMContentLoaded', loadSettings);

document.getElementById('syncToggle').addEventListener('click', toggleSync);
document.getElementById('saveBtn').addEventListener('click', saveSettings);
document.getElementById('testBtn').addEventListener('click', testConnection);

async function loadSettings() {
    const settings = await chrome.storage.sync.get([
        'syncEnabled',
        'supabaseUrl',
        'supabaseKey',
        'messageCount',
        'lastSync',
        'linkedin_conversations'
    ]);

    // Populate fields
    document.getElementById('supabaseUrl').value = settings.supabaseUrl || '';
    document.getElementById('supabaseKey').value = settings.supabaseKey || '';

    // Set toggle state
    const syncEnabled = settings.syncEnabled !== false;
    const toggle = document.getElementById('syncToggle');
    if (syncEnabled) {
        toggle.classList.add('active');
    }

    // Update stats
    const conversations = settings.linkedin_conversations || [];
    document.getElementById('messageCount').textContent = conversations.length;

    if (settings.lastSync) {
        const lastSyncDate = new Date(settings.lastSync);
        const now = new Date();
        const diffMinutes = Math.floor((now - lastSyncDate) / 60000);

        if (diffMinutes < 1) {
            document.getElementById('lastSync').textContent = 'Just now';
        } else if (diffMinutes < 60) {
            document.getElementById('lastSync').textContent = `${diffMinutes}m ago`;
        } else if (diffMinutes < 1440) {
            document.getElementById('lastSync').textContent = `${Math.floor(diffMinutes / 60)}h ago`;
        } else {
            document.getElementById('lastSync').textContent = lastSyncDate.toLocaleDateString();
        }
    }

    updateStatus();
}

function toggleSync() {
    const toggle = document.getElementById('syncToggle');
    toggle.classList.toggle('active');

    const enabled = toggle.classList.contains('active');
    chrome.storage.sync.set({ syncEnabled: enabled }, () => {
        updateStatus();
        showMessage(enabled ? 'Sync enabled' : 'Sync paused', false);
    });
}

async function saveSettings() {
    const supabaseUrl = document.getElementById('supabaseUrl').value.trim();
    const supabaseKey = document.getElementById('supabaseKey').value.trim();

    if (!supabaseUrl || !supabaseKey) {
        showMessage('Please enter both Supabase URL and Key', true);
        return;
    }

    // Validate URL format
    if (!supabaseUrl.match(/^https:\/\/[a-z0-9]+\.supabase\.co$/)) {
        showMessage('Invalid Supabase URL format', true);
        return;
    }

    chrome.storage.sync.set({
        supabaseUrl,
        supabaseKey
    }, () => {
        showMessage('Settings saved successfully!', false);
        updateStatus();
    });
}

async function testConnection() {
    const supabaseUrl = document.getElementById('supabaseUrl').value.trim();
    const supabaseKey = document.getElementById('supabaseKey').value.trim();

    if (!supabaseUrl || !supabaseKey) {
        showMessage('Please enter Supabase credentials first', true);
        return;
    }

    document.getElementById('testBtn').textContent = 'Testing...';
    document.getElementById('testBtn').disabled = true;

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/job_search_data?id=eq.main`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });

        if (response.ok) {
            showMessage('✓ Connection successful!', false);
            updateStatus();
        } else {
            showMessage('Connection failed. Check your credentials.', true);
        }
    } catch (error) {
        showMessage('Connection error: ' + error.message, true);
    } finally {
        document.getElementById('testBtn').textContent = 'Test Connection';
        document.getElementById('testBtn').disabled = false;
    }
}

async function updateStatus() {
    const settings = await chrome.storage.sync.get(['syncEnabled', 'supabaseUrl', 'supabaseKey']);

    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    const enabled = settings.syncEnabled !== false;
    const configured = settings.supabaseUrl && settings.supabaseKey;

    if (enabled && configured) {
        statusDot.classList.remove('inactive');
        statusText.textContent = 'Active & Syncing';
    } else if (!enabled) {
        statusDot.classList.add('inactive');
        statusText.textContent = 'Paused';
    } else {
        statusDot.classList.add('inactive');
        statusText.textContent = 'Not Configured';
    }
}

function showMessage(text, isError) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.classList.toggle('error', isError);
    messageEl.style.display = 'block';

    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 4000);
}
