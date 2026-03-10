const crypto = require('crypto');

// Mock getSecret
const secrets = {
  'STRIPE_WEBHOOK_SECRET': 'whsec_test_secret'
};
async function getSecret(key) {
  return secrets[key];
}

// The function to test (copied from src/backend/http-functions.js and adapted for Node environment)
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
    const elements = signature.split(',');
    const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
    const signatureHash = elements.find(e => e.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !signatureHash) {
      return { success: false, error: 'Invalid signature format' };
    }

    // Check timestamp tolerance (5 minutes)
    const tolerance = 5 * 60;
    const now = Math.floor(Date.now() / 1000);
    // In test, we might need to mock Date.now or ensure timestamp is recent
    if (Math.abs(now - parseInt(timestamp)) > tolerance) {
      return { success: false, error: 'Timestamp outside tolerance' };
    }

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;

    // Create HMAC using Node.js crypto
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(signedPayload);
    const expectedSignature = hmac.digest('hex');

    // Compare signatures using timing-safe comparison
    const signatureBuffer = Buffer.from(signatureHash, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return { success: false, error: 'Signature mismatch' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Webhook] Signature verification error:', error);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  const secret = 'whsec_test_secret';
  const payload = JSON.stringify({ id: 'evt_123', type: 'charge.succeeded' });
  const timestamp = Math.floor(Date.now() / 1000);

  // 1. Valid signature
  const signedPayload = `${timestamp}.${payload}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(signedPayload);
  const validSignature = hmac.digest('hex');
  const validHeader = `t=${timestamp},v1=${validSignature}`;

  console.log('Test 1: Valid signature');
  const result1 = await verifyStripeSignature(payload, validHeader);
  if (result1.success) console.log('PASS'); else console.log('FAIL', result1);

  // 2. Invalid signature (tampered payload)
  console.log('Test 2: Tampered payload');
  const result2 = await verifyStripeSignature(payload + 'x', validHeader);
  if (!result2.success && result2.error === 'Signature mismatch') console.log('PASS'); else console.log('FAIL', result2);

  // 3. Invalid signature (wrong key)
  console.log('Test 3: Wrong secret');
  // We can't easily change the secret inside the function, but we can sign with a wrong key
  const wrongHmac = crypto.createHmac('sha256', 'wrong_secret');
  wrongHmac.update(signedPayload);
  const wrongSignature = wrongHmac.digest('hex');
  const wrongHeader = `t=${timestamp},v1=${wrongSignature}`;

  const result3 = await verifyStripeSignature(payload, wrongHeader);
  if (!result3.success && result3.error === 'Signature mismatch') console.log('PASS'); else console.log('FAIL', result3);

  // 4. Old timestamp
  console.log('Test 4: Old timestamp');
  const oldTimestamp = timestamp - 600; // 10 minutes ago
  const oldHeader = `t=${oldTimestamp},v1=${validSignature}`; // signature doesn't match timestamp anyway but check logic order
  // Actually, verifyStripeSignature checks timestamp first.
  const result4 = await verifyStripeSignature(payload, oldHeader);
  if (!result4.success && result4.error === 'Timestamp outside tolerance') console.log('PASS'); else console.log('FAIL', result4);

  // 5. Malformed header
  console.log('Test 5: Malformed header');
  const result5 = await verifyStripeSignature(payload, 'invalid');
  if (!result5.success && result5.error === 'Invalid signature format') console.log('PASS'); else console.log('FAIL', result5);
}

runTests();
