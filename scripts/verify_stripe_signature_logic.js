const crypto = require('crypto');

async function computeHmacSignature(message, secret) {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(message);
    return hmac.digest('hex');
  } catch (error) {
    console.error('[Webhook] HMAC computation error:', error);
    throw error;
  }
}

async function verifyStripeSignature(payload, signature, mockSecret) {
  try {
    if (!signature) {
      return { success: false, error: 'No signature provided' };
    }

    const webhookSecret = mockSecret;

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
    const expectedSignature = await computeHmacSignature(signedPayload, webhookSecret);

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const signatureBuffer = Buffer.from(signatureHash, 'utf8');

    if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      return { success: false, error: 'Signature mismatch' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Webhook] Signature verification error:', error);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('Running Stripe Signature Validation Logic Tests...');
  const secret = 'whsec_test_secret_12345';
  const payload = JSON.stringify({ id: 'evt_test', type: 'invoice.paid' });
  const timestamp = Math.floor(Date.now() / 1000);

  const validSignatureHash = await computeHmacSignature(`${timestamp}.${payload}`, secret);
  const validSignature = `t=${timestamp},v1=${validSignatureHash}`;

  const invalidSignature = `t=${timestamp},v1=invalidhash1234567890`;
  const invalidTimeSignature = `t=${timestamp - 1000},v1=${validSignatureHash}`; // Using old timestamp, but same hash. But wait, if time is different, hash would be different.
  const oldHash = await computeHmacSignature(`${timestamp - 1000}.${payload}`, secret);
  const tooOldSignature = `t=${timestamp - 1000},v1=${oldHash}`;

  let result;

  // Test 1: Valid signature
  result = await verifyStripeSignature(payload, validSignature, secret);
  if (!result.success) throw new Error('Test 1 Failed: Valid signature rejected');
  console.log('Test 1 (Valid Signature) - PASS');

  // Test 2: Invalid signature (wrong hash)
  result = await verifyStripeSignature(payload, invalidSignature, secret);
  if (result.success) throw new Error('Test 2 Failed: Invalid signature accepted');
  console.log('Test 2 (Invalid Signature) - PASS');

  // Test 3: Timestamp too old
  result = await verifyStripeSignature(payload, tooOldSignature, secret);
  if (result.success) throw new Error('Test 3 Failed: Old timestamp accepted');
  console.log('Test 3 (Old Timestamp) - PASS');

  console.log('All tests passed.');
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
