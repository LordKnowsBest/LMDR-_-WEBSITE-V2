
// Verification Script for API Gateway Vulnerabilities
// This script simulates the logic found in src/backend/apiGateway.jsw and src/backend/apiAuthService.jsw
// to verify critical security flaws.

console.log('Starting Security Verification...');

// ==========================================
// 1. Rate Limit Bypass Verification
// ==========================================
console.log('\n[TEST 1] Rate Limit Bypass Verification');

function getHeader(request, name) {
  const headers = request?.headers || {};
  const lower = String(name || '').toLowerCase();
  if (typeof headers.get === 'function') {
    return headers.get(name) || headers.get(lower) || null;
  }
  return headers[name] || headers[lower] || null;
}

function shouldBypassRateLimit(request) {
  const headerValue = String(getHeader(request, 'x-lmdr-bypass-rate-limit') || '').toLowerCase();
  return headerValue === 'true';
}

const exploitRequest = {
  headers: {
    'x-lmdr-bypass-rate-limit': 'true'
  }
};

const isBypassed = shouldBypassRateLimit(exploitRequest);
if (isBypassed) {
  console.log('FAIL: Rate limit bypass header is active and functional.');
} else {
  console.log('PASS: Rate limit bypass header is not functional.');
}


// ==========================================
// 2. IP Whitelist Bypass Verification
// ==========================================
console.log('\n[TEST 2] IP Whitelist Bypass Verification');

function isIpAllowed(partner, ipAddress) {
  if (!ipAddress) return true; // Vulnerable line
  const whitelist = Array.isArray(partner.ip_whitelist) ? partner.ip_whitelist : [];
  if (!whitelist.length) return true;
  return whitelist.includes(ipAddress);
}

const restrictedPartner = {
  ip_whitelist: ['1.2.3.4']
};

const nullIpAllowed = isIpAllowed(restrictedPartner, null);
const undefinedIpAllowed = isIpAllowed(restrictedPartner, undefined);

if (nullIpAllowed && undefinedIpAllowed) {
  console.log('FAIL: IP Whitelist checks fail open (allow access) when IP is null/undefined.');
} else {
  console.log('PASS: IP Whitelist checks fail closed (deny access) when IP is missing.');
}


// ==========================================
// 3. Unauthorized Key Rotation Verification
// ==========================================
console.log('\n[TEST 3] Unauthorized Key Rotation Logic Verification');

// Simulate the function signature from src/backend/apiAuthService.jsw
// export async function rotateApiKey(partnerId, keyId, options = {}) { ... }

// Since we cannot run backend code directly, we analyze the implementation pattern.
// The function takes partnerId as a plain argument.
// In a secure implementation, partnerId would be derived from the authenticated user context (wix-users-backend).
// Here, it relies on the caller providing it.

// Mock dataAccess.findByField to simulate finding a partner
const mockDataAccess = {
  findByField: async (collection, field, value, options) => {
    console.log(`[Mock DB] Finding partner by ${field}: ${value}`);
    return { _id: 'partner_123', api_keys: [] };
  },
  updateRecord: async (collection, data, options) => {
    console.log(`[Mock DB] Updating partner ${data._id} with new key...`);
    return { success: true };
  }
};

async function rotateApiKey(partnerId, keyId, options = {}) {
  // Vulnerability: No check for currently logged in user vs partnerId
  // const currentUser = wixUsersBackend.currentUser; // MISSING
  // if (currentUser.id !== partnerId) throw new Error('Unauthorized'); // MISSING

  const partner = await mockDataAccess.findByField('apiPartners', 'partner_id', partnerId, {
    suppressAuth: true
  });
  if (!partner) return { success: false, error: 'Partner not found' };

  // ... generates new key ...
  await mockDataAccess.updateRecord('apiPartners', { _id: partner._id, api_keys: [] }, { suppressAuth: true });
  return { success: true };
}

// Simulate an attack: Attacker calls rotateApiKey for a victim partner
(async () => {
  console.log('Attempting to rotate key for victim "partner_victim_001"...');
  try {
    const result = await rotateApiKey('partner_victim_001', 'key_old_123');
    if (result.success) {
      console.log('FAIL: function `rotateApiKey` executes successfully without checking caller identity.');
    }
  } catch (e) {
    console.log('PASS: function `rotateApiKey` threw an error (Access Denied).');
  }
})();
