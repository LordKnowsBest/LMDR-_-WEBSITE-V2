
// Verification script for API Security Audit
// Replicates logic from src/backend/apiGateway.jsw and src/backend/apiAuthService.jsw
// to verify potential vulnerabilities.

console.log("=== API Security Verification Script ===\n");

// ==========================================
// 1. IP Whitelist Bypass Verification
// Source: src/backend/apiAuthService.jsw
// ==========================================

function isIpAllowed(partner, ipAddress) {
  // COPIED LOGIC FROM src/backend/apiAuthService.jsw
  if (!ipAddress) return true; // <--- VULNERABILITY CANDIDATE
  const whitelist = Array.isArray(partner.ip_whitelist) ? partner.ip_whitelist : [];
  if (!whitelist.length) return true;
  return whitelist.includes(ipAddress);
}

console.log("Test 1: IP Whitelist Logic Check");
const restrictedPartner = {
  partner_id: "p1",
  ip_whitelist: ["192.168.1.1", "10.0.0.1"]
};

const ipTests = [
  { ip: "192.168.1.1", expected: true, desc: "Whitelisted IP" },
  { ip: "1.1.1.1", expected: false, desc: "Non-whitelisted IP" },
  { ip: null, expected: true, desc: "Missing IP (Bypass)" }, // Vulnerability check
  { ip: undefined, expected: true, desc: "Undefined IP (Bypass)" } // Vulnerability check
];

let ipFailures = 0;
ipTests.forEach(t => {
  const result = isIpAllowed(restrictedPartner, t.ip);
  const status = result === t.expected ? "PASS" : "FAIL";
  if (status === "FAIL") ipFailures++;
  console.log(`[${status}] ${t.desc}: Input=${t.ip}, Result=${result}, Expected=${t.expected}`);
});

if (isIpAllowed(restrictedPartner, null) === true) {
  console.log("\n>>> VULNERABILITY CONFIRMED: Missing IP bypasses whitelist check.\n");
} else {
  console.log("\n>>> Logic appears secure against missing IP (Unexpected based on static analysis).\n");
}

// ==========================================
// 2. Rate Limit Bypass Verification
// Source: src/backend/apiGateway.jsw
// ==========================================

function getHeader(request, name) {
  // COPIED LOGIC FROM src/backend/apiGateway.jsw
  const headers = request?.headers || {};
  const lower = String(name || '').toLowerCase();
  if (typeof headers.get === 'function') {
    return headers.get(name) || headers.get(lower) || null;
  }
  return headers[name] || headers[lower] || null;
}

function shouldBypassRateLimit(request) {
  // COPIED LOGIC FROM src/backend/apiGateway.jsw
  const headerValue = String(getHeader(request, 'x-lmdr-bypass-rate-limit') || '').toLowerCase();
  return headerValue === 'true';
}

console.log("Test 2: Rate Limit Bypass Header Check");

const rateTests = [
  {
    req: { headers: {} },
    expected: false,
    desc: "No header"
  },
  {
    req: { headers: { 'x-lmdr-bypass-rate-limit': 'false' } },
    expected: false,
    desc: "Header=false"
  },
  {
    req: { headers: { 'x-lmdr-bypass-rate-limit': 'true' } },
    expected: true,
    desc: "Header=true (Bypass)" // Vulnerability check
  },
  {
    req: { headers: { 'X-LMDR-BYPASS-RATE-LIMIT': 'TRUE' } },
    expected: true,
    desc: "Header=TRUE (Case Insensitive)"
  }
];

let rateFailures = 0;
rateTests.forEach(t => {
  const result = shouldBypassRateLimit(t.req);
  const status = result === t.expected ? "PASS" : "FAIL";
  if (status === "FAIL") rateFailures++;
  console.log(`[${status}] ${t.desc}: Result=${result}, Expected=${t.expected}`);
});

if (shouldBypassRateLimit({ headers: { 'x-lmdr-bypass-rate-limit': 'true' } }) === true) {
  console.log("\n>>> VULNERABILITY CONFIRMED: Rate limit bypass header is active.\n");
} else {
  console.log("\n>>> Rate limit bypass logic not found.\n");
}

console.log("=== Verification Complete ===");
