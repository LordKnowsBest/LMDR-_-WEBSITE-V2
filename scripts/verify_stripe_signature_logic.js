const crypto = require('crypto');

// Mock getSecret for testing
async function getSecret(key) {
  if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_test_secret';
  return null;
}

// Mock Stripe Webhook Secret
const WEBHOOK_SECRET = 'whsec_test_secret';

// --- Copied Logic from src/backend/http-functions.js (Original) ---

/**
 * Compute HMAC-SHA256 signature
 * Note: Since we are running in Node.js, we use crypto directly instead of Web Crypto API (crypto.subtle)
 * which is used in Velo backend but behaves similarly for standard HMAC.
 */
function computeHmacSignature(message, secret) {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

/**
 * Verify Stripe webhook signature (Original Vulnerable Implementation)
 */
async function verifyStripeSignatureOriginal(payload, signature) {
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
    const expectedSignature = computeHmacSignature(signedPayload, webhookSecret);

    // VULNERABLE COMPARISON: standard string comparison
    if (expectedSignature !== signatureHash) {
      return { success: false, error: 'Signature mismatch' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Webhook] Signature verification error:', error);
    return { success: false, error: error.message };
  }
}

// --- Proposed Fix (Safe Implementation) ---

/**
 * Verify Stripe webhook signature (Safe Implementation)
 */
async function verifyStripeSignatureSafe(payload, signature) {
  try {
    if (!signature) {
      return { success: false, error: 'No signature provided' };
    }

    const webhookSecret = await getSecret('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      return { success: false, error: 'Server configuration error' };
    }

    const elements = signature.split(',');
    const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
    const signatureHash = elements.find(e => e.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !signatureHash) {
      return { success: false, error: 'Invalid signature format' };
    }

    const tolerance = 5 * 60;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > tolerance) {
      return { success: false, error: 'Timestamp outside tolerance' };
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = computeHmacSignature(signedPayload, webhookSecret);

    // SECURE COMPARISON: timingSafeEqual
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const actualBuffer = Buffer.from(signatureHash, 'hex');

    if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
      return { success: false, error: 'Signature mismatch' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}


// --- Test Execution ---

async function runTests() {
  console.log('Running Stripe Signature Verification Tests...');

  const payload = JSON.stringify({ id: 'evt_test_123', type: 'charge.succeeded' });
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const validSignature = computeHmacSignature(signedPayload, WEBHOOK_SECRET);
  const header = `t=${timestamp},v1=${validSignature}`;

  // Test 1: Original Logic with Valid Signature
  const result1 = await verifyStripeSignatureOriginal(payload, header);
  if (result1.success) {
    console.log('✅ Test 1 Passed: Original logic validates correct signature.');
  } else {
    console.error('❌ Test 1 Failed: Original logic rejected correct signature.', result1.error);
  }

  // Test 2: Original Logic with Invalid Signature
  const invalidHeader = `t=${timestamp},v1=invalid_signature_hash`;
  const result2 = await verifyStripeSignatureOriginal(payload, invalidHeader);
  if (!result2.success && result2.error === 'Signature mismatch') {
    console.log('✅ Test 2 Passed: Original logic correctly rejects invalid signature.');
  } else {
    console.error('❌ Test 2 Failed: Original logic allowed invalid signature or failed incorrectly.', result2);
  }

  // Test 3: Safe Logic with Valid Signature
  const result3 = await verifyStripeSignatureSafe(payload, header);
  if (result3.success) {
    console.log('✅ Test 3 Passed: Safe logic validates correct signature.');
  } else {
    console.error('❌ Test 3 Failed: Safe logic rejected correct signature.', result3.error);
  }

  // Test 4: Safe Logic with Invalid Signature
  const result4 = await verifyStripeSignatureSafe(payload, invalidHeader);
  if (!result4.success && result4.error === 'Signature mismatch') {
    console.log('✅ Test 4 Passed: Safe logic correctly rejects invalid signature.');
  } else {
    console.error('❌ Test 4 Failed: Safe logic allowed invalid signature or failed incorrectly.', result4);
  }

  // Note on Vulnerability
  console.log('\n⚠️  Vulnerability Note: The original implementation uses `expectedSignature !== signatureHash`.');
  console.log('    This allows an attacker to deduce the signature byte-by-byte by measuring response times (timing attack).');
  console.log('    The "Safe" implementation uses `crypto.timingSafeEqual` to prevent this.');
}

runTests();
