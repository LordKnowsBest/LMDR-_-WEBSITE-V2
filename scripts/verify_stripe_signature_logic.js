import crypto from 'crypto';

// Re-implement the verify logic from http-functions.js to test locally
async function verifyStripeSignature(payload, signature, webhookSecret) {
  try {
    if (!signature) {
      return { success: false, error: 'No signature provided' };
    }

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

async function computeHmacSignature(message, secret) {
  try {
    return crypto.createHmac('sha256', secret).update(message).digest('hex');
  } catch (error) {
    console.error('[Webhook] HMAC computation error:', error);
    throw error;
  }
}

// Test harness
async function runTests() {
  console.log('--- Running Stripe Signature Verification Tests ---');

  const secret = 'whsec_test_secret_12345';
  const payload = JSON.stringify({ id: 'evt_test_123', type: 'customer.subscription.created' });
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedPayload = `${timestamp}.${payload}`;

  // Generate a valid signature
  const validSignatureHash = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  const validSignatureHeader = `t=${timestamp},v1=${validSignatureHash}`;

  // Generate an invalid signature (wrong hash)
  const invalidSignatureHash = crypto.createHmac('sha256', secret).update('wrong payload').digest('hex');
  const invalidSignatureHeaderHash = `t=${timestamp},v1=${invalidSignatureHash}`;

  // Generate an invalid signature (wrong timestamp - 10 minutes ago)
  const oldTimestamp = Math.floor(Date.now() / 1000) - 600;
  const oldSignedPayload = `${oldTimestamp}.${payload}`;
  const oldSignatureHash = crypto.createHmac('sha256', secret).update(oldSignedPayload).digest('hex');
  const oldSignatureHeader = `t=${oldTimestamp},v1=${oldSignatureHash}`;

  // Generate an invalid signature (wrong length)
  const wrongLengthSignatureHash = validSignatureHash.substring(0, validSignatureHash.length - 1);
  const wrongLengthSignatureHeader = `t=${timestamp},v1=${wrongLengthSignatureHash}`;


  console.log('\nTest 1: Valid Signature');
  let result = await verifyStripeSignature(payload, validSignatureHeader, secret);
  console.log('Expected: success=true');
  console.log(`Actual: success=${result.success}`);
  if (!result.success) console.error(result.error);

  console.log('\nTest 2: Invalid Signature (Wrong Hash)');
  result = await verifyStripeSignature(payload, invalidSignatureHeaderHash, secret);
  console.log('Expected: success=false, error=Signature mismatch');
  console.log(`Actual: success=${result.success}, error=${result.error}`);

  console.log('\nTest 3: Invalid Signature (Wrong Timestamp - Out of Tolerance)');
  result = await verifyStripeSignature(payload, oldSignatureHeader, secret);
  console.log('Expected: success=false, error=Timestamp outside tolerance');
  console.log(`Actual: success=${result.success}, error=${result.error}`);

  console.log('\nTest 4: Invalid Signature (Wrong Length Buffer)');
  result = await verifyStripeSignature(payload, wrongLengthSignatureHeader, secret);
  console.log('Expected: success=false, error=Signature mismatch');
  console.log(`Actual: success=${result.success}, error=${result.error}`);

  console.log('\n--- Tests Complete ---');
}

runTests();
