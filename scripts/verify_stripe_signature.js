const crypto = require('crypto');

const secret = 'whsec_test_secret_12345';
const payload = JSON.stringify({
  id: 'evt_test_webhook',
  object: 'event',
});
const timestamp = Math.floor(Date.now() / 1000);
const signedPayload = `${timestamp}.${payload}`;

// Compute expected signature using Node.js crypto
const hmac = crypto.createHmac('sha256', secret);
hmac.update(signedPayload);
const expectedSignature = hmac.digest('hex');

console.log('--- Setup ---');
console.log('Secret:', secret);
console.log('Payload:', payload);
console.log('Timestamp:', timestamp);
console.log('Expected Signature (Hex):', expectedSignature);

// Test Cases
const validSignature = expectedSignature;
const invalidSignature = expectedSignature.replace('a', 'b'); // flip a char
const shortSignature = expectedSignature.substring(0, 10); // too short

console.log('\n--- Testing Verify Function ---');

function verifySignature(signatureHash) {
  try {
    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    const signatureBuf = Buffer.from(signatureHash, 'hex');

    if (expectedBuf.length !== signatureBuf.length) {
      console.log(`[FAIL] Length mismatch: Expected ${expectedBuf.length}, Got ${signatureBuf.length}`);
      return false;
    }

    const result = crypto.timingSafeEqual(expectedBuf, signatureBuf);
    if (result) {
      console.log('[PASS] Signature Verified');
    } else {
      console.log('[FAIL] Signature Invalid (timingSafeEqual returned false)');
    }
    return result;
  } catch (err) {
    console.log('[ERROR]', err.message);
    return false;
  }
}

console.log('Test 1: Valid Signature');
verifySignature(validSignature);

console.log('Test 2: Invalid Signature (char flip)');
verifySignature(invalidSignature);

console.log('Test 3: Invalid Signature (length mismatch)');
verifySignature(shortSignature);

// Vulnerable implementation for comparison (conceptual)
function verifyVulnerable(signatureHash) {
    if (expectedSignature === signatureHash) { // Standard string comparison
        console.log('[VULNERABLE] Verified (but unsafe)');
    } else {
        console.log('[VULNERABLE] Rejected');
    }
}

console.log('\n--- Vulnerable check ---');
verifyVulnerable(validSignature);
verifyVulnerable(invalidSignature);
