/**
 * Execute all batch SQL imports via Supabase MCP execute_sql pattern.
 * Reads queries from _temp_queries and writes incremental results.
 * Agent uses: node run-mcp-imports-all.mjs --num N to get payload for MCP call.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';
const START = 2;
const END = 33;
const tempDir = path.join(__dirname, '_temp_queries');
const resultsPath = path.join(__dirname, '_mcp_results.json');

function loadResults() {
  if (fs.existsSync(resultsPath)) {
    return JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  }
  return [];
}

function saveResults(results) {
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
}

function getPayload(num) {
  const name = `us-${String(num).padStart(4, '0')}`;
  const query = fs.readFileSync(path.join(tempDir, `${name}.sql`), 'utf8');
  return { file: `${name}.sql`, project_id: PROJECT_ID, query };
}

const args = process.argv.slice(2);
if (args[0] === '--num') {
  const num = parseInt(args[1], 10);
  process.stdout.write(JSON.stringify(getPayload(num)));
  process.exit(0);
}

if (args[0] === '--record') {
  const file = args[1];
  const status = args[2];
  const error = args[3] || undefined;
  const results = loadResults();
  const idx = results.findIndex((r) => r.file === file);
  const entry = { file, status, ...(error ? { error } : {}) };
  if (idx >= 0) results[idx] = entry;
  else results.push(entry);
  saveResults(results);
  console.log(`Recorded ${file}: ${status}`);
  process.exit(0);
}

if (args[0] === '--list-pending') {
  const results = loadResults();
  const done = new Set(results.filter((r) => r.status === 'success').map((r) => r.file));
  const pending = [];
  for (let i = START; i <= END; i++) {
    const file = `us-${String(i).padStart(4, '0')}.sql`;
    if (!done.has(file)) pending.push(i);
  }
  console.log(JSON.stringify(pending));
  process.exit(0);
}

console.error(`Usage:
  node run-mcp-imports-all.mjs --num N
  node run-mcp-imports-all.mjs --record us-0002.sql success
  node run-mcp-imports-all.mjs --list-pending`);
