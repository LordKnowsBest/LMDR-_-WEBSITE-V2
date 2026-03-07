const fs = require('fs');
const audit = JSON.parse(fs.readFileSync('audit.json'));

const vulns = audit.vulnerabilities;
const severityCounts = audit.metadata.vulnerabilities;

console.log("Severity Counts:", severityCounts);

console.log("\nCritical and High Vulnerabilities:");
for (const [pkgName, vulnDetails] of Object.entries(vulns)) {
  if (vulnDetails.severity === 'critical' || vulnDetails.severity === 'high') {
    const affectedVersions = vulnDetails.range;
    let fix = vulnDetails.fixAvailable;
    let fixInfo = fix ? (typeof fix === 'object' ? `Yes (${fix.name}@${fix.version})` : 'Yes') : 'No';

    // get unique GHSAs/CVEs
    const ids = vulnDetails.via.filter(v => typeof v === 'object' && v.title).map(v => v.url.split('/').pop()).join(', ');

    console.log(`- Package: ${pkgName}`);
    console.log(`  Severity: ${vulnDetails.severity}`);
    console.log(`  Vulnerability IDs: ${ids}`);
    console.log(`  Affected Version: ${affectedVersions}`);
    console.log(`  Fix Available: ${fixInfo}`);
  }
}
