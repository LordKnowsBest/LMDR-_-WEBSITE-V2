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
 * Fixed Rate Limit Bypass Logic
 * The bypass now requires the header value to match a secret token.
 * In production, the secret is fetched via getSecret('RATE_LIMIT_BYPASS_SECRET').
 * For this test we simulate with a known mock secret.
 */
const MOCK_BYPASS_SECRET = 'test-secret-token-12345';
function shouldBypassRateLimit(request) {
  const headerValue = getHeader(request, 'x-lmdr-admin-bypass');
  if (!headerValue) return false;
  return headerValue === MOCK_BYPASS_SECRET;
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

const requestBypassOldHeader = {
  headers: {
    'x-lmdr-bypass-rate-limit': 'true',
    'user-agent': 'test-bot'
  }
};

const requestBypassWrongSecret = {
  headers: {
    'x-lmdr-admin-bypass': 'true',
    'user-agent': 'test-bot'
  }
};

const requestBypassCorrectSecret = {
  headers: {
    'x-lmdr-admin-bypass': MOCK_BYPASS_SECRET,
    'user-agent': 'test-bot'
  }
};

// Case A: Normal Request
const bypassA = shouldBypassRateLimit(requestNormal);
console.log(`  Case A (Normal Request): Bypass is ${bypassA ? 'ACTIVE' : 'INACTIVE'} (Expected: INACTIVE)`);

// Case B: Old header name (should no longer work)
const bypassB = shouldBypassRateLimit(requestBypassOldHeader);
console.log(`  Case B (Old Header 'x-lmdr-bypass-rate-limit: true'): Bypass is ${bypassB ? 'ACTIVE (FAIL - OLD HEADER STILL WORKS)' : 'INACTIVE (PASS - OLD HEADER REJECTED)'}`);
if (bypassB) console.error('    !! CRITICAL: Old bypass header still works !!');

// Case C: New header name but wrong value (should be rejected)
const bypassC = shouldBypassRateLimit(requestBypassWrongSecret);
console.log(`  Case C (New Header wrong secret): Bypass is ${bypassC ? 'ACTIVE (FAIL - WRONG SECRET ACCEPTED)' : 'INACTIVE (PASS - WRONG SECRET REJECTED)'}`);
if (bypassC) console.error('    !! CRITICAL: Bypass accepted without valid secret !!');

// Case D: New header name with correct secret (should work)
const bypassD = shouldBypassRateLimit(requestBypassCorrectSecret);
console.log(`  Case D (New Header correct secret): Bypass is ${bypassD ? 'ACTIVE (PASS - SECRET VERIFIED)' : 'INACTIVE (FAIL - VALID SECRET REJECTED)'}`);
if (!bypassD) console.error('    !! WARNING: Valid bypass secret was rejected !!');


console.log('\n--- VERIFICATION COMPLETE ---');
