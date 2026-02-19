const crypto = require('crypto');

function verifyStripeSignature(payload, signature, webhookSecret) {
  try {
    if (!signature) {
      return { success: false, error: 'No signature provided' };
    }

    if (!webhookSecret) {
      console.error('[Webhook] Missing STRIPE_WEBHOOK_SECRET');
      return { success: false, error: 'Server configuration error' };
    }

    const elements = signature.split(',');
    const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
    const signatureHash = elements.find(e => e.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !signatureHash) {
      return { success: false, error: 'Invalid signature format' };
    }

    const now = Math.floor(Date.now() / 1000);
    // Allow 5 minutes tolerance
    if (Math.abs(now - parseInt(timestamp)) > 300) {
      return { success: false, error: 'Timestamp outside tolerance' };
    }

    const signedPayload = `${timestamp}.${payload}`;
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(signedPayload);
    const expectedSignature = hmac.digest('hex');

    const signatureBuffer = Buffer.from(signatureHash, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
      return { success: false, error: 'Signature mismatch' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Webhook] Signature verification error:', error);
    return { success: false, error: 'Verification failed' };
  }
}

// Test Cases
const secret = 'whsec_test_secret';
const payload = JSON.stringify({ id: 'evt_test', type: 'test' });
const now = Math.floor(Date.now() / 1000);

// 1. Valid Signature
const hmac = crypto.createHmac('sha256', secret);
hmac.update(`${now}.${payload}`);
const validSig = hmac.digest('hex');
const validHeader = `t=${now},v1=${validSig}`;

console.log('Test 1 (Valid):', verifyStripeSignature(payload, validHeader, secret));

// 2. Invalid Secret (Simulating wrong key on server vs signature)
console.log('Test 2 (Wrong Secret):', verifyStripeSignature(payload, validHeader, 'whsec_wrong'));

// 3. Old Timestamp
const oldTime = now - 600;
const hmacOld = crypto.createHmac('sha256', secret);
hmacOld.update(`${oldTime}.${payload}`);
const oldSig = hmacOld.digest('hex');
const oldHeader = `t=${oldTime},v1=${oldSig}`;
console.log('Test 3 (Old Timestamp):', verifyStripeSignature(payload, oldHeader, secret));

// 4. Tampered Payload
console.log('Test 4 (Tampered Payload):', verifyStripeSignature(payload + 'x', validHeader, secret));

// 5. Missing Secret Config (Simulating getSecret returning null)
console.log('Test 5 (Missing Config):', verifyStripeSignature(payload, validHeader, null));
