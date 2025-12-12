# LinkedIn CRM Sync - Chrome Extension

Automatically sync your LinkedIn conversations to your Job Search CRM dashboard.

## Features

- **Auto-Sync**: Automatically detects and logs LinkedIn messages in real-time
- **Contact Matching**: Matches LinkedIn conversations with your CRM contacts
- **Conversation History**: Keeps a log of all LinkedIn interactions
- **Supabase Integration**: Syncs data to your cloud database
- **Privacy-First**: All data stays in your Supabase instance

## Installation

### Step 1: Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `linkedin-crm-extension` folder
5. The extension should now appear in your extensions list

### Step 2: Configure Supabase

1. Click the extension icon in your Chrome toolbar
2. Enter your Supabase URL: `https://dkufgfmwqsxecylyvidi.supabase.co`
3. Enter your Supabase Anon Key (from your dashboard)
4. Click "Save Settings"
5. Click "Test Connection" to verify it works
6. Toggle "Sync Enabled" to ON

### Step 3: Add Database Column

Run this SQL in your Supabase SQL Editor:

\`\`\`sql
ALTER TABLE job_search_data
ADD COLUMN IF NOT EXISTS linkedin_conversations JSONB DEFAULT '[]'::jsonb;
\`\`\`

## How It Works

1. **Monitoring**: The extension monitors your LinkedIn messaging page
2. **Detection**: When you send/receive a message, it's automatically detected
3. **Parsing**: Extracts contact name, message preview, and timestamp
4. **Syncing**: Logs to Supabase and tries to match with existing contacts
5. **Notification**: Shows a subtle notification when sync completes

## What Gets Synced

For each LinkedIn conversation:
- Contact name
- Last message preview
- Timestamp
- Conversation ID
- Link to conversation

If the contact exists in your CRM:
- Updates `lastLinkedInMessage`
- Updates `lastLinkedInContact` timestamp
- Links conversation ID for reference

## Usage

### Automatic Mode (Recommended)
- Just browse LinkedIn normally
- Send and receive messages as usual
- Extension syncs automatically in the background

### Manual Sync
- If you want to force a sync, reload the LinkedIn messaging page
- Extension will re-scan all visible conversations

### View Sync Status
- Click the extension icon to see:
  - Sync status (Active/Paused/Not Configured)
  - Number of messages synced
  - Last sync time

## Privacy & Security

- **Local Processing**: All message parsing happens in your browser
- **Your Database**: Data only goes to YOUR Supabase instance
- **No Third Parties**: No data sent to external services
- **Open Source**: You can review all the code

## Troubleshooting

### "Not Configured" Status
- Make sure you've entered both Supabase URL and Anon Key
- Click "Test Connection" to verify credentials
- Check that you've run the SQL to add the `linkedin_conversations` column

### Messages Not Syncing
- Make sure "Sync Enabled" toggle is ON
- Refresh the LinkedIn messaging page
- Check Chrome DevTools console for errors (F12)
- Verify you're on `https://www.linkedin.com/messaging`

### "Connection Failed"
- Double-check your Supabase URL (should be `https://xxxxx.supabase.co`)
- Verify your Anon Key is correct
- Make sure Row Level Security policies allow access

## LinkedIn DOM Structure

The extension relies on LinkedIn's current DOM structure. If LinkedIn updates their interface, the selectors may need updating:

- `.msg-conversation-listitem` - Conversation thread item
- `.msg-conversation-listitem__participant-names` - Contact name
- `.msg-conversation-listitem__message-snippet` - Message preview
- `time` - Timestamp element

## Future Enhancements

Potential features for future versions:
- Full conversation export
- Sentiment analysis
- Follow-up reminders
- Message templates
- AI-powered response suggestions

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review Chrome console for errors
3. Verify Supabase configuration
4. Update the extension to the latest version

## Version History

### v1.0.0 (2025-12-11)
- Initial release
- Auto-sync LinkedIn messages
- Supabase integration
- Contact matching
- Real-time notifications
