# Phone & SMS Integration Options
## Job Search CRM

**Date**: December 13, 2025
**Status**: Research & Planning

---

## Overview

You asked: *"Is there anyway to also connect to my phone texts and phone calls to bring that contact information into the CRM?"*

**Short answer**: Yes, but it's more complex than LinkedIn sync. Here are your options:

---

## Option 1: iPhone iMessage/SMS Sync (Recommended for Mac Users)

### How It Works
Use macOS Messages app and AppleScript/Shortcuts to export message history.

### Pros
- ✅ Works entirely locally (no third-party apps)
- ✅ Free
- ✅ Access to full iMessage + SMS history
- ✅ Can match phone numbers to contacts

### Cons
- ❌ Requires Mac computer with Messages synced
- ❌ Manual export process (or needs automation setup)
- ❌ No real-time sync (periodic exports)

### Implementation Steps

**1. Export Messages via AppleScript**

Create `~/export-imessages.scpt`:
```applescript
-- Export recent messages from Messages app
tell application "Messages"
    set recentMessages to {}
    repeat with iBuddy in (get every participant)
        set buddyName to (get name of iBuddy)
        set buddyHandle to (get handle of iBuddy)

        -- Get last 10 messages with this person
        set theChats to (get chats whose participants contains iBuddy)
        repeat with aChat in theChats
            set chatMessages to (get messages of aChat)
            repeat with aMessage in chatMessages
                set messageText to (get text of aMessage)
                set messageDate to (get date sent of aMessage)
                set messageDirection to (get direction of aMessage) -- incoming or outgoing

                set end of recentMessages to {|contact|:buddyName, |phone|:buddyHandle, |message|:messageText, |date|:messageDate, |direction|:messageDirection}
            end repeat
        end repeat
    end repeat

    return recentMessages
end tell
```

**2. Convert to JSON**

Create `export-messages.sh`:
```bash
#!/bin/bash
# Export iMessages to JSON format for CRM import

osascript ~/export-imessages.scpt > /tmp/messages-raw.txt

# Convert to JSON (requires jq)
cat /tmp/messages-raw.txt | jq '.' > ~/Downloads/imessages-export.json

echo "✓ Exported to ~/Downloads/imessages-export.json"
```

**3. Import to CRM**

Add button to dashboard that reads the JSON file and syncs like LinkedIn:

```javascript
async function importMessages() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        const text = await file.text();
        const messages = JSON.parse(text);

        messages.forEach(msg => {
            // Match by phone number or name
            const contact = findContactByPhone(msg.phone) || findContactByName(msg.contact);

            if (contact) {
                // Add to messageHistory
                contact.messageHistory.push({
                    id: `sms-${Date.now()}`,
                    date: msg.date,
                    type: 'sms-message',
                    subject: 'Text Message',
                    body: msg.message,
                    sentVia: 'phone',
                    aiGenerated: false,
                    responded: msg.direction === 'incoming',
                    responseDate: msg.direction === 'incoming' ? msg.date : null
                });

                // Update lastContact
                if (new Date(msg.date) > new Date(contact.lastContact || 0)) {
                    contact.lastContact = msg.date;
                }
            }
        });

        saveContacts(contacts);
        updateAllDisplays();
    };

    fileInput.click();
}
```

### Automation
- Run `export-messages.sh` via cron job (daily)
- Auto-upload to cloud storage (Dropbox, iCloud Drive)
- CRM auto-imports from cloud storage

---

## Option 2: Android SMS Sync via SMS Backup & Restore

### How It Works
Use popular app "SMS Backup & Restore" to export messages to XML/JSON format.

### Pros
- ✅ Easy to use (GUI app)
- ✅ Exports to multiple formats (XML, JSON, CSV)
- ✅ Includes call logs
- ✅ Can schedule automatic backups

### Cons
- ❌ Requires third-party app
- ❌ Manual import to CRM
- ❌ No real-time sync

### Implementation Steps

**1. Install App**
- Download "SMS Backup & Restore" from Google Play
- Grant SMS/Call log permissions

**2. Export Data**
- Open app → "Backup"
- Select "Messages + Call logs"
- Choose JSON format
- Export to Google Drive or Dropbox

**3. Import to CRM**
Same as Option 1 - add file upload button that parses JSON

---

## Option 3: Twilio Phone Number (Best for Real-Time)

### How It Works
Get a Twilio phone number, use it for job search calls/texts, integrate via API.

### Pros
- ✅ Real-time sync via webhooks
- ✅ Full API access
- ✅ Can record calls
- ✅ Professional appearance (dedicated number)
- ✅ SMS + voice in one platform

### Cons
- ❌ Costs money (~$1/month + usage fees)
- ❌ Requires giving contacts a different number
- ❌ Not your personal phone

### Implementation Steps

**1. Setup Twilio Account**
```bash
# Sign up at twilio.com
# Buy a phone number (~$1/month)
# Get Account SID and Auth Token
```

**2. Configure Webhooks**

In Twilio console:
- Go to Phone Numbers → [Your Number] → Messaging
- Webhook URL: `https://your-app.vercel.app/api/twilio-webhook`
- Method: POST

**3. Create Vercel Function**

`api/twilio-webhook.js`:
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
    const { From, Body, Direction, MessageSid, DateCreated } = req.body;

    // Find contact by phone number
    const { data: contacts } = await supabase
        .from('job_search_data')
        .select('contacts')
        .eq('id', 'main')
        .single();

    const contact = contacts.contacts.find(c =>
        c.phone === From || c.phone === req.body.To
    );

    if (contact) {
        // Add to messageHistory
        contact.messageHistory = contact.messageHistory || [];
        contact.messageHistory.push({
            id: `sms-${MessageSid}`,
            date: DateCreated,
            type: 'sms-message',
            subject: 'Text Message',
            body: Body,
            sentVia: 'twilio-phone',
            aiGenerated: false,
            responded: Direction === 'inbound',
            responseDate: Direction === 'inbound' ? DateCreated : null
        });

        // Update lastContact
        contact.lastContact = DateCreated;

        // Save back to Supabase
        await supabase
            .from('job_search_data')
            .update({ contacts: contacts.contacts })
            .eq('id', 'main');
    }

    res.status(200).send('OK');
}
```

**4. Cost Estimate**
- Phone number: $1.00/month
- Incoming SMS: $0.0075 per message
- Outgoing SMS: $0.0075 per message
- Voice calls: ~$0.01/minute

**Example**: 100 texts/month = $1.75 total

---

## Option 4: Google Voice Integration

### How It Works
Use Google Voice number, access via unofficial API or export.

### Pros
- ✅ Free (in US)
- ✅ Separate business number
- ✅ Web interface available

### Cons
- ❌ No official API
- ❌ Against ToS to scrape
- ❌ Export is manual (Google Takeout)

### Implementation Steps

**1. Export via Google Takeout**
- Go to takeout.google.com
- Select "Voice"
- Export to JSON
- Download archive

**2. Import to CRM**
Same JSON import process as Options 1-2

---

## Option 5: Call Log Sync (iOS Shortcuts)

### How It Works
Use iOS Shortcuts to export call history periodically.

### Pros
- ✅ Native iOS feature
- ✅ No third-party apps
- ✅ Can automate

### Cons
- ❌ Limited to call duration/time (not conversation content)
- ❌ Manual trigger needed

### Implementation

**1. Create iOS Shortcut**

Shortcut steps:
1. Get last 50 contacts from Contacts app
2. Get phone call history (last 7 days)
3. For each call:
   - Match phone number to contact
   - Create JSON object: { contact, phone, date, duration, direction }
4. Convert list to JSON
5. Upload to iCloud Drive or send to webhook

**2. CRM Import**

Add "Import Call Log" button:
```javascript
async function importCallLog() {
    // Read from iCloud Drive file or webhook endpoint
    const callLog = await fetch('/api/import-call-log').then(r => r.json());

    callLog.forEach(call => {
        const contact = findContactByPhone(call.phone);
        if (contact) {
            // Add to outreach array
            contact.outreach.push({
                type: 'phone-call',
                date: call.date,
                notes: `${call.direction} call - ${call.duration} seconds`,
                channel: 'phone'
            });

            // Update lastContact
            if (new Date(call.date) > new Date(contact.lastContact || 0)) {
                contact.lastContact = call.date;
            }
        }
    });

    saveContacts(contacts);
}
```

---

## Recommended Approach

### For Immediate Implementation (Today)

**1. iPhone Users (with Mac)**:
- Use Option 1 (iMessage Export) + Option 5 (Call Log)
- Export weekly, import manually
- **Implementation time**: 2-3 hours
- **Cost**: $0

**2. Android Users**:
- Use Option 2 (SMS Backup & Restore)
- Export weekly, import manually
- **Implementation time**: 1 hour
- **Cost**: $0

### For Professional/Long-Term (Within 1 Month)

**Get Twilio Number** (Option 3):
- Use dedicated number for job search
- Real-time sync via webhooks
- Professional appearance
- **Implementation time**: 4-6 hours
- **Cost**: ~$2-5/month

---

## Implementation Priority

If you want this feature, here's the recommended order:

### Phase 1: Basic Import (This Week)
1. Add phone number field to contact schema ✅ (already have)
2. Add "Import Messages" button to Settings
3. Support JSON file upload
4. Match messages to contacts by phone/name
5. Add to messageHistory array
6. Test with sample export

**Estimated time**: 3-4 hours

### Phase 2: Automated Export (Next Week)
1. Create AppleScript for Mac OR Android export guide
2. Setup automated export (cron job or scheduled shortcut)
3. Auto-upload to cloud storage
4. CRM checks cloud storage periodically

**Estimated time**: 4-5 hours

### Phase 3: Real-Time Sync (Future)
1. Get Twilio account
2. Create webhook endpoint
3. Test SMS sync
4. Test call logging
5. Add voice recording storage (optional)

**Estimated time**: 6-8 hours
**Cost**: ~$2-5/month

---

## Data Privacy Considerations

**Important**: Be careful with sensitive data

1. **iMessage Export**: Stores on your local machine only
2. **Twilio**: Messages stored on Twilio servers (encrypted)
3. **Supabase**: Ensure RLS (Row Level Security) is enabled
4. **Never commit** phone numbers or messages to Git
5. **Sanitize exports** before sharing with anyone

---

## Next Steps

**Would you like me to implement Phase 1?**

I can add:
1. "Import Messages" button to Settings modal
2. JSON file upload handler
3. Phone number matching logic
4. Message parsing for common formats (iMessage JSON, SMS Backup XML)
5. Sample export script for Mac users

**Estimated completion**: 3-4 hours

Let me know which option interests you most!

---

**Related Questions**:
- Do you primarily use iPhone or Android?
- Do you have a Mac computer?
- Would you be open to using a dedicated Twilio number?
- How important is real-time sync vs. weekly manual imports?
