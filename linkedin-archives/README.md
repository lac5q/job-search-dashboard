# LinkedIn Data Archives

This folder is for storing your LinkedIn data archive exports.

---

## How to Export LinkedIn Data

### Option 1: Full Data Archive (Recommended)

1. Go to LinkedIn: https://www.linkedin.com/mypreferences/d/download-my-data
2. Select **"Request archive"**
3. Check these options:
   - ✅ Connections
   - ✅ Messages
   - ✅ Profile
   - ✅ Contacts
4. Click **"Request archive"**
5. Wait for email (usually arrives within 10-24 hours)
6. Download the ZIP file
7. Extract ZIP and place contents in this folder

### Option 2: Quick Export via Extension

The LinkedIn CRM extension automatically syncs your messages in real-time, but you can also manually export for backup:

1. Open LinkedIn Messages
2. Click the extension icon
3. Click "Export Data"
4. Save JSON file to this folder

---

## File Naming Convention

Use this naming pattern for easy tracking:

```
linkedin-export-YYYY-MM-DD.zip
linkedin-messages-YYYY-MM-DD.json
linkedin-connections-YYYY-MM-DD.csv
```

**Examples**:
- `linkedin-export-2025-12-13.zip`
- `linkedin-messages-2025-12-13.json`

---

## What Data to Keep

### Essential Files (Keep Forever)
- `Connections.csv` - All your LinkedIn connections
- `messages.csv` - Message history
- `Profile.csv` - Your profile snapshots

### Optional (Delete After Import)
- `Invitations.csv`
- `Endorsements.csv`
- `Recommendations.csv`

---

## Auto-Import to CRM

The dashboard will automatically detect and import LinkedIn archives from this folder.

### Automatic Detection

The CRM checks this folder for new archives when you:
1. Click "🔄 Sync LinkedIn" button in Settings
2. Open the dashboard (checks every 5 minutes)

### Manual Import

If auto-import doesn't work:

1. Go to Settings modal
2. Click "📁 Import LinkedIn Archive"
3. Select file from this folder
4. Click "Import"

---

## Import Process

When you import an archive:

1. **Connections** → Creates/updates contacts in CRM
2. **Messages** → Adds to messageHistory for matching contacts
3. **Profile changes** → Updates your background info for AI prompts

### What Gets Synced

**For each connection**:
- ✅ Name (first + last)
- ✅ Current title
- ✅ Current company
- ✅ LinkedIn URL
- ✅ Connection date
- ✅ Email (if available)
- ✅ Phone (if available)

**For each message**:
- ✅ Contact name
- ✅ Message content
- ✅ Date/time
- ✅ Direction (sent/received)
- ✅ Adds to messageHistory array
- ✅ Updates lastContact date

### Duplicate Prevention

The system prevents duplicates by:
- Matching connections by LinkedIn URL (most reliable)
- Matching connections by full name (fallback)
- Checking message timestamp + content (prevents duplicate messages)

---

## Recommended Schedule

**Monthly exports** (recommended):
- 1st of every month: Export full LinkedIn archive
- Save to this folder
- Import to CRM
- Delete archives older than 6 months

**Weekly quick exports** (optional):
- Export just messages via extension
- Auto-syncs to CRM in real-time anyway

---

## Storage Management

### Disk Space

LinkedIn archives are typically:
- Messages only: 1-5 MB
- Full archive: 10-50 MB
- Keep last 6 months: ~300 MB max

### Auto-Cleanup

The CRM can auto-delete old archives:

Settings → LinkedIn Archives → "Delete archives older than X months"

Default: 6 months

---

## Troubleshooting

### Archive Not Importing

**Check**:
1. File is unzipped (should be folder with CSVs inside)
2. Folder contains `Connections.csv` or `messages.csv`
3. File permissions allow reading
4. No special characters in filename

**Try**:
```bash
# Check file permissions
ls -la /Users/lcalderon/github/JobHunt/linkedin-archives/

# Fix permissions if needed
chmod 644 /Users/lcalderon/github/JobHunt/linkedin-archives/*.csv
```

### Messages Not Matching Contacts

**Reasons**:
- Contact name in CRM doesn't match LinkedIn name
- Contact doesn't exist in CRM yet

**Solutions**:
1. Import Connections first (creates contacts)
2. Then import Messages (matches to existing contacts)
3. Or: Messages create new contacts automatically

### Duplicate Contacts Created

**If you see duplicates**:
1. Go to CRM tab
2. Click "🔍 Find Duplicates" button
3. Review and merge duplicates
4. Keep the most complete record

---

## Privacy & Security

### ⚠️ Important

LinkedIn archives contain **sensitive personal data**:
- Private messages
- Email addresses
- Phone numbers
- Connection notes

### Best Practices

1. **Never commit to Git**
   - Already in `.gitignore`
   - Verify: `git status` should NOT show this folder

2. **Encrypt if sharing**
   ```bash
   # Encrypt archive before sharing
   zip -e -r linkedin-encrypted.zip linkedin-export-2025-12-13/
   ```

3. **Delete old archives**
   - Keep only last 6 months
   - Or encrypt and archive to external drive

4. **Backup separately**
   - Don't rely on this folder as only backup
   - Use Time Machine or cloud backup

---

## File Structure Example

```
linkedin-archives/
├── README.md (this file)
├── linkedin-export-2025-12-13/
│   ├── Connections.csv
│   ├── messages.csv
│   ├── Profile.csv
│   └── ...
├── linkedin-export-2025-11-13/
│   └── ...
└── linkedin-messages-2025-12-01.json
```

---

## Current Status

**Archives in this folder**: 0

**Last import**: Never

**Next scheduled import**: Manual

---

## Automation (Optional)

### Auto-download LinkedIn archives

Create `~/auto-download-linkedin.sh`:

```bash
#!/bin/bash
# Auto-download LinkedIn archives monthly
# Add to crontab: 0 0 1 * * ~/auto-download-linkedin.sh

ARCHIVE_DIR="/Users/lcalderon/github/JobHunt/linkedin-archives"
DATE=$(date +%Y-%m-%d)

# Check Downloads folder for new LinkedIn export
LATEST=$(ls -t ~/Downloads/linkedin-*.zip 2>/dev/null | head -1)

if [ -f "$LATEST" ]; then
    echo "Found LinkedIn export: $LATEST"

    # Move to archives
    mv "$LATEST" "$ARCHIVE_DIR/linkedin-export-$DATE.zip"

    # Unzip
    cd "$ARCHIVE_DIR"
    unzip "linkedin-export-$DATE.zip" -d "linkedin-export-$DATE"

    echo "✓ Archived to $ARCHIVE_DIR/linkedin-export-$DATE/"
else
    echo "No LinkedIn export found in Downloads"
fi
```

Make executable:
```bash
chmod +x ~/auto-download-linkedin.sh
```

---

## Need Help?

- **LinkedIn export issues**: https://www.linkedin.com/help
- **CRM import issues**: Check browser console (F12)
- **File format issues**: Verify CSV encoding is UTF-8

---

**Last Updated**: December 13, 2025
