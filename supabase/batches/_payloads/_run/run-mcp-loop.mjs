/**
 * Agent loop helper: emit next batch for CallMcpTool execute_sql.
 * Usage:
 *   node run-mcp-loop.mjs next
 *   node run-mcp-loop.mjs emit NAME   -> writes _mcp_call.json
 *   node run-mcp-loop.mjs done NAME [error]
 *   node run-mcp-loop.mjs summary CNT
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const progressPath = path.join(dir, 'import-progress.json');
const resultsPath = path.join(dir, 'import-results.json');
const getArgs = path.join(dir, 'get-mcp-call-args.mjs');
const START = 1;
const END = 33;

function loadProgress() {
  if (!fs.existsSync(progressPath)) return { completed: {}, failed: {} };
  return JSON.parse(fs.readFileSync(progressPath, 'utf8'));
}

function saveProgress(p) {
  fs.writeFileSync(progressPath, JSON.stringify(p, null, 2));
}

function batchName(i) {
  return `us-${String(i).padStart(4, '0')}`;
}

function nextPending() {
  const p = loadProgress();
  for (let i = START; i <= END; i++) {
    const name = batchName(i);
    if (!p.completed[name] && !p.failed[name]) return name;
  }
  return null;
}

const cmd = process.argv[2];

if (cmd === 'next') {
  console.log(nextPending() || 'DONE');
  process.exit(0);
}

if (cmd === 'emit') {
  const name = process.argv[3];
  const r = spawnSync(process.execPath, [getArgs, name, '--write'], { encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    process.exit(1);
  }
  console.log('EMIT', name);
  process.exit(0);
}

if (cmd === 'done') {
  const name = process.argv[3];
  const err = process.argv[4];
  const p = loadProgress();
  if (err && err !== 'ok') {
    p.failed[name] = err;
    delete p.completed[name];
  } else {
    p.completed[name] = true;
    delete p.failed[name];
  }
  saveProgress(p);
  console.log('DONE', name);
  process.exit(0);
}

if (cmd === 'summary') {
  const finalCount = process.argv[3] === undefined ? null : Number(process.argv[3]);
  const p = loadProgress();
  const results = [];
  for (let i = START; i <= END; i++) {
    const name = batchName(i);
    if (p.completed[name]) results.push({ file: name, status: 'success' });
    else if (p.failed[name]) results.push({ file: name, status: 'error', error: p.failed[name] });
    else results.push({ file: name, status: 'error', error: 'not executed' });
  }
  const summary = {
    succeeded: results.filter((r) => r.status === 'success').length,
    failed: results.filter((r) => r.status === 'error').map(({ file, error }) => ({ file, error })),
    total: results.length,
    finalCount,
    results,
  };
  fs.writeFileSync(resultsPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
  process.exit(0);
}

console.error('Usage: next | emit NAME | done NAME [err] | summary CNT');
process.exit(1);
