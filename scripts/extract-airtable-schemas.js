/**
 * Extract Airtable schemas from list_tables response
 * Generates markdown documentation for each table
 *
 * Usage: node scripts/extract-airtable-schemas.js
 */

const fs = require('fs');
const path = require('path');

// Tables already documented (skip these)
const ALREADY_DOCUMENTED = new Set([
  'CarrierStaffingRequests',
  'v2_Achievement Definitions',
  'v2_Admin Users',
  'v2_Badge Definitions',
  'v2_Challenge Definitions',
  'v2_Driver Achievements',
  'v2_Driver Carrier Interests',
  'v2_Driver Challenges',
  'v2_Driver Progression',
  'v2_Gamification Events',
  'v2_Leaderboard Snapshots',
  'v2_Member Notifications',
  'v2_Recruiter Badges',
  'v2_Recruiter Progression',
  'v2_Seasonal Events',
  'v2_System Metrics',
  'v2_System Traces',
  // Also skip legacy/imported tables
  'Imported table',
]);

// Map Airtable field types to human-readable descriptions
const TYPE_DESCRIPTIONS = {
  'singleLineText': 'Single Line Text',
  'multilineText': 'Long Text / Multiline',
  'email': 'Email',
  'url': 'URL',
  'phoneNumber': 'Phone Number',
  'number': 'Number',
  'currency': 'Currency',
  'percent': 'Percent',
  'singleSelect': 'Single Select',
  'multipleSelects': 'Multiple Select',
  'checkbox': 'Checkbox',
  'date': 'Date',
  'dateTime': 'Date & Time',
  'duration': 'Duration',
  'rating': 'Rating',
  'richText': 'Rich Text',
  'multipleAttachments': 'Attachments',
  'multipleRecordLinks': 'Linked Records',
  'formula': 'Formula',
  'rollup': 'Rollup',
  'count': 'Count',
  'lookup': 'Lookup',
  'createdTime': 'Created Time (Auto)',
  'lastModifiedTime': 'Last Modified Time (Auto)',
  'createdBy': 'Created By (Auto)',
  'lastModifiedBy': 'Last Modified By (Auto)',
  'autoNumber': 'Auto Number',
  'barcode': 'Barcode',
  'button': 'Button',
  'externalSyncSource': 'Sync Source',
};

function formatFieldType(field) {
  const baseType = TYPE_DESCRIPTIONS[field.type] || field.type;

  // Add additional info for specific types
  if (field.type === 'singleSelect' && field.options?.choices) {
    const choices = field.options.choices.map(c => `\`${c.name}\``).join(', ');
    return `${baseType} (${choices})`;
  }

  if (field.type === 'multipleSelects' && field.options?.choices) {
    const choices = field.options.choices.map(c => `\`${c.name}\``).join(', ');
    return `${baseType} (${choices})`;
  }

  if (field.type === 'multipleRecordLinks' && field.options?.linkedTableId) {
    return `${baseType} → ${field.options.linkedTableId}`;
  }

  if (field.type === 'number' && field.options?.precision !== undefined) {
    return `${baseType} (precision: ${field.options.precision})`;
  }

  if (field.type === 'currency' && field.options?.symbol) {
    return `${baseType} (${field.options.symbol})`;
  }

  if (field.type === 'formula' && field.options?.result?.type) {
    return `${baseType} → ${field.options.result.type}`;
  }

  if (field.type === 'rollup' && field.options?.result?.type) {
    return `${baseType} → ${field.options.result.type}`;
  }

  return baseType;
}

function generateMarkdown(table) {
  const lines = [];

  // Title
  lines.push(`# ${table.name}`);
  lines.push('');

  // Metadata
  lines.push('## Table Metadata');
  lines.push('');
  lines.push(`| Property | Value |`);
  lines.push(`|----------|-------|`);
  lines.push(`| Table ID | \`${table.id}\` |`);
  lines.push(`| Base | Last Mile Driver recruiting |`);
  lines.push(`| Base ID | \`app9N1YCJ3gdhExA0\` |`);
  lines.push('');

  // Fields table
  lines.push('## Fields');
  lines.push('');
  lines.push('| Field Name | Type | Field ID | Description |');
  lines.push('|------------|------|----------|-------------|');

  for (const field of table.fields || []) {
    const name = field.name || 'Unnamed';
    const type = formatFieldType(field);
    const id = field.id || '';
    const desc = field.description || '-';
    lines.push(`| ${name} | ${type} | \`${id}\` | ${desc} |`);
  }

  lines.push('');

  // Backend field mapping section
  lines.push('## Backend Field Mapping (snake_case)');
  lines.push('');
  lines.push('Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:');
  lines.push('');
  lines.push('```javascript');
  lines.push(`'${table.name}': {`);

  for (const field of table.fields || []) {
    const snakeCase = field.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    lines.push(`  '${snakeCase}': '${field.name}',`);
  }

  lines.push('},');
  lines.push('```');
  lines.push('');

  // Notes section
  lines.push('## Notes');
  lines.push('');
  lines.push('- Auto-generated schema documentation');
  lines.push(`- Generated: ${new Date().toISOString().split('T')[0]}`);
  lines.push('');

  return lines.join('\n');
}

function tableNameToFilename(name) {
  // Convert "v2_Blog Posts" -> "v2_Blog_Posts.md"
  return name.replace(/\s+/g, '_') + '.md';
}

async function main() {
  // Read the cached list_tables response
  const cachePath = process.argv[2] || 'C:/Users/nolan/.claude/projects/C--Users-nolan-LMDR-WEBSITE-V2-LMDR---WEBSITE-V2/f62e2580-e852-4b89-b3c1-437e6ad62b39/tool-results/mcp-airtable-list_tables-1769533691225.txt';

  if (!fs.existsSync(cachePath)) {
    console.error('Cache file not found:', cachePath);
    console.error('Run the Airtable MCP list_tables first to generate the cache.');
    process.exit(1);
  }

  const raw = fs.readFileSync(cachePath, 'utf-8');
  const outer = JSON.parse(raw);
  const inner = JSON.parse(outer[0].text);
  const tables = Object.values(inner);

  // Output directory
  const outDir = path.join(__dirname, '..', 'docs', 'schemas', 'airtable');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  let created = 0;
  let skipped = 0;

  for (const table of tables) {
    if (ALREADY_DOCUMENTED.has(table.name)) {
      console.log(`[SKIP] ${table.name} (already documented)`);
      skipped++;
      continue;
    }

    const filename = tableNameToFilename(table.name);
    const filepath = path.join(outDir, filename);

    // Check if file already exists
    if (fs.existsSync(filepath)) {
      console.log(`[SKIP] ${table.name} (file exists: ${filename})`);
      skipped++;
      continue;
    }

    const markdown = generateMarkdown(table);
    fs.writeFileSync(filepath, markdown);
    console.log(`[CREATE] ${filename}`);
    created++;
  }

  console.log('');
  console.log(`Done! Created ${created} files, skipped ${skipped}.`);
  console.log(`Output: ${outDir}`);
}

main().catch(console.error);
