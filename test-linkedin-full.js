// Full automated LinkedIn CRM Extension test with real login
const { chromium } = require('playwright');
const path = require('path');

const LINKEDIN_EMAIL = 'luis@calderon.com';
const LINKEDIN_PASSWORD = 'WMr9LpKG3rbn7E6';

async function testLinkedInExtension() {
    console.log('🚀 Starting full LinkedIn CRM Extension test with auto-login...\n');

    const extensionPath = path.join(__dirname, 'linkedin-crm-extension');

    // Launch browser with extension
    const context = await chromium.launchPersistentContext('', {
        headless: false, // Extensions require headed mode
        args: [
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`,
            '--no-sandbox'
        ]
    });

    const page = await context.newPage();

    // Capture extension console logs
    const extensionLogs = [];
    page.on('console', msg => {
        const text = msg.text();
        extensionLogs.push(text);
        if (text.includes('LinkedIn CRM') || text.includes('Syncing') || text.includes('✅') || text.includes('❌')) {
            console.log('📱', text);
        }
    });

    try {
        // Step 1: Login to LinkedIn
        console.log('📍 Step 1: Logging into LinkedIn...');
        await page.goto('https://www.linkedin.com/login', { waitUntil: 'networkidle' });

        await page.fill('input[name="session_key"]', LINKEDIN_EMAIL);
        await page.fill('input[name="session_password"]', LINKEDIN_PASSWORD);
        await page.click('button[type="submit"]');

        console.log('⏳ Waiting for login to complete...');
        await page.waitForURL('**/feed/**', { timeout: 30000 });
        console.log('✅ Login successful!\n');

        // Step 2: Navigate to Messages
        console.log('📍 Step 2: Navigating to LinkedIn Messages...');
        await page.goto('https://www.linkedin.com/messaging/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(3000);
        console.log('✅ Messages page loaded\n');

        // Step 3: Wait for extension to initialize
        console.log('📍 Step 3: Waiting for extension to detect messages...');
        await page.waitForTimeout(5000);

        // Step 4: Check debug stats
        console.log('📍 Step 4: Checking extension stats...');
        const stats = await page.evaluate(() => {
            if (window.linkedInCRMDebug) {
                window.linkedInCRMDebug.showStats();
                return {
                    available: true
                };
            }
            return { available: false };
        });

        if (!stats.available) {
            console.log('⚠️  Debug helper not found - extension may not have loaded properly');
        }

        // Step 5: Force a manual check
        console.log('\n📍 Step 5: Forcing manual sync check...');
        await page.evaluate(() => {
            if (window.linkedInCRMDebug) {
                window.linkedInCRMDebug.forceCheck();
            }
        });

        await page.waitForTimeout(8000);

        // Step 6: Look for notifications
        console.log('\n📍 Step 6: Checking for sync notifications...');
        const notifications = await page.locator('div').filter({ hasText: /Synced:|✓/ }).count();
        if (notifications > 0) {
            console.log(`✅ Found ${notifications} sync notification(s)!`);
        } else {
            console.log('⚠️  No visual notifications detected');
        }

        // Step 7: Analyze logs
        console.log('\n📍 Step 7: Analyzing extension activity...');
        const syncLogs = extensionLogs.filter(log =>
            log.includes('Message synced to CRM') ||
            log.includes('New LinkedIn message detected') ||
            log.includes('Total conversations')
        );

        if (syncLogs.length > 0) {
            console.log(`✅ Extension synced ${syncLogs.length} message(s):`);
            syncLogs.forEach(log => console.log(`   - ${log}`));
        } else {
            console.log('⚠️  No sync activity detected in logs');
            console.log('   This could mean:');
            console.log('   1. All messages were already processed');
            console.log('   2. Extension encountered errors');
            console.log('   3. No messages found on the page');
        }

        // Step 8: Check for errors
        const errorLogs = extensionLogs.filter(log =>
            log.includes('Error') ||
            log.includes('Failed') ||
            log.includes('❌')
        );

        if (errorLogs.length > 0) {
            console.log('\n⚠️  Errors detected:');
            errorLogs.forEach(log => console.log(`   ❌ ${log}`));
        }

        console.log('\n' + '='.repeat(80));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(80));
        console.log(`✅ Extension loaded: ${stats.available ? 'YES' : 'NO'}`);
        console.log(`✅ LinkedIn logged in: YES`);
        console.log(`✅ Messages page accessed: YES`);
        console.log(`📝 Sync events detected: ${syncLogs.length}`);
        console.log(`❌ Errors detected: ${errorLogs.length}`);
        console.log(`📱 Total console logs: ${extensionLogs.length}`);
        console.log('='.repeat(80));

        console.log('\n🔗 Verify synced data at:');
        console.log('   https://supabase.com/dashboard/project/dkufgfmwqsxecylyvidi/editor');
        console.log('\n💡 Browser will stay open for 30 seconds for manual inspection...');

        await page.waitForTimeout(30000);

        console.log('\n✅ Test complete! Closing browser...');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.log('\n💡 Browser will stay open for debugging. Press Ctrl+C to exit.');
        await page.waitForTimeout(60000);
    }

    await context.close();
    console.log('\n👋 Done!');
}

testLinkedInExtension().catch(console.error);
