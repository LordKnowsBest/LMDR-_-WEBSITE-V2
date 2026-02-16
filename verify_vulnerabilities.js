
// ============================================================================
// VERIFICATION SCRIPT: API GATEWAY VULNERABILITIES
// Run with: node verify_vulnerabilities.js
// ============================================================================

console.log('--- STARTING VULNERABILITY VERIFICATION ---');

// 1. IP Whitelist Logic (Copied from src/backend/apiAuthService.jsw)
function isIpAllowed(partner, ipAddress) {
  if (!ipAddress) return true; // Fail open if IP is missing!
  const whitelist = Array.isArray(partner.ip_whitelist) ? partner.ip_whitelist : [];
  if (!whitelist.length) return true; // Fail open if whitelist is empty!
  return whitelist.includes(ipAddress);
}

// Test Case 1: Partner with empty whitelist (should fail open)
const partnerEmpty = { ip_whitelist: [] };
const ip1 = '1.2.3.4';
const result1 = isIpAllowed(partnerEmpty, ip1);
console.log(`[TEST 1] Empty Whitelist Check: ${result1 ? 'FAIL OPEN (Allowed)' : 'BLOCKED'}`);

// Test Case 2: Partner with specific whitelist, but no IP provided (should fail open)
const partnerSpecific = { ip_whitelist: ['5.6.7.8'] };
const ipNull = null;
const result2 = isIpAllowed(partnerSpecific, ipNull);
console.log(`[TEST 2] Missing IP Check: ${result2 ? 'FAIL OPEN (Allowed)' : 'BLOCKED'}`);

// Test Case 3: Partner with specific whitelist, wrong IP provided (should block)
const result3 = isIpAllowed(partnerSpecific, '1.2.3.4');
console.log(`[TEST 3] Wrong IP Check: ${result3 ? 'FAIL OPEN (Allowed)' : 'BLOCKED (Correctly)'}`);

// Test Case 4: Partner with specific whitelist, correct IP provided (should allow)
const result4 = isIpAllowed(partnerSpecific, '5.6.7.8');
console.log(`[TEST 4] Correct IP Check: ${result4 ? 'ALLOWED (Correctly)' : 'BLOCKED'}`);


// 2. Rate Limit Bypass Logic (Copied from src/backend/apiGateway.jsw)
function shouldBypassRateLimit(headers) {
  const headerValue = String(headers['x-lmdr-bypass-rate-limit'] || '').toLowerCase();
  return headerValue === 'true';
}

const headers = { 'x-lmdr-bypass-rate-limit': 'true' };
const bypass = shouldBypassRateLimit(headers);
console.log(`[TEST 5] Rate Limit Bypass Header: ${bypass ? 'FAIL (Bypassed)' : 'SECURE'}`);

console.log('--- VERIFICATION COMPLETE ---');
