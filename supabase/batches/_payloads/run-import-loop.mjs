/**
 * Execute all pending batch imports via Supabase MCP execute_sql.
 * Reads _mcp_calls payloads and writes _mcp_exec_args.json per file.
 * Agent calls CallMcpTool execute_sql with _mcp_exec_args.json contents.
 *
 * Usage:
 *   node run-import-loop.mjs prepare-next     -> writes _mcp_exec_args.json, prints file name
 *   node run-import-loop.mjs mark-success F  -> record success for file F
 *   node run-import-loop.mjs mark-error F MSG -> record error
 *   node run-import-loop.mjs status
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const callDir = path.join(dir, '_mcp_calls');
const resultsPath = path.join(dir, '_mcp_results.json');
const execArgsPath = path.join(dir, '_mcp_exec_args.json');
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';
const START = 2;
const END = 33;

function loadResults() {
  return fs.existsSync(resultsPath) ? JSON.parse(fs.readFileSync(resultsPath, 'utf8')) : [];
}

function saveResults(r) {
  fs.writeFileSync(resultsPath, JSON.stringify(r, null, 2));
}

function record(file, status, error) {
  const results = loadResults();
  const entry = { file, status, ...(error ? { error } : {}) };
  const idx = results.findIndex((x) => x.file === file);
  if (idx >= 0) results[idx] = entry;
  else results.push(entry);
  saveResults(results);
}

function pending() {
  const done = new Set(loadResults().filter((r) => r.status === 'success').map((r) => r.file));
  const out = [];
  for (let i = START; i <= END; i++) {
    const file = `us-${String(i).padStart(4, '0')}.sql`;
    if (!done.has(file)) out.push({ num: i, file });
  }
  return out;
}

const [cmd, ...rest] = process.argv.slice(2);

if (cmd === 'prepare-next') {
  const next = pending()[0];
  if (!next) {
    console.log('ALL_DONE');
    process.exit(0);
  }
  const name = `us-${String(next.num).padStart(4, '0')}`;
  const payload = JSON.parse(fs.readFileSync(path.join(callDir, `${name}.json`), 'utf8'));
  const args = { project_id: PROJECT_ID, query: payload.query };
  fs.writeFileSync(execArgsPath, JSON.stringify(args));
  console.log(JSON.stringify({ file: next.file, queryLen: args.query.length }));
  process.exit(0);
}

if (cmd === 'prepare-batch') {
  const count = parseInt(rest[0] || '4', 10);
  const batch = pending().slice(0, count);
  if (!batch.length) {
    console.log('ALL_DONE');
    process.exit(0);
  }
  const outDir = path.join(dir, '_batch_ready');
  fs.mkdirSync(outDir, { recursive: true });
  for (const { num, file } of batch) {
    const name = `us-${String(num).padStart(4, '0')}`;
    const payload = JSON.parse(fs.readFileSync(path.join(callDir, `${name}.json`), 'utf8'));
    fs.writeFileSync(
      path.join(outDir, `${name}.json`),
      JSON.stringify({ project_id: PROJECT_ID, query: payload.query, file })
    );
  }
  console.log(JSON.stringify(batch.map((b) => b.file)));
  process.exit(0);
}

if (cmd === 'mark-success') {
  record(rest[0], 'success');
  console.log('ok');
  process.exit(0);
}

if (cmd === 'mark-error') {
  record(rest[0], 'error', rest.slice(1).join(' '));
  console.log('ok');
  process.exit(0);
}

if (cmd === 'status') {
  const results = loadResults();
  const ok = results.filter((r) => r.status === 'success').length;
  const fail = results.filter((r) => r.status === 'error');
  console.log(JSON.stringify({ success: ok, failed: fail, pending: pending().map((p) => p.file) }, null, 2));
  process.exit(0);
}

console.error('Usage: prepare-next | prepare-batch [N] | mark-success FILE | mark-error FILE MSG | status');
process.exit(1);
