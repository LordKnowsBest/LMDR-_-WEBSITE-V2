// scripts/verify_api_security.js

// ---------------------------------------------------------
// MOCKED LOGIC FROM src/backend/apiAuthService.jsw
// ---------------------------------------------------------

/**
 * Vulnerable IP Whitelist Logic
 * Finding: Fails OPEN if ipAddress is null/undefined or if whitelist is empty.
 */
function isIpAllowed(partner, ipAddress) {
  // VULNERABILITY: Returns true if ipAddress is missing
  if (!ipAddress) return true;

  const whitelist = Array.isArray(partner.ip_whitelist) ? partner.ip_whitelist : [];

  // VULNERABILITY: Returns true (allowed) if whitelist is empty
  // Ideally, if whitelist is enabled/present, it should default to deny unless matched?
  // Or if intended as "no whitelist = public", then it's fine.
  // But usually for secure APIs, empty whitelist means nobody allowed or whitelist disabled.
  if (!whitelist.length) return true;

  return whitelist.includes(ipAddress);
}


// ---------------------------------------------------------
// MOCKED LOGIC FROM src/backend/apiGateway.jsw
// ---------------------------------------------------------

/**
 * Vulnerable Rate Limit Bypass Logic
 * Finding: Explicit header bypass without auth check on the header itself.
 */
function shouldBypassRateLimit(request) {
  const headerValue = String(getHeader(request, 'x-lmdr-bypass-rate-limit') || '').toLowerCase();
  return headerValue === 'true';
}

function getHeader(request, name) {
  const headers = request?.headers || {};
  const lower = String(name || '').toLowerCase();
  // Mocking standard header access
  return headers[name] || headers[lower] || null;
}


// ---------------------------------------------------------
// VERIFICATION TESTS
// ---------------------------------------------------------

console.log('--- STARTING API SECURITY VERIFICATION ---\n');

// TEST 1: IP Whitelist Bypass
console.log('[TEST 1] IP Whitelist Logic Check (src/backend/apiAuthService.jsw)');

const partnerWithWhitelist = {
  ip_whitelist: ['1.2.3.4', '5.6.7.8']
};

const partnerNoWhitelist = {
  ip_whitelist: []
};

// Case A: Valid IP
const resultA = isIpAllowed(partnerWithWhitelist, '1.2.3.4');
console.log(`  Case A (Valid IP): ${resultA ? 'ALLOWED' : 'DENIED'} (Expected: ALLOWED)`);

// Case B: Invalid IP
const resultB = isIpAllowed(partnerWithWhitelist, '9.9.9.9');
console.log(`  Case B (Invalid IP): ${resultB ? 'ALLOWED' : 'DENIED'} (Expected: DENIED)`);

// Case C: Missing IP (Null) - The Vulnerability
const resultC = isIpAllowed(partnerWithWhitelist, null);
console.log(`  Case C (Missing IP): ${resultC ? 'ALLOWED (FAIL - BYPASS)' : 'DENIED (PASS)'}`);
if (resultC) console.error('    !! CRITICAL: IP Check fails open when IP is missing !!');

// Case D: Empty Whitelist
const resultD = isIpAllowed(partnerNoWhitelist, '9.9.9.9');
console.log(`  Case D (Empty Whitelist): ${resultD ? 'ALLOWED (WARN - OPEN)' : 'DENIED (PASS)'}`);


console.log('\n[TEST 2] Rate Limit Bypass Header Check (src/backend/apiGateway.jsw)');

const requestNormal = {
  headers: {
    'user-agent': 'test-bot'
  }
};

const requestBypass = {
  headers: {
    'x-lmdr-bypass-rate-limit': 'true',
    'user-agent': 'test-bot'
  }
};

// Case A: Normal Request
const bypassA = shouldBypassRateLimit(requestNormal);
console.log(`  Case A (Normal Request): Bypass is ${bypassA ? 'ACTIVE' : 'INACTIVE'} (Expected: INACTIVE)`);

// Case B: Bypass Header Present
const bypassB = shouldBypassRateLimit(requestBypass);
console.log(`  Case B (Bypass Header): Bypass is ${bypassB ? 'ACTIVE (FAIL - UNPROTECTED)' : 'INACTIVE (PASS)'}`);
if (bypassB) console.error('    !! CRITICAL: Rate limit bypass header is active and unprotected !!');


console.log('\n--- VERIFICATION COMPLETE ---');
