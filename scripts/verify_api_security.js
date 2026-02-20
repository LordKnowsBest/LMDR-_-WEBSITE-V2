// scripts/verify_api_security.js
// This script reproduces the logic found in src/backend/apiAuthService.jsw and src/backend/apiGateway.jsw
// to confirm security vulnerabilities.

const assert = require('assert');

// --- Vulnerability 1: IP Whitelist Fail-Open ---
console.log('--- verifying IP Whitelist Logic ---');

function isIpAllowed(partner, ipAddress) {
  if (!ipAddress) return true; // CRITICAL: Allows if IP is unknown
  const whitelist = Array.isArray(partner.ip_whitelist) ? partner.ip_whitelist : [];
  if (!whitelist.length) return true; // Allows if whitelist is empty (optional feature)
  return whitelist.includes(ipAddress);
}

const partnerWithWhitelist = {
  partner_id: 'p1',
  ip_whitelist: ['1.2.3.4']
};

const partnerNoWhitelist = {
  partner_id: 'p2',
  ip_whitelist: []
};

try {
  // Test Case 1: IP in whitelist -> Allowed
  assert.strictEqual(isIpAllowed(partnerWithWhitelist, '1.2.3.4'), true, 'Should allow whitelisted IP');
  console.log('PASS: Whitelisted IP is allowed');

  // Test Case 2: IP not in whitelist -> Denied
  assert.strictEqual(isIpAllowed(partnerWithWhitelist, '5.6.7.8'), false, 'Should deny non-whitelisted IP');
  console.log('PASS: Non-whitelisted IP is denied');

  // Test Case 3: IP is null (e.g. spoofed/missing header) -> Allowed (FAIL OPEN)
  const resultNullIP = isIpAllowed(partnerWithWhitelist, null);
  if (resultNullIP === true) {
    console.log('FAIL: IP Whitelist fails open when IP is null/undefined! (VULNERABILITY CONFIRMED)');
  } else {
    console.log('PASS: IP Whitelist blocks null IP');
  }

  // Test Case 4: Whitelist is empty -> Allowed (Default Allow)
  assert.strictEqual(isIpAllowed(partnerNoWhitelist, '1.1.1.1'), true);
  console.log('INFO: Empty whitelist allows all IPs (Expected behavior for optional feature)');

} catch (e) {
  console.error('Error during IP verification:', e.message);
}

// --- Vulnerability 2: Rate Limit Bypass Header ---
console.log('\n--- verifying Rate Limit Bypass Logic ---');

function getHeader(request, name) {
  const headers = request?.headers || {};
  const lower = String(name || '').toLowerCase();
  return headers[name] || headers[lower] || null;
}

function shouldBypassRateLimit(request) {
  const headerValue = String(getHeader(request, 'x-lmdr-bypass-rate-limit') || '').toLowerCase();
  return headerValue === 'true';
}

async function checkAndTrackUsage({ bypassRateLimit }) {
  if (bypassRateLimit) {
    return { allowed: true, logic: 'bypassed' };
  }
  return { allowed: false, logic: 'enforced' };
}

(async () => {
  try {
    const requestWithBypass = {
      headers: {
        'x-lmdr-bypass-rate-limit': 'true'
      }
    };

    const bypassFlag = shouldBypassRateLimit(requestWithBypass);
    if (bypassFlag === true) {
      console.log('FAIL: Rate limit bypass flag is TRUE purely based on header presence! (VULNERABILITY CONFIRMED)');
    }

    const usageResult = await checkAndTrackUsage({ bypassRateLimit: bypassFlag });
    if (usageResult.allowed && usageResult.logic === 'bypassed') {
      console.log('FAIL: Rate limiting logic explicitly bypassed! (VULNERABILITY CONFIRMED)');
    }

  } catch (e) {
    console.error('Error during Rate Limit verification:', e.message);
  }
})();

// --- Vulnerability 3: Information Leakage ---
console.log('\n--- verifying Auth Error Information Leakage ---');

async function validateApiKey(key, ip) {
  // Simulate finding key
  const validKey = 'valid-key';
  const partner = { ip_whitelist: ['1.2.3.4'] };

  if (key !== validKey) {
    return { success: false, message: 'Invalid API key' };
  }

  if (!isIpAllowed(partner, ip)) {
    return { success: false, message: 'IP address not allowed' };
  }

  return { success: true };
}

(async () => {
  const resInvalidKey = await validateApiKey('wrong-key', '1.2.3.4');
  const resValidKeyWrongIP = await validateApiKey('valid-key', '5.6.7.8');

  console.log(`Response for invalid key: "${resInvalidKey.message}"`);
  console.log(`Response for valid key (wrong IP): "${resValidKeyWrongIP.message}"`);

  if (resInvalidKey.message !== resValidKeyWrongIP.message) {
    console.log('WARN: Error messages differ, leaking existence of valid key! (VULNERABILITY CONFIRMED)');
  }
})();
