const fs = require('fs');
const path = require('path');

// Patterns for potential secrets
// Using \b to avoid matching substrings in function names (e.g., dispatch -> patch)
const SECRET_PATTERNS = [
  /\bpat[a-zA-Z0-9]{10,}/, // Airtable PAT
  /\bntn_[a-zA-Z0-9]{20,}/, // Notion Token
  /\bsk_live_[a-zA-Z0-9]{10,}/, // Stripe Live Secret Key
  /\bpk_live_[a-zA-Z0-9]{10,}/, // Stripe Live Publishable Key
  /Bearer\s+ntn_[a-zA-Z0-9]+/, // Bearer token (Notion)
  /\bghp_[a-zA-Z0-9]{20,}/, // GitHub PAT
  /\bxox[baprs]-[a-zA-Z0-9]{10,}/, // Slack Token
];

// Files to check specifically
const SPECIFIC_FILES = ['.mcp.json'];

// Directories to scan recursively
const SCAN_DIRS = ['src'];

let findings = [];

function checkFile(filepath) {
  try {
    if (!fs.existsSync(filepath)) return;

    const content = fs.readFileSync(filepath, 'utf8');

    // Check specific files like .mcp.json strictly
    if (filepath.endsWith('.mcp.json')) {
        const json = JSON.parse(content);
        // Check Airtable
        if (json.mcpServers?.airtable?.env?.AIRTABLE_API_KEY &&
            json.mcpServers.airtable.env.AIRTABLE_API_KEY.startsWith('pat')) {
            findings.push({ file: filepath, type: 'Airtable PAT', match: 'AIRTABLE_API_KEY present' });
        }
        // Check Notion
        if (json.mcpServers?.notionApi?.env?.OPENAPI_MCP_HEADERS &&
            json.mcpServers.notionApi.env.OPENAPI_MCP_HEADERS.includes('Bearer ntn_')) {
            findings.push({ file: filepath, type: 'Notion Token', match: 'Bearer ntn_... present' });
        }
    }

    // General regex scan
    SECRET_PATTERNS.forEach(pattern => {
      if (pattern.test(content)) {
        // Exclude test files from general scan unless it looks like a real live key
        if (filepath.includes('__tests__') || filepath.includes('test-backup')) {
             const match = content.match(pattern)[0];
             if (match.includes('_live_') || match.startsWith('pat') || match.startsWith('ntn')) {
                 // Flag live keys even in tests
             } else {
                 return;
             }
        }

        // Exclude specific known false positives or placeholders
        if (content.includes('YOUR_AIRTABLE_API_KEY_HERE') || content.includes('YOUR_NOTION_TOKEN_HERE')) {
             return;
        }

        const match = content.match(pattern)[0];
        // Redact match for output
        const redacted = match.substring(0, 4) + '...' + match.substring(match.length - 4);
        findings.push({ file: filepath, type: 'Regex Match', match: redacted });
      }
    });

  } catch (err) {
    console.error(`Error reading ${filepath}:`, err.message);
  }
}

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        scanDir(fullPath);
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.jsw') || file.endsWith('.json') || file.endsWith('.html')) {
        checkFile(fullPath);
      }
    }
  });
}

console.log('Starting secret scan...');

// Check specific files
SPECIFIC_FILES.forEach(f => checkFile(f));

// Scan directories
SCAN_DIRS.forEach(d => scanDir(d));

if (findings.length > 0) {
  console.log('\nPotential secrets found:');
  findings.forEach(f => console.log(`- [${f.type}] ${f.file}: ${f.match}`));
  console.log('\nFAIL: Secrets detected.');
  process.exit(1);
} else {
  console.log('\nPASS: No secrets found.');
  process.exit(0);
}
