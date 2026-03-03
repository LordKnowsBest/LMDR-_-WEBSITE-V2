const crypto = require('crypto');

async function computeHmacSignature(message, secret) {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);

    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  } catch (error) {
    console.error('HMAC computation error:', error);
    throw error;
  }
}

async function verifyStripeSignature(payload, expectedSignature, signatureHash) {
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const signatureBuffer = Buffer.from(signatureHash, 'hex');

    if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      return { success: false, error: 'Signature mismatch' };
    }
    return { success: true };
}

async function testSignatureVerification() {
  const secret = 'whsec_test_secret';
  const payload = '{"id":"evt_test"}';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedPayload = `${timestamp}.${payload}`;

  console.log('Generating valid signature...');
  const validSignatureHash = await computeHmacSignature(signedPayload, secret);
  console.log(`Generated: ${validSignatureHash}`);

  console.log('\nTesting valid signature match:');
  const resultMatch = await verifyStripeSignature(payload, validSignatureHash, validSignatureHash);
  console.log('Result:', resultMatch.success ? 'PASS' : 'FAIL');

  console.log('\nTesting mismatched signature (invalid logic):');
  const invalidSignatureHash = validSignatureHash.replace(/./, validSignatureHash[0] === 'a' ? 'b' : 'a'); // simple tamper
  const resultMismatch = await verifyStripeSignature(payload, validSignatureHash, invalidSignatureHash);
  console.log('Result:', !resultMismatch.success && resultMismatch.error === 'Signature mismatch' ? 'PASS' : 'FAIL');

  console.log('\nTesting differing length mismatch:');
  const differentLengthSignatureHash = validSignatureHash + 'ab';
  const resultLengthMismatch = await verifyStripeSignature(payload, validSignatureHash, differentLengthSignatureHash);
  console.log('Result:', !resultLengthMismatch.success && resultLengthMismatch.error === 'Signature mismatch' ? 'PASS' : 'FAIL');
}

testSignatureVerification().catch(console.error);
