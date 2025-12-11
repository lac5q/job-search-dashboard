#!/bin/bash

# Supabase Setup Script for Job Search Dashboard
# This script helps you complete the Supabase setup

PROJECT_URL="https://dkufgfmwqsxecylyvidi.supabase.co"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Job Search Dashboard - Supabase Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: SQL Setup
echo "📝 STEP 1: Create Database Table"
echo "────────────────────────────────────────────────────────"
echo ""
echo "The SQL has been copied to your clipboard."
echo ""
echo "1. Press Enter to open the Supabase SQL Editor..."
read -r

# Copy SQL to clipboard
cat << 'EOFQL' | pbcopy
-- Create the job search data table
CREATE TABLE IF NOT EXISTS job_search_data (
    id TEXT PRIMARY KEY DEFAULT 'main',
    contacts JSONB DEFAULT '[]'::jsonb,
    progress JSONB DEFAULT '{}'::jsonb,
    message_templates JSONB DEFAULT '[]'::jsonb,
    reviewed_contacts JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial row
INSERT INTO job_search_data (id) VALUES ('main')
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE job_search_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations with anon key
CREATE POLICY "Allow all operations" ON job_search_data
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create function to auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS update_job_search_data_updated_at ON job_search_data;
CREATE TRIGGER update_job_search_data_updated_at
    BEFORE UPDATE ON job_search_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
EOFQL

# Open SQL Editor
open "https://supabase.com/dashboard/project/dkufgfmwqsxecylyvidi/sql/new"

echo "✅ SQL copied to clipboard"
echo ""
echo "2. Paste (Cmd+V) into the SQL editor"
echo "3. Click the green 'Run' button"
echo "4. Press Enter when done..."
read -r

# Step 2: Get Anon Key
echo ""
echo "🔑 STEP 2: Get Your Anon API Key"
echo "────────────────────────────────────────────────────────"
echo ""
echo "Press Enter to open the API settings page..."
read -r

open "https://supabase.com/dashboard/project/dkufgfmwqsxecylyvidi/settings/api"

echo ""
echo "Copy the 'anon' 'public' key (long string starting with 'eyJ...')"
echo ""
echo "Paste it here and press Enter:"
read -r ANON_KEY

if [ -z "$ANON_KEY" ]; then
  echo "❌ No key provided. Exiting."
  exit 1
fi

# Step 3: Configure Dashboard
echo ""
echo "🚀 STEP 3: Opening Dashboard to Configure Sync"
echo "────────────────────────────────────────────────────────"
echo ""
echo "Your credentials:"
echo "  URL: $PROJECT_URL"
echo "  Key: ${ANON_KEY:0:30}..."
echo ""

# Save to a temp file for easy access
cat > /tmp/supabase-creds.txt << EOF
Supabase URL: $PROJECT_URL
Anon Key: $ANON_KEY

Instructions:
1. Click the "Settings" button (with the sync indicator)
2. Paste the URL and Key
3. Click "Save & Connect"
4. You should see a green indicator - you're synced! ✅
EOF

echo "Credentials saved to: /tmp/supabase-creds.txt"
echo ""
echo "Press Enter to open the Job Search Dashboard..."
read -r

open "file:///Users/lcalderon/github/JobHunt/job-search-dashboard.html"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Your job search data will now sync across all browsers!"
echo ""
cat /tmp/supabase-creds.txt
