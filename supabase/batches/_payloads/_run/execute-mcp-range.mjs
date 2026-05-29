/**
 * Execute us-0002..us-0033 via agent CallMcpTool (execute_sql).
 * Usage: node execute-mcp-range.mjs --emit 2 6
 *        node execute-mcp-range.mjs --record us-0002.sql success
 *        node execute-mcp-range.mjs --finalize
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, '..');
const callDir = path.join(root, '_mcp_calls');
const resultsPath = path.join(root, '_mcp_results.json');
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';

function loadResults() {
  if (!fs.existsSync(resultsPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  } catch {
    return [];
  }
}

function saveResults(results) {
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
}

function loadPayload(num) {
  const name = `us-${String(num).padStart(4, '0')}`;
  const payload = JSON.parse(fs.readFileSync(path.join(callDir, `${name}.json`), 'utf8'));
  return { file: `${name}.sql`, project_id: PROJECT_ID, query: payload.query };
}

const args = process.argv.slice(2);
const cmd = args[0];

if (cmd === '--emit') {
  const start = Number(args[1]);
  const end = Number(args[2]);
  const out = [];
  for (let i = start; i <= end; i++) out.push(loadPayload(i));
  process.stdout.write(JSON.stringify(out));
} else if (cmd === '--record') {
  const file = args[1];
  const status = args[2];
  const error = args[3];
  const results = loadResults().filter((r) => r.file !== file);
  results.push({ file, status, ...(error ? { error } : {}) });
  saveResults(results);
  console.log(`recorded ${file} ${status}`);
} else if (cmd === '--finalize') {
  const results = loadResults();
  const expected = [];
  for (let i = 2; i <= 33; i++) expected.push(`us-${String(i).padStart(4, '0')}.sql`);
  const byFile = Object.fromEntries(results.map((r) => [r.file, r]));
  const merged = expected.map((file) => byFile[file] || { file, status: 'pending' });
  saveResults(merged);
  const ok = merged.filter((r) => r.status === 'success').length;
  console.log(JSON.stringify({ success: ok, total: expected.length, failed: merged.filter((r) => r.status === 'error') }));
} else {
  console.error('Usage: --emit START END | --record FILE STATUS [ERROR] | --finalize');
  process.exit(1);
}
