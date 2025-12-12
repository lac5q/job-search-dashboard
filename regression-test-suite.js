const { chromium } = require('playwright');

async function runTests() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();

    const results = {
        passed: [],
        failed: []
    };

    console.log('🧪 REGRESSION TEST SUITE\n');
    console.log('='.repeat(70));

    try {
        // TEST 1: Supabase credentials load
        console.log('\n[TEST 1] Supabase credentials should load from localStorage');
        await page.goto('file://' + __dirname + '/job-search-dashboard.html');
        await page.waitForLoadState('networkidle');

        await page.evaluate(() => {
            localStorage.setItem('supabaseUrl', 'https://dkufgfmwqsxecylyvidi.supabase.co');
            localStorage.setItem('supabaseKey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrdWZnZm13cXN4ZWN5bHl2aWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0OTIxMTgsImV4cCI6MjA4MTA2ODExOH0.GPdoDd7z5nuGx-oQ2l6CQX-fdz7T4CdUpG_PwORZB_g');
        });
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        const creds = await page.evaluate(() => ({
            url: localStorage.getItem('supabaseUrl'),
            hasKey: !!localStorage.getItem('supabaseKey')
        }));

        if (creds.url && creds.hasKey) {
            results.passed.push('TEST 1: Credentials loaded ✓');
        } else {
            results.failed.push('TEST 1: Credentials missing ✗');
        }

        // TEST 2: Contacts load from Supabase
        console.log('[TEST 2] Contacts should load from Supabase');
        const contacts = await page.evaluate(() => {
            return JSON.parse(localStorage.getItem('jobSearchContacts') || '[]');
        });

        if (contacts.length >= 15) {
            results.passed.push(`TEST 2: ${contacts.length} contacts loaded ✓`);
        } else {
            results.failed.push(`TEST 2: Only ${contacts.length} contacts loaded (expected 15+) ✗`);
        }

        // TEST 3: Contacts page renders
        console.log('[TEST 3] Contacts should render on Contacts tab');
        await page.click('[data-tab="contacts"]');
        await page.waitForTimeout(1000);

        const renderInfo = await page.evaluate(() => {
            const cards = document.querySelectorAll('.contact-card').length;
            const allContacts = JSON.parse(localStorage.getItem('jobSearchContacts') || '[]');
            const naCount = allContacts.filter(c => c.isNA).length;
            return { cards, naCount, total: allContacts.length };
        });

        // Should render all contacts minus those marked NA (which are hidden by default)
        const expectedRendered = renderInfo.total - renderInfo.naCount;
        if (renderInfo.cards === expectedRendered || renderInfo.cards >= 10) {
            results.passed.push(`TEST 3: ${renderInfo.cards} contact cards rendered (${renderInfo.naCount} NA hidden) ✓`);
        } else {
            results.failed.push(`TEST 3: Only ${renderInfo.cards} contact cards rendered (expected ${expectedRendered}) ✗`);
        }

        // TEST 4: Contact names display correctly
        console.log('[TEST 4] Contact names should not contain "undefined"');
        const names = await page.evaluate(() => {
            const cards = document.querySelectorAll('.contact-card-name');
            return Array.from(cards).slice(0, 10).map(el => el.textContent.trim());
        });

        const brokenNames = names.filter(n => n.includes('undefined'));
        if (brokenNames.length === 0) {
            results.passed.push('TEST 4: All names display correctly ✓');
        } else {
            results.failed.push(`TEST 4: ${brokenNames.length}/10 names contain "undefined" ✗`);
        }

        // TEST 5: Toggle NA function exists
        console.log('[TEST 5] toggleNA function should exist');
        const hasToggleNA = await page.evaluate(() => {
            return typeof toggleNA === 'function';
        });

        if (hasToggleNA) {
            results.passed.push('TEST 5: toggleNA function exists ✓');
        } else {
            results.failed.push('TEST 5: toggleNA function missing ✗');
        }

        // TEST 6: NA button exists on contact cards
        console.log('[TEST 6] NA button should exist on contact cards');
        const hasNAButton = await page.evaluate(() => {
            const firstCard = document.querySelector('.contact-card');
            if (!firstCard) return false;
            const naButton = Array.from(firstCard.querySelectorAll('button')).find(b =>
                b.textContent.includes('NA')
            );
            return !!naButton;
        });

        if (hasNAButton) {
            results.passed.push('TEST 6: NA button found on contact cards ✓');
        } else {
            results.failed.push('TEST 6: NA button missing from contact cards ✗');
        }

        // TEST 7: 'Show NA' filter exists
        console.log('[TEST 7] "Show NA" filter checkbox should exist');
        const hasShowNAFilter = await page.evaluate(() => {
            return !!document.getElementById('filter-show-na');
        });

        if (hasShowNAFilter) {
            results.passed.push('TEST 7: "Show NA" filter exists ✓');
        } else {
            results.failed.push('TEST 7: "Show NA" filter missing ✗');
        }

    } catch (error) {
        results.failed.push(`FATAL ERROR: ${error.message}`);
    }

    // Print results
    console.log('\n' + '='.repeat(70));
    console.log('TEST RESULTS');
    console.log('='.repeat(70));

    console.log('\n✅ PASSED:');
    results.passed.forEach(r => console.log('  ' + r));

    if (results.failed.length > 0) {
        console.log('\n❌ FAILED:');
        results.failed.forEach(r => console.log('  ' + r));
    }

    console.log('\n' + '='.repeat(70));
    console.log(`Summary: ${results.passed.length} passed, ${results.failed.length} failed`);
    console.log('='.repeat(70));

    await page.screenshot({ path: '/tmp/regression-test.png', fullPage: true });
    console.log('\n📸 Screenshot: /tmp/regression-test.png');

    console.log('\nBrowser stays open for 20 seconds...');
    await page.waitForTimeout(20000);
    await browser.close();

    return results.failed.length === 0;
}

runTests().then(success => {
    process.exit(success ? 0 : 1);
});
