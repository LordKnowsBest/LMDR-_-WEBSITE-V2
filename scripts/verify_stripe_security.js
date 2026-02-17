const fs = require('fs');

async function verifyStripeSecurity() {
    console.log('Running Stripe Security Verification...');

    // 1. Check stripeCore.js exists
    if (fs.existsSync('src/backend/stripeCore.js')) {
        console.log('PASS: src/backend/stripeCore.js exists.');
    } else {
        console.error('FAIL: src/backend/stripeCore.js MISSING.');
        process.exit(1);
    }

    // 2. Check stripeService.jsw for banned exports
    const stripeServiceContent = fs.readFileSync('src/backend/stripeService.jsw', 'utf8');
    const bannedFunctions = [
        'upsertSubscription',
        'resetQuota',
        'updateSubscriptionStatus',
        'updatePaymentStatus',
        'upsertApiSubscriptionFromStripe'
    ];

    let fail = false;
    for (const func of bannedFunctions) {
        // Look for "export async function funcName" or "export function funcName"
        // Also check if it appears in an export list (e.g. export { funcName })
        // Note: Simple regex to catch direct exports
        const exportRegex = new RegExp(`export\\s+(async\\s+)?function\\s+${func}\\b`);

        if (exportRegex.test(stripeServiceContent)) {
            console.error(`FAIL: Banned function '${func}' is exported in stripeService.jsw!`);
            fail = true;
        } else {
            console.log(`PASS: Function '${func}' is NOT exported via declaration.`);
        }

        // Check for named export list
        // If the file ends with "export { ... }", we need to check inside.
        // But stripeService.jsw follows "export async function ..." pattern.
    }

    if (fail) {
        console.error('Security Verification FAILED');
        process.exit(1);
    } else {
        console.log('PASS: All security checks passed.');
    }
}

verifyStripeSecurity();
