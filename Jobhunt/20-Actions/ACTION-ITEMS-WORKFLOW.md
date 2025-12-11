---
title: Action Items Workflow
type: workflow
created: 2025-12-11 14:56:01 PST
updated: 2025-12-11 14:56:01 PST
source: "Created by Cursor assistant"
version: 2025-12-11
---

# Action Items Workflow (Created: 2025-12-11 14:56:01 PST | Updated: 2025-12-11 14:56:01 PST)

## How This System Works

This Obsidian vault (`Jobhunt/`) is automatically synced with your Cursor workspace. When you discuss tasks or action items with Cursor, they will be added to [[Action Items]].

## For Cursor/AI Assistant

**When the user mentions tasks, action items, or "things to do":**
1. Add them to `/Users/lcalderon/github/JobHunt/Jobhunt/20-Actions/Action Items.md`
2. Use the format: `- [ ] Task description #tag #next-action`
3. Update the `updated` timestamp in the frontmatter
4. Organize by section (Inbox, Job Search, Networking, Admin, etc.)

**Action Item Format:**
```markdown
- [ ] Task description #tag1 #tag2 #next-action
```

**Available Tags:**
- `#next-action` - High priority, do next
- `#jobhunt` - Job search related
- `#networking` - Networking/outreach
- `#admin` - Administrative tasks
- `#research` - Research tasks
- `#follow-up` - Follow-up items
- `#urgent` - Urgent items

**Sections to Use:**
- `## Inbox` - New items, unsorted
- `## Job Search` - Job applications, interviews, etc.
- `## Networking` - Outreach, connections, messages
- `## Admin` - Administrative tasks
- `## Research` - Company research, role research
- `## Follow-ups` - Items requiring follow-up

## For You (The User)

1. **Open Obsidian** and navigate to this vault: `/Users/lcalderon/github/JobHunt/Jobhunt`
2. **View your dashboard**: Open [[Action Dashboard]] to see all tasks
3. **Add tasks manually**: Edit [[Action Items]] directly in Obsidian
4. **Check off completed**: Change `- [ ]` to `- [x]` when done
5. **Sync**: Since vault is in your repo, changes sync via git

## Obsidian Setup (Optional but Recommended)

1. **Install Tasks Plugin** (Community Plugins):
   - Settings → Community Plugins → Browse → Search "Tasks"
   - Install and enable

2. **Enable File Change Detection**:
   - Settings → Files & Links → "Detect all file changes" = ON
   - This ensures Cursor edits show up immediately in Obsidian

3. **View Dashboard**:
   - Open `Action Dashboard.md` to see live task queries

## Example Usage

**In Cursor, say:**
- "Add 'Follow up with recruiter at Company X' to my action items"
- "I need to apply to 3 jobs this week - add those tasks"
- "What are my current action items?"

**Cursor will:**
- Add tasks to `Action Items.md`
- Update timestamps
- Organize by category
- Use appropriate tags

## File Locations

- **Action Items**: `/Users/lcalderon/github/JobHunt/Jobhunt/20-Actions/Action Items.md`
- **Dashboard**: `/Users/lcalderon/github/JobHunt/Jobhunt/20-Actions/Action Dashboard.md`
- **This Workflow**: `/Users/lcalderon/github/JobHunt/Jobhunt/20-Actions/ACTION-ITEMS-WORKFLOW.md`
