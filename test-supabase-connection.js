const SUPABASE_URL = 'https://dkufgfmwqsxecylyvidi.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrdWZnZm13cXN4ZWN5bHl2aWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5NjAxODMsImV4cCI6MjA0OTUzNjE4M30.sRjuUO41AoN9lqCWmRKjxVDN48rVWnNyIz8n2ShdHqE';

async function test() {
    console.log('Testing Supabase connection...\n');
    
    // Test 1: Simple GET
    console.log('1. Testing GET request...');
    const getResponse = await fetch(`${SUPABASE_URL}/rest/v1/job_search_data?id=eq.main`, {
        headers: {
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`
        }
    });
    
    console.log('Status:', getResponse.status);
    console.log('Response:', await getResponse.text());
    console.log('');
    
    // Test 2: Try to update with new column
    console.log('2. Testing PATCH with linkedin_conversations...');
    const patchResponse = await fetch(`${SUPABASE_URL}/rest/v1/job_search_data?id=eq.main`, {
        method: 'PATCH',
        headers: {
            'apikey': ANON_KEY,
            'Authorization': `Bearer ${ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify({
            linkedin_conversations: []
        })
    });
    
    console.log('Status:', patchResponse.status);
    console.log('Response:', await patchResponse.text());
}

test().catch(console.error);
