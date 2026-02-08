
const { webcrypto } = require('crypto');
// We need 'crypto' for timingSafeEqual in the updated code,
// which is standard node crypto, not webcrypto.
const crypto = require('crypto');

if (!global.crypto) {
    global.crypto = webcrypto;
}

// Mock getSecret
let mockSecrets = {
    'STRIPE_WEBHOOK_SECRET': 'whsec_test_secret'
};
async function getSecret(key) {
    return mockSecrets[key];
}

// --- START: Code from src/backend/http-functions.js (UPDATED) ---

async function verifyStripeSignature(payload, signature) {
  try {
    if (!signature) {
      return { success: false, error: 'No signature provided' };
    }

    const webhookSecret = await getSecret('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('[Webhook] No webhook secret configured. FAILING CLOSED.');
      return { success: false, error: 'Configuration error: No webhook secret' };
    }

    // Parse signature header
    // Format: t=timestamp,v1=signature
    const elements = signature.split(',');
    const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
    const signatureHash = elements.find(e => e.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !signatureHash) {
      return { success: false, error: 'Invalid signature format' };
    }

    // Check timestamp tolerance (5 minutes)
    const tolerance = 5 * 60;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > tolerance) {
      return { success: false, error: 'Timestamp outside tolerance' };
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = await computeHmacSignature(signedPayload, webhookSecret);

    // Compare signatures (timing-safe comparison)
    // UPDATED LOGIC HERE
    const expectedSignatureBuffer = Buffer.from(expectedSignature, 'hex');
    const signatureHashBuffer = Buffer.from(signatureHash, 'hex');

    if (expectedSignatureBuffer.length !== signatureHashBuffer.length ||
        !crypto.timingSafeEqual(expectedSignatureBuffer, signatureHashBuffer)) {
      return { success: false, error: 'Signature mismatch' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Webhook] Signature verification error:', error);
    return { success: false, error: error.message };
  }
}

async function computeHmacSignature(message, secret) {
  try {
    // Encode the key and message
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);

    // Import key for HMAC
    const cryptoKey = await global.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Sign the message
    const signature = await global.crypto.subtle.sign('HMAC', cryptoKey, messageData);

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  } catch (error) {
    console.error('[Webhook] HMAC computation error:', error);
    throw error;
  }
}
// --- END: Code from src/backend/http-functions.js ---


// Tests
async function runTests() {
    console.log('Running tests...');

    const secret = 'whsec_test_secret';
    const payload = JSON.stringify({ id: 'evt_test', type: 'charge.succeeded' });
    const timestamp = Math.floor(Date.now() / 1000);

    // Calculate valid signature
    const signedPayload = `${timestamp}.${payload}`;
    const validSignature = await computeHmacSignature(signedPayload, secret);
    const validHeader = `t=${timestamp},v1=${validSignature}`;

    // Test 1: Valid signature
    console.log('Test 1: Valid signature');
    const res1 = await verifyStripeSignature(payload, validHeader);
    if (res1.success) console.log('PASS'); else console.error('FAIL: ' + JSON.stringify(res1));

    // Test 2: Invalid signature
    console.log('Test 2: Invalid signature (tampered payload)');
    const tamperedPayload = payload + ' ';
    const res2 = await verifyStripeSignature(tamperedPayload, validHeader);
    if (!res2.success) console.log('PASS'); else console.error('FAIL: Should have failed but succeeded.');

    // Test 3: Missing secret (VULNERABILITY CHECK - REMEDIATED)
    console.log('Test 3: Missing secret (Should FAIL CLOSED)');
    mockSecrets['STRIPE_WEBHOOK_SECRET'] = undefined; // Simulate missing secret
    const res3 = await verifyStripeSignature(payload, validHeader);

    // Expect failure now
    if (!res3.success && res3.error === 'Configuration error: No webhook secret') {
        console.log('PASS (Remediation Verified: Fail Closed)');
    } else {
        console.error('FAIL: Expected failure with config error, got: ' + JSON.stringify(res3));
    }
    mockSecrets['STRIPE_WEBHOOK_SECRET'] = secret; // Restore secret
}

runTests();
