/**
 * Emit MCP execute_sql payloads for pending US batches (us-0002..us-0033).
 * Usage:
 *   node scripts/mcp-run-loop.mjs next          -> next pending payload JSON
 *   node scripts/mcp-run-loop.mjs next 3        -> next 3 pending payloads (NDJSON)
 *   node scripts/mcp-run-loop.mjs record <file> success|error [message]
 *   node scripts/mcp-run-loop.mjs status
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const callDir = join(__dirname, '../supabase/batches/_payloads/_mcp_calls');
const resultsPath = join(__dirname, '../supabase/batches/_payloads/_mcp_results.json');
const projectId = 'igmuuvrjmrgnxadewbec';

function loadResults() {
  if (!existsSync(resultsPath)) return [];
  return JSON.parse(readFileSync(resultsPath, 'utf8'));
}

function saveResults(results) {
  writeFileSync(resultsPath, JSON.stringify(results, null, 2));
}

function loadPayload(num) {
  const name = `us-${String(num).padStart(4, '0')}`;
  const payload = JSON.parse(readFileSync(join(callDir, `${name}.json`), 'utf8'));
  return { file: `${name}.sql`, project_id: projectId, query: payload.query };
}

function pendingNums() {
  const results = loadResults();
  const done = new Set(results.filter((r) => r.status === 'success').map((r) => r.file));
  const nums = [];
  for (let i = 2; i <= 33; i++) {
    const file = `us-${String(i).padStart(4, '0')}.sql`;
    if (!done.has(file)) nums.push(i);
  }
  return nums;
}

const cmd = process.argv[2];

if (cmd === 'next') {
  const count = parseInt(process.argv[3] ?? '1', 10);
  const nums = pendingNums().slice(0, count);
  for (const n of nums) {
    process.stdout.write(JSON.stringify(loadPayload(n)) + '\n');
  }
} else if (cmd === 'record') {
  const file = process.argv[3];
  const status = process.argv[4];
  const error = process.argv[5];
  const results = loadResults();
  const idx = results.findIndex((r) => r.file === file);
  const entry = { file, status, ...(error ? { error } : {}) };
  if (idx >= 0) results[idx] = entry;
  else results.push(entry);
  saveResults(results);
  console.log(JSON.stringify({ recorded: file, status, total: results.length, success: results.filter((r) => r.status === 'success').length }));
} else if (cmd === 'status') {
  const results = loadResults();
  const pending = pendingNums();
  console.log(JSON.stringify({
    success: results.filter((r) => r.status === 'success').length,
    errors: results.filter((r) => r.status === 'error'),
    pending: pending.map((n) => `us-${String(n).padStart(4, '0')}.sql`),
  }));
} else {
  console.log('Usage: next [count] | record <file> <status> [error] | status');
}
