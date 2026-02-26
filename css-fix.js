const fs = require('fs');
const file = 'c:/Users/nolan/LMDR_WEBSITE_V2/LMDR-_-WEBSITE-V2/src/public/recruiter/os/css/recruiter-os.css';
let css = fs.readFileSync(file, 'utf8');

const vars = `
/* ── Color Variables ── */
:root, .light {
  --ros-bg: #F5F5DC;
  --ros-bg-d: #E8E0C8;
  --ros-shadow-d: #C8B896;
  --ros-shadow-l: #FFFFFF;
  --ros-text: #0f172a;
  --ros-text-muted: #C8B896;
  --ros-surface: #F5F5DC;
  --ros-accent: #2563eb;
  --ros-grid-1: rgba(200,184,150,.08);
  --ros-grid-2: rgba(200,184,150,.04);
}

html.dark {
  --ros-bg: #1a1a2e;
  --ros-bg-d: #141424;
  --ros-shadow-d: #0f0f1e;
  --ros-shadow-l: #252540;
  --ros-text: #e2e8f0;
  --ros-text-muted: #94a3b8;
  --ros-surface: #1a1a2e;
  --ros-accent: #3b82f6;
  --ros-grid-1: rgba(148,163,184,.08);
  --ros-grid-2: rgba(148,163,184,.04);
}
`;

// Insert after the reset block
css = css.replace('/* ── Reset & Base ── */', vars + '\n/* ── Reset & Base ── */');

// Replacements
css = css.replace(/#F5F5DC/gi, 'var(--ros-surface)');
css = css.replace(/body \{\n\s*background: var\(--ros-surface\);/i, 'body {\n  background: var(--ros-bg);');
css = css.replace(/#C8B896/gi, 'var(--ros-shadow-d)');
css = css.replace(/#FFFFFF/gi, 'var(--ros-shadow-l)');
css = css.replace(/#0f172a/gi, 'var(--ros-text)');
css = css.replace(/rgba\(200,184,150,\.08\)/gi, 'var(--ros-grid-1)');
css = css.replace(/rgba\(200,184,150,\.04\)/gi, 'var(--ros-grid-2)');
css = css.replace(/#E8E0C8/gi, 'var(--ros-bg-d)');

// Fix text color where shadow-d was incorrectly mapped
css = css.replace(/color: var\(--ros-shadow-d\)/gi, 'color: var(--ros-text-muted)');
css = css.replace(/::placeholder \{ color: var\(--ros-shadow-d\); \}/gi, '::placeholder { color: var(--ros-text-muted); }');

// We have `#FFFFFF` -> `var(--ros-shadow-l)`. 
// But what about white text? E.g. `color: #FFFFFF`
css = css.replace(/color: var\(--ros-shadow-l\)/gi, 'color: #FFFFFF');
// And what about white borders, etc. Let's leave it as is, or fix specifically if needed.

fs.writeFileSync(file, css);
console.log('recruiter-os.css updated successfully.');
