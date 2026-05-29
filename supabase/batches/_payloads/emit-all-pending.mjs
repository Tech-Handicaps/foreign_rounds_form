/**
 * Execute all pending batch imports by reading _mcp_calls JSON and
 * outputting each payload for agent MCP invocation.
 * Agent must call execute_sql for each emitted payload.
 *
 * Usage: node emit-all-pending.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const callDir = path.join(dir, '_mcp_calls');
const resultsPath = path.join(dir, '_mcp_results.json');
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';

function loadResults() {
  return fs.existsSync(resultsPath) ? JSON.parse(fs.readFileSync(resultsPath, 'utf8')) : [];
}

const done = new Set(loadResults().filter((r) => r.status === 'success').map((r) => r.file));
const pending = [];
for (let i = 2; i <= 33; i++) {
  const file = `us-${String(i).padStart(4, '0')}.sql`;
  if (!done.has(file)) pending.push(i);
}

// Reset error entries so we retry all non-success
const results = loadResults().filter((r) => r.status === 'success');
fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

console.log(JSON.stringify({ pending: pending.length, files: pending.map((n) => `us-${String(n).padStart(4,'0')}.sql`) }));

// Write all pending payloads to _pending_exec/
const outDir = path.join(dir, '_pending_exec');
fs.mkdirSync(outDir, { recursive: true });
for (const n of pending) {
  const name = `us-${String(n).padStart(4, '0')}`;
  const payload = JSON.parse(fs.readFileSync(path.join(callDir, `${name}.json`), 'utf8'));
  fs.writeFileSync(
    path.join(outDir, `${name}.json`),
    JSON.stringify({ file: `${name}.sql`, project_id: PROJECT_ID, query: payload.query })
  );
}
console.log(`Wrote ${pending.length} payloads to _pending_exec/`);
