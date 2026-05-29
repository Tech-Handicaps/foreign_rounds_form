/**
 * Execute all remaining US batch imports (us-0004..us-0033) via MCP execute_sql.
 * Updates _mcp_results.json incrementally.
 *
 * Usage: node scripts/mcp-exec-remaining.mjs
 * Requires agent to wire CallMcpTool - this script prepares batch index only.
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

function record(file, status, error) {
  const results = loadResults();
  const idx = results.findIndex((r) => r.file === file);
  const entry = { file, status, ...(error ? { error } : {}) };
  if (idx >= 0) results[idx] = entry;
  else results.push(entry);
  saveResults(results);
  return results;
}

// Export helpers for agent-driven execution
const num = parseInt(process.argv[2] ?? '0', 10);
if (num >= 2 && num <= 33) {
  const payload = loadPayload(num);
  writeFileSync(
    join(__dirname, '../supabase/batches/_payloads/_mcp_current.json'),
    JSON.stringify(payload)
  );
  console.log(JSON.stringify(payload));
} else if (process.argv[2] === 'record') {
  const file = process.argv[3];
  const status = process.argv[4];
  const error = process.argv[5];
  const results = record(file, status, error);
  console.log(JSON.stringify({ recorded: file, status, total: results.length }));
} else if (process.argv[2] === 'pending') {
  const results = loadResults();
  const done = new Set(results.filter((r) => r.status === 'success').map((r) => r.file));
  const pending = [];
  for (let i = 2; i <= 33; i++) {
    const file = `us-${String(i).padStart(4, '0')}.sql`;
    if (!done.has(file)) pending.push(i);
  }
  console.log(JSON.stringify({ pending, count: pending.length }));
} else {
  console.log('Usage: node mcp-exec-remaining.mjs <num>|record|pending');
}
