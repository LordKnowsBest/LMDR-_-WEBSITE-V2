// scripts/verify_stripe_signature.js

const crypto = require('crypto');

// Mock Velo environment
global.crypto = crypto.webcrypto;

const MOCK_SECRET = 'whsec_test_secret';

async function getSecret(key) {
  if (key === 'STRIPE_WEBHOOK_SECRET') return MOCK_SECRET;
  throw new Error(`Secret not found: ${key}`);
}

// --- COPIED FROM src/backend/http-functions.js ---

/**
 * Verify Stripe webhook signature
 * Uses HMAC-SHA256 to validate the request came from Stripe
 */
async function verifyStripeSignature(payload, signature) {
  try {
    if (!signature) {
      return { success: false, error: 'No signature provided' };
    }

    const webhookSecret = await getSecret('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('[Webhook] Missing STRIPE_WEBHOOK_SECRET — rejecting request');
      return { success: false, error: 'Server configuration error' };
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
    const expectedBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(signatureHash);

    if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      return { success: false, error: 'Signature mismatch' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Webhook] Signature verification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Compute HMAC-SHA256 signature
 * Wix Velo uses Web Crypto API
 */
async function computeHmacSignature(message, secret) {
  try {
    // Encode the key and message
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);

    // Import key for HMAC
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Sign the message
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  } catch (error) {
    console.error('[Webhook] HMAC computation error:', error);
    throw error;
  }
}

// --- END COPIED CODE ---

// --- TEST HELPERS ---

function generateSignature(payload, secret, timestamp) {
  const signedPayload = `${timestamp}.${payload}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(signedPayload);
  return `t=${timestamp},v1=${hmac.digest('hex')}`;
}

async function runTests() {
  console.log('Starting Stripe Signature Verification Tests...');
  let passed = 0;
  let failed = 0;

  const payload = JSON.stringify({
    id: 'evt_test_webhook',
    object: 'event',
  });

  // Test 1: Valid Signature
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = generateSignature(payload, MOCK_SECRET, timestamp);
    const result = await verifyStripeSignature(payload, signature);
    if (result.success) {
      console.log('PASS: Valid Signature');
      passed++;
    } else {
      console.error('FAIL: Valid Signature -', result.error);
      failed++;
    }
  } catch (e) {
    console.error('FAIL: Valid Signature (Exception)', e);
    failed++;
  }

  // Test 2: Invalid Signature (Tampered Payload)
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = generateSignature(payload, MOCK_SECRET, timestamp);
    const tamperedPayload = payload + ' '; // Added space
    const result = await verifyStripeSignature(tamperedPayload, signature);
    if (!result.success && result.error === 'Signature mismatch') {
      console.log('PASS: Invalid Signature (Tampered Payload)');
      passed++;
    } else {
      console.error('FAIL: Invalid Signature (Tampered Payload) - Expected mismatch, got:', result);
      failed++;
    }
  } catch (e) {
    console.error('FAIL: Invalid Signature (Exception)', e);
    failed++;
  }

  // Test 3: Invalid Secret
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = generateSignature(payload, 'wrong_secret', timestamp);
    const result = await verifyStripeSignature(payload, signature);
    if (!result.success && result.error === 'Signature mismatch') {
      console.log('PASS: Invalid Secret');
      passed++;
    } else {
      console.error('FAIL: Invalid Secret - Expected mismatch, got:', result);
      failed++;
    }
  } catch (e) {
    console.error('FAIL: Invalid Secret (Exception)', e);
    failed++;
  }

  // Test 4: Expired Timestamp
  try {
    const timestamp = Math.floor(Date.now() / 1000) - (6 * 60); // 6 minutes ago
    const signature = generateSignature(payload, MOCK_SECRET, timestamp);
    const result = await verifyStripeSignature(payload, signature);
    if (!result.success && result.error === 'Timestamp outside tolerance') {
      console.log('PASS: Expired Timestamp');
      passed++;
    } else {
      console.error('FAIL: Expired Timestamp - Expected tolerance error, got:', result);
      failed++;
    }
  } catch (e) {
    console.error('FAIL: Expired Timestamp (Exception)', e);
    failed++;
  }

   // Test 5: Future Timestamp (Should pass tolerance check usually, but let's check basic logic)
  try {
    const timestamp = Math.floor(Date.now() / 1000) + (6 * 60); // 6 minutes in future
    const signature = generateSignature(payload, MOCK_SECRET, timestamp);
    const result = await verifyStripeSignature(payload, signature);
    if (!result.success && result.error === 'Timestamp outside tolerance') {
      console.log('PASS: Future Timestamp');
      passed++;
    } else {
      console.error('FAIL: Future Timestamp - Expected tolerance error, got:', result);
      failed++;
    }
  } catch (e) {
    console.error('FAIL: Future Timestamp (Exception)', e);
    failed++;
  }

  console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests();
