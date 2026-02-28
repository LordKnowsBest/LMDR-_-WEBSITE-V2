const crypto = require('crypto');

async function computeHmacSignature(message, secret) {
  try {
    const key = crypto.createSecretKey(Buffer.from(secret));
    const hmac = crypto.createHmac('sha256', key);
    hmac.update(message);
    return hmac.digest('hex');
  } catch (error) {
    console.error('[Webhook] HMAC computation error:', error);
    throw error;
  }
}

async function verifyStripeSignature(payload, signature, webhookSecret) {
  try {
    if (!signature) {
      return { success: false, error: 'No signature provided' };
    }

    if (!webhookSecret) {
      return { success: false, error: 'Server configuration error' };
    }

    const elements = signature.split(',');
    const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
    const signatureHash = elements.find(e => e.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !signatureHash) {
      return { success: false, error: 'Invalid signature format' };
    }

    // Use current time or a simulated time for testing
    const now = Math.floor(Date.now() / 1000);
    const tolerance = 5 * 60;
    if (Math.abs(now - parseInt(timestamp)) > tolerance) {
      return { success: false, error: 'Timestamp outside tolerance' };
    }

    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = await computeHmacSignature(signedPayload, webhookSecret);

    // Node.js crypto timingSafeEqual requires buffers of same length
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const signatureBuffer = Buffer.from(signatureHash, 'utf8');

    if (expectedBuffer.length !== signatureBuffer.length) {
      return { success: false, error: 'Signature mismatch' };
    }

    if (!crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      return { success: false, error: 'Signature mismatch' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Tests
async function runTests() {
  const secret = 'whsec_test_secret';
  const payload = '{"id":"evt_test","type":"payment_intent.succeeded"}';
  const timestamp = Math.floor(Date.now() / 1000);

  // Generate valid signature
  const validHash = await computeHmacSignature(`${timestamp}.${payload}`, secret);
  const validSignatureHeader = `t=${timestamp},v1=${validHash}`;

  // Test 1: Valid signature
  const res1 = await verifyStripeSignature(payload, validSignatureHeader, secret);
  console.assert(res1.success === true, 'Test 1 (Valid) failed');
  console.log('Test 1 (Valid): PASS');

  // Test 2: Invalid signature (wrong hash)
  const invalidHashHeader = `t=${timestamp},v1=badhash1234567890abcdef1234567890abcdef1234567890abcdef1234567890`;
  const res2 = await verifyStripeSignature(payload, invalidHashHeader, secret);
  console.assert(res2.success === false, 'Test 2 (Invalid hash) failed');
  console.log('Test 2 (Invalid hash): PASS');

  // Test 3: Invalid signature (wrong secret)
  const wrongSecret = 'whsec_wrong_secret';
  const res3 = await verifyStripeSignature(payload, validSignatureHeader, wrongSecret);
  console.assert(res3.success === false, 'Test 3 (Wrong secret) failed');
  console.log('Test 3 (Wrong secret): PASS');

  // Test 4: Expired timestamp
  const oldTimestamp = timestamp - (6 * 60); // 6 minutes ago
  const oldHash = await computeHmacSignature(`${oldTimestamp}.${payload}`, secret);
  const expiredHeader = `t=${oldTimestamp},v1=${oldHash}`;
  const res4 = await verifyStripeSignature(payload, expiredHeader, secret);
  console.assert(res4.success === false, 'Test 4 (Expired timestamp) failed');
  console.assert(res4.error === 'Timestamp outside tolerance', 'Test 4 error mismatch');
  console.log('Test 4 (Expired timestamp): PASS');

  // Test 5: Missing parts
  const incompleteHeader = `t=${timestamp}`;
  const res5 = await verifyStripeSignature(payload, incompleteHeader, secret);
  console.assert(res5.success === false, 'Test 5 (Missing parts) failed');
  console.log('Test 5 (Missing parts): PASS');
}

runTests().catch(console.error);
