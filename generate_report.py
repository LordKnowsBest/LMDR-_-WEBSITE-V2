import json

def generate_report():
    with open('audit_results.json', 'r') as f:
        data = json.load(f)

    metadata = data.get('metadata', {}).get('vulnerabilities', {})

    print("### Vulnerability Summary Table")
    print("| Severity | Count |")
    print("|----------|-------|")
    print(f"| Critical | {metadata.get('critical', 0)} |")
    print(f"| High     | {metadata.get('high', 0)} |")
    print(f"| Moderate | {metadata.get('moderate', 0)} |")
    print(f"| Low      | {metadata.get('low', 0)} |")
    print(f"| Info     | {metadata.get('info', 0)} |")
    print(f"| **Total**| **{metadata.get('total', 0)}** |")
    print("")

    vulnerabilities = data.get('vulnerabilities', {})
    print("### Critical and High Findings")
    print("| Package | Severity | Vulnerability ID | Affected Version | Patched Version |")
    print("|---------|----------|------------------|------------------|-----------------|")

    for pkg_name, vuln in vulnerabilities.items():
        severity = vuln.get('severity', '')
        if severity not in ['critical', 'high']:
            continue

        via_list = vuln.get('via', [])
        range_aff = vuln.get('range', '')

        fix_avail = vuln.get('fixAvailable', False)
        patched_version = "Yes" if fix_avail else "No"
        if isinstance(fix_avail, dict):
            patched_version = f"Yes (via {fix_avail.get('name')} {fix_avail.get('version')})"

        # via can be list of strings or dicts
        for via in via_list:
            if isinstance(via, dict):
                vuln_id = via.get('source', '')
                title = via.get('title', '')
                url = via.get('url', '')
                ghsa = url.split('/')[-1] if url else vuln_id
                print(f"| {pkg_name} | {severity.capitalize()} | {ghsa} | {range_aff} | {patched_version} |")

generate_report()
