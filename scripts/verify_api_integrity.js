const fs = require('fs');
const path = require('path');

const FILES = {
  apiGateway: 'src/backend/apiGateway.jsw',
  apiAuthService: 'src/backend/apiAuthService.jsw',
  driverMatching: 'src/backend/driverMatching.jsw',
  driverOutreach: 'src/backend/driverOutreach.jsw',
  permissions: 'src/backend/permissions.json'
};

function checkFile(filePath, regex, checkName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(regex);
    if (match) {
      console.log(`[FAIL] ${filePath}: ${checkName} FOUND (Match: "${match[0].trim()}")`);
      return false;
    }
    console.log(`[PASS] ${filePath}: ${checkName} NOT found.`);
    return true;
  } catch (err) {
    console.error(`[ERROR] ${filePath}: ${err.message}`);
    return false;
  }
}

function checkPermissions() {
  try {
    const content = fs.readFileSync(FILES.permissions, 'utf8');
    const json = JSON.parse(content);
    const methods = json['web-methods'] || {};

    // Check for global wildcard anonymous access
    if (methods['*'] && methods['*']['*'] && methods['*']['*'].anonymous && methods['*']['*'].anonymous.invoke) {
      console.log(`[FAIL] ${FILES.permissions}: Global wildcard allows Anonymous access to all web methods!`);
      return false;
    }
    console.log(`[PASS] ${FILES.permissions}: No global wildcard anonymous access found.`);
    return true;
  } catch (err) {
    console.error(`[ERROR] ${FILES.permissions}: ${err.message}`);
    return false;
  }
}

function checkIpWhitelistLogic() {
  const filePath = FILES.apiAuthService;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    // Regex for: if (!ipAddress) return true;
    const regex = /if\s*\(\s*!ipAddress\s*\)\s*return\s*true\s*;/;

    const match = content.match(regex);
    if (match) {
      console.log(`[FAIL] ${filePath}: IP Whitelist fail-open logic FOUND (Match: "${match[0].trim()}")`);
      return false;
    }
    console.log(`[PASS] ${filePath}: IP Whitelist fail-open logic NOT found.`);
    return true;
  } catch (err) {
    console.error(`[ERROR] ${filePath}: ${err.message}`);
    return false;
  }
}

console.log('--- API INTEGRITY VERIFICATION ---');

// Check 1: Bypass Rate Limit Header
checkFile(FILES.apiGateway, /x-lmdr-bypass-rate-limit/i, 'Rate limit bypass header logic');

// Check 2: Dev Mode Bypass Roles in DriverMatching
checkFile(FILES.driverMatching, /const DEV_MODE_BYPASS_ROLES\s*=\s*true/i, 'DEV_MODE_BYPASS_ROLES enabled');

// Check 3: Dev Mode Bypass Carrier in DriverMatching
checkFile(FILES.driverMatching, /const DEV_MODE_BYPASS_CARRIER\s*=\s*true/i, 'DEV_MODE_BYPASS_CARRIER enabled');

// Check 4: Dev Mode Bypass Carrier in DriverOutreach
checkFile(FILES.driverOutreach, /const DEV_MODE_BYPASS_CARRIER\s*=\s*true/i, 'DEV_MODE_BYPASS_CARRIER enabled');

// Check 5: Permissions Wildcard
checkPermissions();

// Check 6: IP Whitelist Logic
checkIpWhitelistLogic();

// Check 7: Check for TODOs near auth
const TODO_REGEX = /\/\/\s*(TODO|HACK|FIXME|BYPASS|SKIP|TEMP|DISABLE)/i;
checkFile(FILES.apiGateway, TODO_REGEX, 'Suspicious comment');
checkFile(FILES.apiAuthService, TODO_REGEX, 'Suspicious comment');
checkFile(FILES.driverMatching, TODO_REGEX, 'Suspicious comment');
checkFile(FILES.driverOutreach, TODO_REGEX, 'Suspicious comment');

console.log('--- VERIFICATION COMPLETE ---');
