/**
 * mass-embed-watcher.mjs
 * Polls the mass-embed progress file and automatically starts the next
 * DOT range when the current run completes.
 * Usage: node --env-file=../.env scripts/mass-embed-watcher.mjs
 */

import fs                from 'node:fs';
import path              from 'node:path';
import { spawn }         from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROGRESS  = path.join(__dirname, '.mass-embed-progress.json');
const TARGET    = 4_320_000;
const NEXT_END  = 4_400_000;
const POLL_MS   = 60_000;

function readDot() {
  try { return JSON.parse(fs.readFileSync(PROGRESS, 'utf8')).next_dot || 0; }
  catch { return 0; }
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runMassEmbed(start, end) {
  return new Promise((resolve, reject) => {
    console.log(`[watcher] Spawning: local-mass-embed.js ${start} ${end}`);
    const proc = spawn(
      'node',
      ['--env-file=../.env', 'scripts/local-mass-embed.js', String(start), String(end)],
      { cwd: __dirname + '/..', stdio: 'inherit' }
    );
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`Exit ${code}`)));
    proc.on('error', reject);
  });
}

console.log(`[watcher] Started — polling every 60s for DOT ${TARGET.toLocaleString()}`);

while (true) {
  const dot     = readDot();
  const pct     = ((dot - 4_271_001) / (TARGET - 4_271_001) * 100).toFixed(1);
  const estMin  = Math.round(Math.max(0, TARGET - dot) / (20 * 60));
  console.log(`[watcher] ${new Date().toLocaleTimeString()} | DOT ${dot.toLocaleString()} / ${TARGET.toLocaleString()} (${pct}%) ~${estMin}min left`);

  if (dot >= TARGET) {
    console.log(`\n[watcher] ✅ First run done at DOT ${dot.toLocaleString()}`);
    console.log(`[watcher] 🚀 Starting next range: ${dot.toLocaleString()} → ${NEXT_END.toLocaleString()}\n`);
    try {
      await runMassEmbed(dot, NEXT_END);
      console.log('[watcher] ✅ Second run complete.');
    } catch (err) {
      console.error('[watcher] ❌ Second run failed:', err.message);
    }
    process.exit(0);
  }

  await wait(POLL_MS);
}
