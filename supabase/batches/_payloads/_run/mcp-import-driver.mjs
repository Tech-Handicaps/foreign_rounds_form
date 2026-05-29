/**
 * Execute us-0002..us-0033 via agent CallMcpTool loop.
 * Prints next file payload path for agent to read and call execute_sql.
 *
 * Usage:
 *   node mcp-import-driver.mjs next          # print next pending file path
 *   node mcp-import-driver.mjs mark us-0004.sql success
 *   node mcp-import-driver.mjs mark us-0004.sql error "msg"
 *   node mcp-import-driver.mjs finalize
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const resultsPath = path.join(dir, '..', '_mcp_results.json');
const execDir = dir;
const START = 2;
const END = 33;

function loadResults() {
  if (!fs.existsSync(resultsPath)) return [];
  return JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
}

function saveResults(results) {
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
}

function expectedFiles() {
  const out = [];
  for (let i = START; i <= END; i++) out.push(`us-${String(i).padStart(4, '0')}.sql`);
  return out;
}

function mergeResults(entries) {
  const byFile = Object.fromEntries(entries.map((r) => [r.file, r]));
  return expectedFiles().map((f) => byFile[f] || { file: f, status: 'pending' });
}

const [cmd, file, status, ...errParts] = process.argv.slice(2);

if (cmd === 'next') {
  const merged = mergeResults(loadResults());
  const next = merged.find((r) => r.status !== 'success');
  if (!next) {
    console.log(JSON.stringify({ done: true }));
    process.exit(0);
  }
  const base = next.file.replace('.sql', '');
  const execPath = path.join(execDir, `exec_${base}.json`);
  console.log(JSON.stringify({ file: next.file, execPath }));
} else if (cmd === 'mark') {
  const error = errParts.join(' ');
  const results = loadResults().filter((r) => r.file !== file);
  results.push({ file, status, ...(error ? { error } : {}) });
  saveResults(mergeResults(results));
  console.log(JSON.stringify({ file, status }));
} else if (cmd === 'finalize') {
  const merged = mergeResults(loadResults());
  saveResults(merged);
  const success = merged.filter((r) => r.status === 'success').length;
  const failed = merged.filter((r) => r.status === 'error');
  console.log(JSON.stringify({ success, total: merged.length, failed }));
} else {
  console.error('Usage: next | mark FILE success|error [msg] | finalize');
  process.exit(1);
}
