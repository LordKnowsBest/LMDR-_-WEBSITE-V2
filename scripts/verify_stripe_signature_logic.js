const crypto = require('crypto');

async function testSignatureVerification() {
  const secret = 'whsec_testsecret123';
  const payload = JSON.stringify({
    id: 'evt_test',
    type: 'customer.subscription.created',
    data: {
      object: {
        id: 'sub_test',
        metadata: { carrier_dot: '123456' }
      }
    }
  });

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedPayload = `${timestamp}.${payload}`;

  // Create expected signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(signedPayload);
  const expectedSignatureHex = hmac.digest('hex');

  const signatureHeader = `t=${timestamp},v1=${expectedSignatureHex}`;

  // Try valid signature
  console.log('Testing valid signature...');
  const verifyValid = await verifyMock(payload, signatureHeader, secret);
  if (!verifyValid.success) {
    console.error('FAIL: Valid signature was rejected.', verifyValid.error);
    process.exit(1);
  }
  console.log('PASS: Valid signature accepted.');

  // Try invalid signature (wrong secret)
  console.log('Testing invalid signature...');
  const hmacInvalid = crypto.createHmac('sha256', 'wrongsecret');
  hmacInvalid.update(signedPayload);
  const invalidSignatureHex = hmacInvalid.digest('hex');
  const invalidSignatureHeader = `t=${timestamp},v1=${invalidSignatureHex}`;

  const verifyInvalid = await verifyMock(payload, invalidSignatureHeader, secret);
  if (verifyInvalid.success) {
    console.error('FAIL: Invalid signature was accepted!');
    process.exit(1);
  }
  console.log('PASS: Invalid signature rejected.', verifyInvalid.error);

  // Try malformed signature header
  console.log('Testing malformed header...');
  const verifyMalformed = await verifyMock(payload, 't=123', secret);
  if (verifyMalformed.success) {
    console.error('FAIL: Malformed header accepted.');
    process.exit(1);
  }
  console.log('PASS: Malformed header rejected.', verifyMalformed.error);

  // Try expired timestamp
  console.log('Testing expired timestamp...');
  const oldTimestamp = (Math.floor(Date.now() / 1000) - 1000).toString();
  const oldSignedPayload = `${oldTimestamp}.${payload}`;
  const hmacOld = crypto.createHmac('sha256', secret);
  hmacOld.update(oldSignedPayload);
  const oldSignatureHex = hmacOld.digest('hex');
  const oldSignatureHeader = `t=${oldTimestamp},v1=${oldSignatureHex}`;

  const verifyOld = await verifyMock(payload, oldSignatureHeader, secret);
  if (verifyOld.success) {
    console.error('FAIL: Expired timestamp accepted.');
    process.exit(1);
  }
  console.log('PASS: Expired timestamp rejected.', verifyOld.error);

  console.log('\nAll signature logic tests passed successfully!');
}

async function verifyMock(payload, signature, webhookSecret) {
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

    const tolerance = 5 * 60;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > tolerance) {
      return { success: false, error: 'Timestamp outside tolerance' };
    }

    const signedPayload = `${timestamp}.${payload}`;

    // Compute HMAC
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(signedPayload);
    const expectedSignature = hmac.digest('hex');

    // Compare signatures (timing-safe comparison)
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const signatureBuffer = Buffer.from(signatureHash, 'hex');

    if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      return { success: false, error: 'Signature mismatch' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

testSignatureVerification().catch(console.error);
