const crypto = require('crypto');

// ============================================================================
// LOGIC TO BE VERIFIED
// ============================================================================

async function verifyStripeSignature(payload, signatureHeader, webhookSecret) {
  try {
    if (!signatureHeader) {
      return { success: false, error: 'No signature provided' };
    }

    if (!webhookSecret) {
      console.error('[Webhook] No webhook secret configured. Rejecting request.');
      return { success: false, error: 'Configuration Error: Missing Secret' };
    }

    // Parse signature header
    // Format: t=timestamp,v1=signature
    const elements = signatureHeader.split(',');
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
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload)
      .digest('hex');

    // Compare signatures (timing-safe comparison)
    const signatureBuffer = Buffer.from(signatureHash, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (signatureBuffer.length !== expectedBuffer.length) {
       return { success: false, error: 'Signature mismatch' };
    }

    if (!crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return { success: false, error: 'Signature mismatch' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Webhook] Signature verification error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// TESTS
// ============================================================================

async function runTests() {
  console.log('--- STARTING STRIPE SIGNATURE VERIFICATION TESTS ---');

  const secret = 'whsec_test_secret';
  const payload = JSON.stringify({ id: 'evt_test', type: 'test.event' });
  const now = Math.floor(Date.now() / 1000);

  // 1. Valid Signature
  const validSignature = crypto.createHmac('sha256', secret).update(`${now}.${payload}`).digest('hex');
  const validHeader = `t=${now},v1=${validSignature}`;
  const result1 = await verifyStripeSignature(payload, validHeader, secret);
  console.log(`Test 1 (Valid): ${result1.success ? 'PASS' : 'FAIL'}`, result1);

  // 2. Invalid Signature (Tampered Payload)
  const tamperedPayload = payload + ' ';
  const result2 = await verifyStripeSignature(tamperedPayload, validHeader, secret);
  console.log(`Test 2 (Invalid Payload): ${!result2.success ? 'PASS' : 'FAIL'}`, result2);

  // 3. Invalid Signature (Wrong Secret)
  const result3 = await verifyStripeSignature(payload, validHeader, 'whsec_wrong');
  console.log(`Test 3 (Wrong Secret): ${!result3.success ? 'PASS' : 'FAIL'}`, result3);

  // 4. Timestamp Validation (Too Old)
  const oldTimestamp = now - 600; // 10 minutes ago
  const oldSignature = crypto.createHmac('sha256', secret).update(`${oldTimestamp}.${payload}`).digest('hex');
  const oldHeader = `t=${oldTimestamp},v1=${oldSignature}`;
  const result4 = await verifyStripeSignature(payload, oldHeader, secret);
  console.log(`Test 4 (Old Timestamp): ${!result4.success ? 'PASS' : 'FAIL'}`, result4);

  // 5. Missing Secret Configuration
  const result5 = await verifyStripeSignature(payload, validHeader, null);
  console.log(`Test 5 (Missing Secret Config): ${!result5.success ? 'PASS' : 'FAIL'}`, result5);

  // 6. Malformed Header
  const result6 = await verifyStripeSignature(payload, 'invalid-header', secret);
  console.log(`Test 6 (Malformed Header): ${!result6.success ? 'PASS' : 'FAIL'}`, result6);

  console.log('--- TESTS COMPLETE ---');
}

runTests();
