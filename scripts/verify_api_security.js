const fs = require('fs');
const path = require('path');

// Colors for console output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const report = {
  PASS: [],
  FAIL: [],
  WARN: []
};

function logResult(status, message, details = '') {
  if (status === 'PASS') {
    report.PASS.push({ message, details });
    console.log(`${GREEN}[PASS]${RESET} ${message}`);
  } else if (status === 'FAIL') {
    report.FAIL.push({ message, details });
    console.log(`${RED}[FAIL]${RESET} ${message}`);
    if (details) console.log(`       ${YELLOW}Details: ${details}${RESET}`);
  } else {
    report.WARN.push({ message, details });
    console.log(`${YELLOW}[WARN]${RESET} ${message}`);
    if (details) console.log(`       ${YELLOW}Details: ${details}${RESET}`);
  }
}

function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
  } catch (err) {
    logResult('FAIL', `Could not read file: ${filePath}`, err.message);
    return null;
  }
}

function runAudit() {
  console.log(`${BOLD}Starting API Security Audit...${RESET}\n`);

  // --- 1. Authentication Enforcement ---
  const gatewayContent = readFile('src/backend/apiGateway.jsw');
  if (gatewayContent) {
    if (gatewayContent.includes('authContext = await validateApiKey')) {
      logResult('PASS', 'Authentication call found in apiGateway.jsw');
    } else {
      logResult('FAIL', 'validateApiKey call NOT found in apiGateway.jsw');
    }
  }

  // --- 2. Secure Hashing ---
  const authServiceContent = readFile('src/backend/apiAuthService.jsw');
  if (authServiceContent) {
    if (authServiceContent.includes("crypto.subtle.digest('SHA-256'")) {
      logResult('PASS', 'SHA-256 hashing found in apiAuthService.jsw');
    } else {
      logResult('FAIL', 'SHA-256 hashing NOT found in apiAuthService.jsw');
    }

    // Check for plaintext key comparison (heuristic)
    if (authServiceContent.includes('key.key_hash === keyHash')) {
       logResult('PASS', 'Keys appear to be compared by hash, not plaintext');
    } else {
       logResult('WARN', 'Could not confirm key hash comparison pattern');
    }
  }

  // --- 3. IP Whitelisting Integrity ---
  if (authServiceContent) {
    // Look for the specific fail-open pattern: if (!ipAddress) return true;
    const ipCheckRegex = /if\s*\(\s*!ipAddress\s*\)\s*return\s*true/;
    if (ipCheckRegex.test(authServiceContent)) {
      logResult('FAIL', 'IP Whitelisting fails open when IP is missing', 'Found: if (!ipAddress) return true');
    } else {
      logResult('PASS', 'IP Whitelisting does not appear to fail open on missing IP (static check)');
    }
  }

  // --- 4. Tier Checks ---
  if (gatewayContent) {
    // Check for assertTier usage
    if (gatewayContent.includes('assertTier(tier,')) {
      logResult('PASS', 'Tier enforcement (assertTier) found in apiGateway.jsw');
    } else {
      logResult('FAIL', 'Tier enforcement (assertTier) NOT found in apiGateway.jsw');
    }
  }

  // --- 5. Rate Limiting Bypass ---
  if (gatewayContent) {
    // Check for the bypass header logic
    const bypassHeader = 'x-lmdr-bypass-rate-limit';
    if (gatewayContent.includes(bypassHeader)) {
      logResult('FAIL', 'Rate Limit Bypass header detected', `Found usage of '${bypassHeader}'`);
    } else {
      logResult('PASS', 'No Rate Limit Bypass header detected in apiGateway.jsw');
    }
  }

  const rateLimitContent = readFile('src/backend/rateLimitService.jsw');
  if (rateLimitContent) {
     if (rateLimitContent.includes('bypassRateLimit')) {
         logResult('WARN', 'Rate limiting service supports bypass flag', 'Function `checkAndTrackUsage` accepts `bypassRateLimit` argument');
     }
  }

  // --- 6. Permission Configuration ---
  const permissionsContent = readFile('src/backend/permissions.json');
  if (permissionsContent) {
    try {
      const permissions = JSON.parse(permissionsContent);
      const wildcard = permissions['web-methods']?.['*']?.['*'];

      if (wildcard?.anonymous?.invoke === true) {
        logResult('FAIL', 'Global Wildcard Permission for Anonymous Users detected', 'permissions.json grants invoke access to "*" for "anonymous"');
      } else {
        logResult('PASS', 'No Global Wildcard for Anonymous users found in permissions.json');
      }
    } catch (e) {
      logResult('FAIL', 'Could not parse permissions.json', e.message);
    }
  }

  // --- 7. Code Hygiene (Comments) ---
  const filesToScan = [
    'src/backend/apiGateway.jsw',
    'src/backend/apiAuthService.jsw',
    'src/backend/rateLimitService.jsw'
  ];

  const dangerousKeywords = ['TODO', 'HACK', 'FIXME', 'BYPASS', 'SKIP', 'TEMP', 'DISABLE'];

  filesToScan.forEach(file => {
      const content = readFile(file);
      if (content) {
          dangerousKeywords.forEach(keyword => {
              const regex = new RegExp(`//\\s*${keyword}`, 'i');
              if (regex.test(content)) {
                  logResult('WARN', `Found '${keyword}' comment in ${file}`);
              }
          });
      }
  });

  // --- Summary ---
  console.log(`\n${BOLD}Audit Complete.${RESET}`);
  console.log(`PASS: ${report.PASS.length}`);
  console.log(`FAIL: ${report.FAIL.length}`);
  console.log(`WARN: ${report.WARN.length}`);

  // Exit code 1 if any failures
  if (report.FAIL.length > 0) {
      process.exit(1);
  }
}

runAudit();
