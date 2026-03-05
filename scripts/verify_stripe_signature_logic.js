const crypto = require('crypto');

async function verifyStripeSignature(payload, signature, webhookSecret) {
  try {
    if (!signature) return { success: false, error: 'No signature provided' };

    const elements = signature.split(',');
    const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
    const signatureHash = elements.find(e => e.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !signatureHash) return { success: false, error: 'Invalid signature format' };

    const tolerance = 5 * 60;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > tolerance) return { success: false, error: 'Timestamp outside tolerance' };

    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = computeHmacSignature(signedPayload, webhookSecret);

    const expectedBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(signatureHash);

    if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      return { success: false, error: 'Signature mismatch' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function computeHmacSignature(message, secret) {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

async function runTests() {
  console.log('--- Running Stripe Signature Verification Tests ---');
  let passCount = 0;
  let failCount = 0;

  const payload = '{"id":"evt_123","type":"customer.subscription.created"}';
  const secret = 'whsec_test_secret';
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const validHash = computeHmacSignature(signedPayload, secret);
  const validSignature = `t=${timestamp},v1=${validHash}`;

  const invalidHash = validHash.replace(/./, 'a');
  const invalidSignature = `t=${timestamp},v1=${invalidHash}`;

  const oldTimestamp = timestamp - 1000;
  const oldSignedPayload = `${oldTimestamp}.${payload}`;
  const oldHash = computeHmacSignature(oldSignedPayload, secret);
  const oldSignature = `t=${oldTimestamp},v1=${oldHash}`;

  // Test 1: Valid signature
  const res1 = await verifyStripeSignature(payload, validSignature, secret);
  if (res1.success) {
    console.log('✅ Test 1: Valid signature passed.');
    passCount++;
  } else {
    console.error(`❌ Test 1: Valid signature failed: ${res1.error}`);
    failCount++;
  }

  // Test 2: Invalid signature (wrong hash)
  const res2 = await verifyStripeSignature(payload, invalidSignature, secret);
  if (!res2.success && res2.error === 'Signature mismatch') {
    console.log('✅ Test 2: Invalid signature rejected correctly.');
    passCount++;
  } else {
    console.error(`❌ Test 2: Invalid signature failed: expected 'Signature mismatch', got success: ${res2.success}, error: ${res2.error}`);
    failCount++;
  }

  // Test 3: Old timestamp
  const res3 = await verifyStripeSignature(payload, oldSignature, secret);
  if (!res3.success && res3.error === 'Timestamp outside tolerance') {
    console.log('✅ Test 3: Expired signature rejected correctly.');
    passCount++;
  } else {
    console.error(`❌ Test 3: Expired signature failed: expected 'Timestamp outside tolerance', got success: ${res3.success}, error: ${res3.error}`);
    failCount++;
  }

  // Test 4: Malformed signature
  const res4 = await verifyStripeSignature(payload, 'v1=abc', secret);
  if (!res4.success && res4.error === 'Invalid signature format') {
    console.log('✅ Test 4: Malformed signature rejected correctly.');
    passCount++;
  } else {
    console.error(`❌ Test 4: Malformed signature failed: expected 'Invalid signature format', got success: ${res4.success}, error: ${res4.error}`);
    failCount++;
  }

  console.log('---------------------------------------------------');
  console.log(`Results: ${passCount} passed, ${failCount} failed.`);
  if (failCount > 0) process.exit(1);
}

runTests();