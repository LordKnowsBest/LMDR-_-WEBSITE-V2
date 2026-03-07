const crypto = require('crypto');

function computeHmacSignature(message, secret) {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

function verifyStripeSignature(payload, signatureHeader, webhookSecret) {
  if (!signatureHeader) {
    return { success: false, error: 'No signature provided' };
  }

  const elements = signatureHeader.split(',');
  const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
  const signatureHash = elements.find(e => e.startsWith('v1='))?.split('=')[1];

  if (!timestamp || !signatureHash) {
    return { success: false, error: 'Invalid signature format' };
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = computeHmacSignature(signedPayload, webhookSecret);

  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const signatureBuffer = Buffer.from(signatureHash, 'utf8');

  if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return { success: false, error: 'Signature mismatch' };
  }

  return { success: true };
}

const secret = 'whsec_test_secret';
const payload = '{"type":"checkout.session.completed"}';
const timestamp = Math.floor(Date.now() / 1000).toString();
const validSig = computeHmacSignature(`${timestamp}.${payload}`, secret);
const header = `t=${timestamp},v1=${validSig}`;

console.log('Test valid:', verifyStripeSignature(payload, header, secret));
console.log('Test invalid sig:', verifyStripeSignature(payload, `t=${timestamp},v1=invalid`, secret));
