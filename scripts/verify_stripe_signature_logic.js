const crypto = require('crypto');

// Replicate the target function logic here for standalone verification
async function computeHmacSignature(message, secret) {
  try {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(message);
    return hmac.digest('hex');
  } catch (error) {
    console.error('HMAC computation error:', error);
    throw error;
  }
}

async function verifyStripeSignature(payload, signature, secret) {
  try {
    if (!signature) {
      return { success: false, error: 'No signature provided' };
    }

    if (!secret) {
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
    const expectedSignature = await computeHmacSignature(signedPayload, secret);

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const signatureBuffer = Buffer.from(signatureHash, 'hex');

    if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      return { success: false, error: 'Signature mismatch' };
    }

    return { success: true };
  } catch (error) {
    console.error('Signature verification error:', error);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('--- Testing Stripe Signature Logic ---');
  let allPassed = true;

  const secret = 'whsec_testsecret123';
  const payload = JSON.stringify({ id: 'evt_test', type: 'customer.subscription.created' });
  const timestamp = Math.floor(Date.now() / 1000);

  // Create a valid signature
  const signedPayload = `${timestamp}.${payload}`;
  const validSignatureHash = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  const validSignatureHeader = `t=${timestamp},v1=${validSignatureHash}`;

  // Test 1: Valid signature
  const result1 = await verifyStripeSignature(payload, validSignatureHeader, secret);
  if (result1.success) {
    console.log('✅ Test 1 Passed: Valid signature');
  } else {
    console.error('❌ Test 1 Failed: Valid signature rejected', result1.error);
    allPassed = false;
  }

  // Test 2: Invalid signature (mismatched hash)
  const invalidSignatureHeader = `t=${timestamp},v1=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890`;
  const result2 = await verifyStripeSignature(payload, invalidSignatureHeader, secret);
  if (!result2.success && result2.error === 'Signature mismatch') {
    console.log('✅ Test 2 Passed: Invalid signature rejected correctly');
  } else {
    console.error('❌ Test 2 Failed: Invalid signature handling incorrect', result2);
    allPassed = false;
  }

  // Test 3: Timestamp too old
  const oldTimestamp = timestamp - (6 * 60); // 6 minutes ago
  const oldSignedPayload = `${oldTimestamp}.${payload}`;
  const oldSignatureHash = crypto.createHmac('sha256', secret).update(oldSignedPayload).digest('hex');
  const oldSignatureHeader = `t=${oldTimestamp},v1=${oldSignatureHash}`;
  const result3 = await verifyStripeSignature(payload, oldSignatureHeader, secret);
  if (!result3.success && result3.error === 'Timestamp outside tolerance') {
    console.log('✅ Test 3 Passed: Old timestamp rejected correctly');
  } else {
    console.error('❌ Test 3 Failed: Old timestamp handling incorrect', result3);
    allPassed = false;
  }

  // Test 4: Timing-safe buffer mismatch length
  const mismatchLengthHeader = `t=${timestamp},v1=abc`;
  const result4 = await verifyStripeSignature(payload, mismatchLengthHeader, secret);
  if (!result4.success && result4.error === 'Signature mismatch') {
      console.log('✅ Test 4 Passed: Mismatched buffer length rejected correctly');
  } else {
      console.error('❌ Test 4 Failed: Mismatched buffer length handling incorrect', result4);
      allPassed = false;
  }

  if (allPassed) {
    console.log('\\n🎉 All tests passed successfully!');
    process.exit(0);
  } else {
    console.error('\\n💥 Some tests failed.');
    process.exit(1);
  }
}

runTests();
