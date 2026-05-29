/**
 * Execute batch SQL imports via Supabase MCP execute_sql.
 * Reads queries from _temp_queries and writes per-file MCP arg JSON (no BOM).
 * Agent calls CallMcpTool execute_sql for each payload, then --finalize.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';
const tempDir = path.join(__dirname, '_temp_queries');
const payloadDir = path.join(__dirname, '_mcp_payloads');
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

function getQuery(num) {
  const name = `us-${String(num).padStart(4, '0')}`;
  const query = fs.readFileSync(path.join(tempDir, `${name}.sql`), 'utf8');
  return { file: `${name}.sql`, project_id: PROJECT_ID, query };
}

const cmd = process.argv[2];

if (cmd === 'prepare') {
  const start = parseInt(process.argv[3], 10);
  const end = parseInt(process.argv[4], 10);
  fs.mkdirSync(payloadDir, { recursive: true });
  const files = [];
  for (let i = start; i <= end; i++) {
    const payload = getQuery(i);
    const outPath = path.join(payloadDir, `batch-${i}.json`);
    fs.writeFileSync(outPath, JSON.stringify(payload));
    files.push({ num: i, path: outPath, file: payload.file });
  }
  console.log(JSON.stringify(files));
  process.exit(0);
}

if (cmd === 'record') {
  const file = process.argv[3];
  const status = process.argv[4];
  const error = process.argv[5];
  const results = loadResults();
  const idx = results.findIndex((r) => r.file === file);
  const entry = { file, status, ...(error ? { error } : {}) };
  if (idx >= 0) results[idx] = entry;
  else results.push(entry);
  saveResults(results);
  console.log(`Recorded ${file}: ${status}`);
  process.exit(0);
}

if (cmd === 'finalize') {
  const results = loadResults();
  results.sort((a, b) => a.file.localeCompare(b.file));
  saveResults(results);
  const success = results.filter((r) => r.status === 'success').length;
  const failed = results.filter((r) => r.status === 'error');
  console.log(JSON.stringify({ success, failed: failed.length, total: results.length, resultsPath }));
  process.exit(0);
}

console.error(`Usage:
  node run-mcp-batch-range.mjs prepare <start> <end>
  node run-mcp-batch-range.mjs record <file> <success|error> [message]
  node run-mcp-batch-range.mjs finalize`);
