// Quick API test for LinkedIn CRM Extension
// Tests that the extension can successfully sync to the API

const API_ENDPOINT = 'https://luis-jobhunt-pvrrefr6d-luis-calderons-projects-9c5eea79.vercel.app/api/linkedin-sync';

async function testSync() {
    console.log('🧪 Testing LinkedIn CRM Sync API...\n');

    const testData = {
        conversationId: `test-${Date.now()}`,
        contactName: 'Test Contact',
        message: 'This is a test message from the extension',
        timestamp: new Date().toISOString(),
        url: 'https://linkedin.com/messaging/test'
    };

    console.log('📤 Sending test data:', testData);
    console.log('');

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        console.log(`📊 HTTP Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:', errorText);
            process.exit(1);
        }

        const result = await response.json();
        console.log('✅ Success!');
        console.log('📦 Response:', JSON.stringify(result, null, 2));
        console.log('');
        console.log(`📈 Total conversations in CRM: ${result.totalConversations}`);
        console.log('');
        console.log('🎉 Extension API is working correctly!');
        console.log('🔗 Verify in Supabase: https://supabase.com/dashboard/project/dkufgfmwqsxecylyvidi/editor');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testSync();
