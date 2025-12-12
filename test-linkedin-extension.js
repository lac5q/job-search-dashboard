// Playwright test for LinkedIn CRM Extension
// This script loads the extension and tests it on LinkedIn messaging

const { chromium } = require('playwright');
const path = require('path');

async function testLinkedInExtension() {
    console.log('🚀 Starting LinkedIn CRM Extension test...\n');

    const extensionPath = path.join(__dirname, 'linkedin-crm-extension');

    // Launch browser with extension
    const context = await chromium.launchPersistentContext('', {
        headless: false, // Must be false for extensions
        args: [
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`,
            '--no-sandbox'
        ]
    });

    const page = await context.newPage();

    // Set up console logging from the page
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('LinkedIn CRM')) {
            console.log('📱 Extension:', text);
        }
    });

    try {
        console.log('📍 Step 1: Navigating to LinkedIn...');
        await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Check if we need to login
        const loginRequired = await page.locator('input[name="session_key"]').count() > 0;

        if (loginRequired) {
            console.log('⚠️  LinkedIn login required. Please login manually...');
            console.log('   Once logged in, navigate to Messages and the extension will auto-sync.');
            console.log('   Press Ctrl+C when done testing.\n');

            // Wait indefinitely for manual testing
            await page.waitForTimeout(1000000);
        } else {
            console.log('✅ Already logged into LinkedIn\n');

            console.log('📍 Step 2: Navigating to LinkedIn Messages...');
            await page.goto('https://www.linkedin.com/messaging/', { waitUntil: 'networkidle' });
            await page.waitForTimeout(3000);

            console.log('📍 Step 3: Checking for extension activity...');
            console.log('   Look for extension console logs above.');
            console.log('   Green notifications should appear on the page when messages sync.\n');

            // Wait for extension to detect messages
            await page.waitForTimeout(10000);

            console.log('📍 Step 4: Testing debug helper...');
            const stats = await page.evaluate(() => {
                if (window.linkedInCRMDebug) {
                    window.linkedInCRMDebug.showStats();
                    return 'Debug helper available';
                }
                return 'Debug helper NOT found';
            });
            console.log(`   ${stats}\n`);

            console.log('📍 Step 5: Forcing a manual check...');
            await page.evaluate(() => {
                if (window.linkedInCRMDebug) {
                    window.linkedInCRMDebug.forceCheck();
                }
            });

            await page.waitForTimeout(5000);

            console.log('\n✅ Test complete! Check the console logs above for sync activity.');
            console.log('   Extension should have detected and synced LinkedIn conversations.');
            console.log('   Verify data at: https://supabase.com/dashboard/project/dkufgfmwqsxecylyvidi/editor\n');
        }

    } catch (error) {
        console.error('❌ Test error:', error.message);
    }

    // Keep browser open for manual inspection
    console.log('💡 Browser will stay open for manual inspection. Press Ctrl+C to exit.');
    await page.waitForTimeout(1000000);

    await context.close();
}

testLinkedInExtension().catch(console.error);
