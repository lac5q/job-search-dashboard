# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal job search command center for Luis Calderon targeting VP/Director/Principal PM roles. The project consists of:

- **Interactive HTML dashboard** (`job-search-dashboard.html`) - Main job search tracker with progress metrics, task lists, and quick actions
- **Resume/CV page** (`resume.html`) - Professional resume with copy-to-clipboard functionality for LinkedIn sections
- **Supporting markdown documents** - Strategy guides, LinkedIn content, and positioning materials

## Tech Stack

- Static HTML/CSS/JavaScript (no build system)
- Deployed to Vercel as static files
- Uses browser localStorage for local persistence
- Optional Supabase integration for cross-browser/device sync

## Commands

### Local Development
```bash
# Open dashboard locally
open job-search-dashboard.html

# Open resume locally
open resume.html
```

### Deployment
```bash
# Deploy to Vercel (requires vercel CLI)
vercel --prod
```

The `vercel.json` configures routing so `/` serves `job-search-dashboard.html`.

## Architecture

### Dashboard (`job-search-dashboard.html`)
- Self-contained single HTML file with embedded CSS and JavaScript
- Progress tracking via `localStorage.getItem('jobSearchProgress')`
- Task checkboxes auto-save state
- Calculates days active from stored start date

### Resume (`resume.html`)
- Self-contained single HTML file with embedded CSS and JavaScript
- `copyLinkedInFormat()` function provides pre-formatted text for LinkedIn sections (About, Experience entries)
- `copySectionToClipboard()` for generic section copying
- Print-friendly CSS (`@media print`)

### Key Documents
- `MASTER-PROJECT-PLAN.md` - Complete 90-day strategy with phases, milestones, and tracking
- `LINKEDIN-SECTIONS-BREAKDOWN.md` - Copy-paste ready LinkedIn content
- `YOUR-AI-COMPETITIVE-ADVANTAGE.md` - Positioning for interviews

## Cloud Sync (Optional)

The dashboard supports optional Supabase sync for cross-browser/device data persistence:

1. Click "Settings" button in dashboard header
2. Enter Supabase project URL and anon API key
3. Data will auto-sync on every change

See `SUPABASE-SETUP.md` for detailed setup instructions.

### Sync Architecture
- `sync-manager.js` - Shared sync module used by all pages
- Data synced: contacts, progress, message templates, reviewed contacts
- Conflict resolution: Latest timestamp wins
- Offline support: Works offline, syncs when online

## Important Notes

- Data works offline (localStorage) with optional cloud sync via Supabase
- Both HTML files are designed to work standalone without dependencies
- Sync is configured once and shared across all pages via localStorage credentials
