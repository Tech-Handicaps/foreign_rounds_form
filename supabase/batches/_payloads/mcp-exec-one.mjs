/**
 * Generate MCP invoke JSON for batch N and optionally record results.
 * Usage:
 *   node mcp-exec-one.mjs prepare 2   -> writes _invoke/us-0002.json
 *   node mcp-exec-one.mjs record us-0002.sql success
 *   node mcp-exec-one.mjs record us-0002.sql error "message"
 *   node mcp-exec-one.mjs summary
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';
const execArgsDir = path.join(__dirname, '_exec_args');
const invokeDir = path.join(__dirname, '_invoke');
const resultsPath = path.join(__dirname, '_mcp_results.json');

function loadResults() {
  return fs.existsSync(resultsPath)
    ? JSON.parse(fs.readFileSync(resultsPath, 'utf8'))
    : [];
}

function saveResults(results) {
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
}

const [cmd, arg1, arg2, ...rest] = process.argv.slice(2);

if (cmd === 'prepare') {
  const num = parseInt(arg1, 10);
  const name = `us-${String(num).padStart(4, '0')}`;
  const args = JSON.parse(fs.readFileSync(path.join(execArgsDir, `${name}.json`), 'utf8'));
  fs.mkdirSync(invokeDir, { recursive: true });
  const out = { file: `${name}.sql`, project_id: PROJECT_ID, query: args.query };
  fs.writeFileSync(path.join(invokeDir, `${name}.json`), JSON.stringify(out));
  console.log(JSON.stringify({ file: out.file, queryLen: out.query.length }));
  process.exit(0);
}

if (cmd === 'record') {
  const file = arg1;
  const status = arg2;
  const error = rest.join(' ') || undefined;
  const results = loadResults();
  const entry = { file, status, ...(error ? { error } : {}) };
  const idx = results.findIndex((r) => r.file === file);
  if (idx >= 0) results[idx] = entry;
  else results.push(entry);
  saveResults(results);
  console.log(`recorded ${file}: ${status}`);
  process.exit(0);
}

if (cmd === 'summary') {
  const results = loadResults();
  const ok = results.filter((r) => r.status === 'success').length;
  const fail = results.filter((r) => r.status === 'error');
  console.log(JSON.stringify({ total: results.length, success: ok, failed: fail }, null, 2));
  process.exit(0);
}

console.error('Usage: prepare <N> | record <file> <status> [error] | summary');
process.exit(1);
