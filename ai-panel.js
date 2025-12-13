// AI Panel - Side Panel for AI Message Generation
// Integrates directly into job-search-dashboard.html

const AIPanel = {
    currentContact: null,
    emailHistory: null,

    // Open AI panel for a specific contact
    async openAIPanel(contactId) {
        const contacts = JSON.parse(localStorage.getItem('jobSearchContacts') || '[]');
        const contact = contacts.find(c => c.id === contactId);

        if (!contact) {
            alert('Contact not found');
            return;
        }

        this.currentContact = contact;

        // Show backdrop (for mobile)
        const backdrop = document.getElementById('ai-panel-backdrop');
        if (backdrop) {
            backdrop.classList.add('open');
        }

        // Show panel with animation
        const panel = document.getElementById('ai-panel');
        panel.classList.add('open');

        // Prevent body scroll on mobile when panel is open
        if (window.innerWidth <= 768) {
            document.body.style.overflow = 'hidden';
        }

        // Display contact context
        this.displayContactContext(contact);

        // Show loading state for Gmail history
        document.getElementById('ai-gmail-history').innerHTML = '<p style="color: #888;">Searching Gmail...</p>';

        // Search Gmail in background
        this.loadGmailHistory(contact);
    },

    // Close AI panel
    closeAIPanel() {
        // Hide backdrop
        const backdrop = document.getElementById('ai-panel-backdrop');
        if (backdrop) {
            backdrop.classList.remove('open');
        }

        // Hide panel
        const panel = document.getElementById('ai-panel');
        panel.classList.remove('open');

        // Re-enable body scroll
        document.body.style.overflow = '';

        // Clear state
        this.currentContact = null;
        this.emailHistory = null;
    },

    // Display contact information
    displayContactContext(contact) {
        const contextDiv = document.getElementById('ai-contact-context');
        const name = contact.name || `${contact.firstName} ${contact.lastName}`;

        contextDiv.innerHTML = `
            <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h3 id="panel-contact-name" style="margin: 0 0 8px 0; color: #333;">${name}</h3>
                <p id="panel-contact-title" style="margin: 0; color: ${contact.title ? '#666' : '#999'}; font-size: 0.9em; ${contact.title ? '' : 'font-style: italic;'}">${contact.title || 'Add job title'}</p>
                <p id="panel-contact-company" style="margin: 0; color: ${contact.company ? '#666' : '#999'}; font-size: 0.9em; ${contact.company ? '' : 'font-style: italic;'}">${contact.company || 'Add company'}</p>
                ${contact.source ? `<p id="panel-contact-source" style="margin: 5px 0 0 0; color: #667eea; font-size: 0.85em; font-weight: 600;">${this.formatSource(contact.source)}</p>` : ''}
                ${contact.notes ? `<p id="panel-contact-notes" style="margin: 10px 0 0 0; color: #555; font-size: 0.85em; font-style: italic;">${contact.notes}</p>` : ''}
            </div>
        `;
    },

    // Load Gmail history from BOTH accounts
    async loadGmailHistory(contact) {
        const email = contact.email;
        const name = contact.name || `${contact.firstName} ${contact.lastName}`;

        if (!email) {
            document.getElementById('ai-gmail-history').innerHTML = '<p style="color: #888;">No email address available</p>';
            return;
        }

        // Check if any Gmail account is connected
        const status = DualGmailClient.getAccountStatus();
        const anyConnected = status.personal.connected || status.work.connected;

        if (!anyConnected) {
            document.getElementById('ai-gmail-history').innerHTML = `
                <div style="padding: 15px; background: #fff3cd; border-radius: 8px; margin-bottom: 15px;">
                    <p style="margin: 0 0 10px 0; color: #856404;">No Gmail accounts connected</p>
                    <button onclick="openSettingsModal()" style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Connect Gmail Accounts</button>
                </div>
            `;
            return;
        }

        // Show loading state
        document.getElementById('ai-gmail-history').innerHTML = `
            <div style="padding: 10px; text-align: center;">
                <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid #667eea; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 0.9em;">Searching Gmail accounts...</p>
            </div>
        `;

        try {
            // Search BOTH accounts in parallel
            const history = await DualGmailClient.getContactHistoryDual(email, name);
            this.emailHistory = history;

            // Check for errors in results
            const hasPersonalError = history.personal.error;
            const hasWorkError = history.work.error;
            const needsPersonalAuth = history.personal.needsAuth;
            const needsWorkAuth = history.work.needsAuth;

            // Handle authentication errors
            if ((needsPersonalAuth || needsWorkAuth) && history.totalCount === 0) {
                const accountsNeedingAuth = [];
                if (needsPersonalAuth) accountsNeedingAuth.push('Personal');
                if (needsWorkAuth) accountsNeedingAuth.push('Work');

                document.getElementById('ai-gmail-history').innerHTML = `
                    <div style="padding: 15px; background: #fff3cd; border-radius: 8px;">
                        <p style="margin: 0 0 10px 0; color: #856404;"><strong>Gmail token expired</strong></p>
                        <p style="margin: 0 0 10px 0; color: #856404; font-size: 0.9em;">${accountsNeedingAuth.join(' and ')} Gmail account needs to be reconnected.</p>
                        <button onclick="openSettingsModal()" style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9em;">Reconnect Gmail</button>
                    </div>
                `;
                return;
            }

            // Handle rate limit or quota errors
            if ((history.personal.rateLimited || history.work.rateLimited ||
                 history.personal.quotaExceeded || history.work.quotaExceeded) && history.totalCount === 0) {
                const errorMsg = history.personal.error || history.work.error;
                document.getElementById('ai-gmail-history').innerHTML = `
                    <div style="padding: 15px; background: #fff3cd; border-radius: 8px;">
                        <p style="margin: 0 0 8px 0; color: #856404;"><strong>Gmail API limit reached</strong></p>
                        <p style="margin: 0; color: #856404; font-size: 0.9em;">${errorMsg}</p>
                    </div>
                `;
                return;
            }

            // Display results (even if partial)
            if (history.totalCount === 0) {
                let noResultsMsg = '<p style="color: #888;">No email history found in any account</p>';

                // Show warning if one account had errors but didn't completely fail
                if (hasPersonalError || hasWorkError) {
                    const errorAccount = hasPersonalError ? 'Personal' : 'Work';
                    noResultsMsg += `<p style="color: #f0ad4e; font-size: 0.85em; margin-top: 8px;">Note: ${errorAccount} account search had issues</p>`;
                }

                document.getElementById('ai-gmail-history').innerHTML = noResultsMsg;
            } else {
                this.displayDualEmailHistory(history);

                // Show warning banner if one account had errors but we got results from the other
                if (hasPersonalError || hasWorkError) {
                    const errorAccount = hasPersonalError ? 'Personal' : 'Work';
                    const errorMsg = hasPersonalError ? history.personal.error : history.work.error;
                    const warningBanner = `
                        <div style="padding: 10px; background: #fff3cd; border-radius: 6px; margin-top: 10px; font-size: 0.85em;">
                            <strong style="color: #856404;">${errorAccount} Gmail:</strong>
                            <span style="color: #856404;">${errorMsg}</span>
                        </div>
                    `;
                    document.getElementById('ai-gmail-history').innerHTML += warningBanner;
                }
            }
        } catch (error) {
            console.error('Gmail search error:', error);
            document.getElementById('ai-gmail-history').innerHTML = `
                <div style="padding: 15px; background: #f8d7da; border-radius: 8px;">
                    <p style="margin: 0 0 8px 0; color: #721c24;"><strong>Failed to load Gmail history</strong></p>
                    <p style="margin: 0 0 10px 0; color: #721c24; font-size: 0.85em;">${this.escapeHtml(error.message)}</p>
                    <button onclick="openSettingsModal()" style="background: #667eea; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.9em;">Open Settings</button>
                </div>
            `;
        }
    },

    // Display email history from both accounts
    displayDualEmailHistory(history) {
        const { personal, work, combined, totalCount, stats } = history;

        let html = `
            <div style="margin-bottom: 15px;">
                <div style="display: flex; gap: 15px; margin-bottom: 10px;">
                    ${stats.personalCount > 0 ? `
                        <div style="flex: 1; padding: 10px; background: #e8f4f8; border-radius: 6px; text-align: center;">
                            <div style="font-size: 1.5em;">📧</div>
                            <div style="font-weight: 600; font-size: 1.2em; color: #333;">${stats.personalCount}</div>
                            <div style="font-size: 0.85em; color: #666;">Personal</div>
                        </div>
                    ` : ''}
                    ${stats.workCount > 0 ? `
                        <div style="flex: 1; padding: 10px; background: #f0e8f8; border-radius: 6px; text-align: center;">
                            <div style="font-size: 1.5em;">💼</div>
                            <div style="font-weight: 600; font-size: 1.2em; color: #333;">${stats.workCount}</div>
                            <div style="font-size: 0.85em; color: #666;">Work</div>
                        </div>
                    ` : ''}
                </div>
                <div style="font-size: 0.9em; color: #666; margin-bottom: 10px;">
                    Total: ${totalCount} emails
                </div>
            </div>
        `;

        // Show most recent 5 emails
        html += '<div style="max-height: 200px; overflow-y: auto;">';
        combined.slice(0, 5).forEach((msg, idx) => {
            const date = new Date(msg.date).toLocaleDateString();
            html += `
                <div style="padding: 10px; border-left: 3px solid ${msg.account === 'personal' ? '#667eea' : '#9b59b6'}; background: #f8f9fa; border-radius: 4px; margin-bottom: 8px;">
                    <div style="display: flex; justify-space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-weight: 600; font-size: 0.9em;">${msg.subject || '(No subject)'}</span>
                        <span style="font-size: 0.75em; padding: 2px 6px; background: white; border-radius: 3px;">${msg.accountLabel}</span>
                    </div>
                    <div style="font-size: 0.8em; color: #666;">${date}</div>
                    ${msg.snippet ? `<div style="font-size: 0.8em; color: #555; margin-top: 4px;">${msg.snippet.substring(0, 80)}...</div>` : ''}
                </div>
            `;
        });
        html += '</div>';

        document.getElementById('ai-gmail-history').innerHTML = html;
    },

    // Display email history
    displayEmailHistory(history) {
        const historyDiv = document.getElementById('ai-gmail-history');

        const html = `
            <div style="margin-bottom: 15px; padding: 12px; background: #e7f3ff; border-radius: 8px;">
                <p style="margin: 0; color: #0066cc; font-weight: 600; font-size: 0.9em;">
                    Found ${history.count} email${history.count !== 1 ? 's' : ''}
                </p>
            </div>
            <div style="max-height: 200px; overflow-y: auto; padding: 0 5px;">
                ${history.messages.slice(0, 5).map(msg => `
                    <div style="padding: 10px; margin-bottom: 8px; background: #f8f9fa; border-radius: 6px; border-left: 3px solid #667eea;">
                        <div style="font-size: 0.85em; font-weight: 600; color: #333; margin-bottom: 4px;">${this.escapeHtml(msg.subject)}</div>
                        <div style="font-size: 0.75em; color: #666; margin-bottom: 4px;">${new Date(msg.date).toLocaleDateString()}</div>
                        <div style="font-size: 0.8em; color: #555;">${this.escapeHtml(msg.snippet.substring(0, 100))}...</div>
                    </div>
                `).join('')}
                ${history.count > 5 ? `<p style="text-align: center; color: #888; font-size: 0.85em; margin-top: 8px;">+ ${history.count - 5} more emails</p>` : ''}
            </div>
        `;

        historyDiv.innerHTML = html;
    },

    // Connect Gmail
    async connectGmail() {
        const clientId = localStorage.getItem('gmailClientId');

        if (!clientId) {
            alert('Gmail Client ID not configured. Please go to Settings and add your Gmail OAuth Client ID.');
            return;
        }

        try {
            GmailClient.init(clientId);

            // Wait for Google Identity Services to load
            if (typeof google === 'undefined') {
                await new Promise(resolve => {
                    const checkGoogle = setInterval(() => {
                        if (typeof google !== 'undefined') {
                            clearInterval(checkGoogle);
                            resolve();
                        }
                    }, 100);
                });
            }

            await GmailClient.authorize();

            // Reload Gmail history
            if (this.currentContact) {
                this.loadGmailHistory(this.currentContact);
            }
        } catch (error) {
            alert('Failed to connect Gmail: ' + error.message);
        }
    },

    // Generate AI message
    async generateMessage() {
        if (!this.currentContact) {
            alert('No contact selected');
            return;
        }

        const messageType = document.getElementById('ai-message-type').value;
        const tone = document.getElementById('ai-tone').value;
        const additionalContext = document.getElementById('ai-additional-context').value;

        // Check AI configuration
        const aiConfig = this.getAIConfig();
        if (!aiConfig) {
            const outputDiv = document.getElementById('ai-output');
            outputDiv.innerHTML = `
                <div style="padding: 15px; background: #fff3cd; border-radius: 8px; color: #856404;">
                    <p style="margin: 0 0 10px 0;"><strong>AI not configured</strong></p>
                    <p style="margin: 0 0 10px 0; font-size: 0.9em;">Please add your AI API key in Settings to use message generation.</p>
                    <button onclick="openSettingsModal()" style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9em;">Open Settings</button>
                </div>
            `;
            return;
        }

        // Build prompt
        const prompt = this.buildAIPrompt(this.currentContact, this.emailHistory, messageType, tone, additionalContext);

        // Show loading state
        const outputDiv = document.getElementById('ai-output');
        outputDiv.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;"><div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #ddd; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div><p style="margin-top: 10px;">Generating message...</p></div>';

        try {
            // Call AI with retry logic (3 attempts)
            const message = await this.callAIWithRetry(prompt, aiConfig, 3);

            if (message) {
                outputDiv.innerHTML = `
                    <div style="padding: 15px; background: #f8f9fa; border-radius: 8px; white-space: pre-wrap; font-family: inherit; line-height: 1.6;">${this.escapeHtml(message)}</div>
                `;

                // Show action buttons
                document.getElementById('ai-actions').style.display = 'flex';

                // Store generated message
                this.currentMessage = message;
            }
        } catch (error) {
            console.error('AI generation error:', error);

            // Provide user-friendly error message with actionable next steps
            let errorMessage = error.message;
            let suggestion = '';

            if (error.message.includes('API key')) {
                suggestion = '<button onclick="openSettingsModal()" style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 8px; font-size: 0.9em;">Check API Key in Settings</button>';
            } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
                suggestion = '<p style="margin: 8px 0 0 0; font-size: 0.85em;">Try again in a few minutes or check your API usage limits.</p>';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                suggestion = '<p style="margin: 8px 0 0 0; font-size: 0.85em;">Check your internet connection and try again.</p>';
            } else {
                suggestion = '<button onclick="generateMessage()" style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 8px; font-size: 0.9em;">Try Again</button>';
            }

            outputDiv.innerHTML = `
                <div style="padding: 15px; background: #f8d7da; border-radius: 8px; color: #721c24;">
                    <p style="margin: 0 0 8px 0;"><strong>Failed to generate message</strong></p>
                    <p style="margin: 0; font-size: 0.9em;">${this.escapeHtml(errorMessage)}</p>
                    ${suggestion}
                </div>
            `;
        }
    },

    // Call AI with retry logic
    async callAIWithRetry(prompt, config, maxAttempts = 3) {
        let lastError;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await this.callAI(prompt, config);
            } catch (error) {
                lastError = error;
                console.warn(`AI call attempt ${attempt} failed:`, error.message);

                // Don't retry on authentication errors
                if (error.message.includes('API key') || error.message.includes('authentication')) {
                    throw error;
                }

                // Don't retry if this was the last attempt
                if (attempt === maxAttempts) {
                    break;
                }

                // Exponential backoff: wait 1s, 2s, 4s between retries
                const waitTime = Math.pow(2, attempt - 1) * 1000;
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }

        // All retries failed
        throw new Error(`Failed after ${maxAttempts} attempts: ${lastError.message}`);
    },

    // Build AI prompt
    buildAIPrompt(contact, emailHistory, messageType, tone, additionalContext) {
        const name = contact.name || `${contact.firstName} ${contact.lastName}`;

        // Email history summary
        let emailContext = 'No previous email conversation found.';
        if (emailHistory && emailHistory.count > 0) {
            emailContext = GmailClient.summarizeForAI(emailHistory);
        }

        // User background
        const userBackground = `
Luis Calderon - Ross MBA '11
- Led $900M P&L at Intuit (TurboTax)
- Shipped AI products before ChatGPT (ML-driven tax recommendations)
- Recently cut costs 40% with AI chatbots
- 15+ years product leadership
- Target: VP/Director/Principal PM roles, $200-280K+
- Location: San Diego, open to remote
- Phone: 703.786.7899
`;

        // Build prompt
        const prompt = `Generate a personalized outreach message.

MY BACKGROUND:
${userBackground}

CONTACT INFO:
Name: ${name}
Title: ${contact.title || 'Unknown'}
Company: ${contact.company || 'Unknown'}
Connection: ${contact.source || 'unknown'}
${contact.notes ? `Notes: ${contact.notes}` : ''}

${emailContext}

MESSAGE TYPE: ${messageType}
TONE: ${tone}
${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ''}

Requirements:
1. ${contact.source === 'ross-alumni' ? 'Lead with "Go Blue" connection' : 'Reference any shared background'}
2. Reference something specific about their company/role
3. Clear ask (15 min call, coffee chat, etc.)
4. Keep concise and professional
5. ${emailHistory && emailHistory.count > 0 ? 'Reference past conversations naturally - don\'t over-explain the relationship' : 'This is initial outreach'}
6. Include my phone number if appropriate for the message type

Generate the message:`;

        return prompt;
    },

    // Call AI API
    async callAI(prompt, config) {
        const systemPrompt = "You are an expert job search coach helping a senior product leader find VP/Director level roles. Be specific, actionable, and personalized. Generate only the message content, no explanations or meta-commentary.";

        if (config.provider === 'claude') {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': config.key,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 2000,
                    system: systemPrompt,
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'AI API request failed');
            }

            const data = await response.json();
            return data.content[0].text;

        } else if (config.provider === 'openai') {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.key}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 2000
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'AI API request failed');
            }

            const data = await response.json();
            return data.choices[0].message.content;
        }

        throw new Error('Unknown AI provider');
    },

    // Get AI configuration
    getAIConfig() {
        const provider = localStorage.getItem('aiProvider');
        const key = localStorage.getItem('aiApiKey');

        if (!provider || !key) {
            return null;
        }

        return { provider, key };
    },

    // Copy to clipboard
    async copyToClipboard() {
        if (!this.currentMessage) {
            alert('No message to copy');
            return;
        }

        try {
            await navigator.clipboard.writeText(this.currentMessage);

            // Show success feedback
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = '✓ Copied!';
            btn.style.background = '#4caf50';

            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        } catch (error) {
            alert('Failed to copy to clipboard: ' + error.message);
        }
    },

    // Send via Gmail with loading state and better error handling
    async sendViaGmail() {
        if (!this.currentContact || !this.currentMessage) {
            alert('No message to send');
            return;
        }

        const email = this.currentContact.email;
        if (!email) {
            alert('Contact has no email address');
            return;
        }

        // Extract subject line (first line if it looks like a subject)
        const lines = this.currentMessage.split('\n');
        let subject = 'Following up';
        let body = this.currentMessage;

        if (lines[0].toLowerCase().startsWith('subject:')) {
            subject = lines[0].substring(8).trim();
            body = lines.slice(1).join('\n').trim();
        }

        // Confirm send
        if (!confirm(`Send email to ${email}?\n\nSubject: ${subject}`)) {
            return;
        }

        // Show loading state on output div
        const outputDiv = document.getElementById('ai-output');
        const originalContent = outputDiv.innerHTML;
        outputDiv.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #888;">
                <div style="display: inline-block; width: 20px; height: 20px; border: 3px solid #ddd; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <p style="margin-top: 10px;">Sending email...</p>
            </div>
        `;

        try {
            // Send email
            await GmailClient.sendEmail(email, subject, body);

            // Log message to contact
            this.logMessage(subject, body);

            // Update contact status
            this.updateContactStatus();

            // Show success message
            outputDiv.innerHTML = `
                <div style="padding: 15px; background: #d4edda; border-radius: 8px; color: #155724;">
                    <p style="margin: 0;"><strong>Email sent successfully!</strong></p>
                    <p style="margin: 8px 0 0 0; font-size: 0.9em;">Message sent to ${this.escapeHtml(email)}</p>
                </div>
            `;

            // Close panel after 2 seconds
            setTimeout(() => {
                this.closeAIPanel();

                // Refresh CRM display
                if (typeof renderCRM === 'function') {
                    renderCRM();
                }
            }, 2000);

        } catch (error) {
            console.error('Send email error:', error);

            // Restore original content and show error
            outputDiv.innerHTML = originalContent;

            // Show user-friendly error with actionable guidance
            let errorMessage = error.message;
            let suggestion = '';

            if (errorMessage.includes('session expired') || errorMessage.includes('reconnect')) {
                suggestion = '<button onclick="openSettingsModal()" style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px; font-size: 0.9em;">Reconnect Gmail</button>';
            } else if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
                suggestion = '<p style="margin: 8px 0 0 0; font-size: 0.85em;">Please try again in a few minutes.</p>';
            } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
                suggestion = '<p style="margin: 8px 0 0 0; font-size: 0.85em;">Check your internet connection and try again.</p>';
            } else {
                suggestion = '<button onclick="sendViaGmail()" style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-top: 10px; font-size: 0.9em;">Try Again</button>';
            }

            alert(`Failed to send email\n\n${errorMessage}\n\nSee the panel for more details.`);

            // Also show in panel
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'padding: 15px; background: #f8d7da; border-radius: 8px; color: #721c24; margin-top: 15px;';
            errorDiv.innerHTML = `
                <p style="margin: 0 0 8px 0;"><strong>Failed to send email</strong></p>
                <p style="margin: 0; font-size: 0.9em;">${this.escapeHtml(errorMessage)}</p>
                ${suggestion}
            `;
            outputDiv.appendChild(errorDiv);
        }
    },

    // Log message to contact
    logMessage(subject, body) {
        const contacts = JSON.parse(localStorage.getItem('jobSearchContacts') || '[]');
        const index = contacts.findIndex(c => c.id === this.currentContact.id);

        if (index === -1) return;

        // Initialize messageHistory if needed
        if (!contacts[index].messageHistory) {
            contacts[index].messageHistory = [];
        }

        // Add message
        const messageType = document.getElementById('ai-message-type').value;
        contacts[index].messageHistory.push({
            id: 'msg-' + Date.now(),
            date: new Date().toISOString(),
            type: messageType,
            subject: subject,
            body: body,
            sentVia: 'personal',
            aiGenerated: true,
            aiProvider: localStorage.getItem('aiProvider'),
            responded: false,
            responseDate: null
        });

        // Update last contacted
        contacts[index].lastContacted = new Date().toISOString().split('T')[0];
        contacts[index].updatedAt = new Date().toISOString();

        // Save
        localStorage.setItem('jobSearchContacts', JSON.stringify(contacts));

        // Trigger Supabase sync if available
        if (typeof SyncManager !== 'undefined' && SyncManager.syncToCloud) {
            SyncManager.syncToCloud();
        }
    },

    // Update contact status to "contacted"
    updateContactStatus() {
        const contacts = JSON.parse(localStorage.getItem('jobSearchContacts') || '[]');
        const index = contacts.findIndex(c => c.id === this.currentContact.id);

        if (index === -1) return;

        // Only update if status is "new"
        if (contacts[index].status === 'new') {
            contacts[index].status = 'contacted';
            contacts[index].updatedAt = new Date().toISOString();
            localStorage.setItem('jobSearchContacts', JSON.stringify(contacts));
        }
    },

    // Helper: Format source
    formatSource(source) {
        const sources = {
            'ross-alumni': 'Ross Alumni',
            'referral': 'Referral',
            'linkedin': 'LinkedIn',
            'cold': 'Cold Outreach',
            'event': 'Event',
            'other': 'Other'
        };
        return sources[source] || source;
    },

    // Helper: Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Add CSS animation for loading spinner
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Make available globally
window.AIPanel = AIPanel;
window.openAIPanel = (contactId) => AIPanel.openAIPanel(contactId);
window.closeAIPanel = () => AIPanel.closeAIPanel();
window.generateMessage = () => AIPanel.generateMessage();
window.copyToClipboard = () => AIPanel.copyToClipboard();
window.sendViaGmail = () => AIPanel.sendViaGmail();

// Expose logging functions for testing
window.logMessageToContact = (contactId, subject, body) => {
    const contacts = JSON.parse(localStorage.getItem('jobSearchContacts') || '[]');
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return false;

    if (!contact.messageHistory) contact.messageHistory = [];
    contact.messageHistory.push({
        id: Date.now().toString(),
        date: new Date().toISOString(),
        type: document.getElementById('ai-message-type')?.value || 'email',
        subject: subject,
        body: body,
        sentVia: 'gmail',
        aiGenerated: true,
        responded: false
    });

    localStorage.setItem('jobSearchContacts', JSON.stringify(contacts));
    return true;
};

window.saveMessageHistory = (messageData) => {
    if (!AIPanel.currentContact) return false;
    return window.logMessageToContact(AIPanel.currentContact.id, messageData.subject, messageData.body);
};

window.updateContactStatus = (contactId, status) => {
    const contacts = JSON.parse(localStorage.getItem('jobSearchContacts') || '[]');
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return false;

    contact.status = status || 'contacted';
    contact.lastContact = new Date().toISOString();
    localStorage.setItem('jobSearchContacts', JSON.stringify(contacts));
    return true;
};
