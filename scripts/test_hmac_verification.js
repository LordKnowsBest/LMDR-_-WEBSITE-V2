const crypto = require('crypto');

// Replicating the verifyStripeSignature logic from http-functions.js
// Note: In real code, tolerance check is also done, but we are testing the crypto part here.
async function verifyStripeSignature(payload, signature, secret) {
    try {
        if (!signature) {
            return { success: false, error: 'No signature provided' };
        }

        const webhookSecret = secret;

        // Parse signature header
        const elements = signature.split(',');
        const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
        const signatureHash = elements.find(e => e.startsWith('v1='))?.split('=')[1];

        if (!timestamp || !signatureHash) {
            return { success: false, error: 'Invalid signature format' };
        }

        // Compute expected signature
        const signedPayload = `${timestamp}.${payload}`;
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(signedPayload)
            .digest('hex');

        // Compare signatures (timing-safe comparison)
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        const signatureBuffer = Buffer.from(signatureHash, 'hex');

        if (expectedBuffer.length !== signatureBuffer.length ||
            !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
            return { success: false, error: 'Signature mismatch' };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function runTest() {
    const secret = 'whsec_test_secret_123';
    const payload = JSON.stringify({ id: 'evt_123', type: 'test.event' });
    const timestamp = Math.floor(Date.now() / 1000);

    // Generate valid signature
    const signedPayload = `${timestamp}.${payload}`;
    const validSignatureHash = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
    const validSignatureHeader = `t=${timestamp},v1=${validSignatureHash}`;

    console.log('Running HMAC Verification Tests...');

    // Test 1: Valid signature
    const result1 = await verifyStripeSignature(payload, validSignatureHeader, secret);
    console.log('Test 1 (Valid Signature):', result1.success ? 'PASS' : `FAIL (${result1.error})`);

    // Test 2: Invalid signature (tampered payload)
    const result2 = await verifyStripeSignature(payload + 'tamper', validSignatureHeader, secret);
    console.log('Test 2 (Tampered Payload):', !result2.success ? 'PASS' : `FAIL (Should have failed)`);

    // Test 3: Invalid secret
    const result3 = await verifyStripeSignature(payload, validSignatureHeader, 'wrong_secret');
    console.log('Test 3 (Wrong Secret):', !result3.success ? 'PASS' : `FAIL (Should have failed)`);

    // Test 4: Timing Safe Check (Mock) - verify crypto.timingSafeEqual exists
    console.log('Test 4 (crypto.timingSafeEqual available):', typeof crypto.timingSafeEqual === 'function' ? 'PASS' : 'FAIL');
}

runTest();
