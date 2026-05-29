/**
 * Sequential US batch import runner for agent CallMcpTool loop.
 * Usage:
 *   node run-all-imports.mjs next          -> prints next batch name or DONE
 *   node run-all-imports.mjs prepare NAME  -> writes _exec_now.json + _current_query.sql
 *   node run-all-imports.mjs record NAME ok|fail [error]
 *   node run-all-imports.mjs finalize CNT  -> writes import-results.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const progressPath = path.join(dir, 'import-progress.json');
const resultsPath = path.join(dir, 'import-results.json');
const loadScript = path.join(dir, 'load-mcp-args.mjs');
const START = 1;
const END = 33;

function loadProgress() {
  if (!fs.existsSync(progressPath)) {
    return { completed: {}, failed: {} };
  }
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
  const n = nextPending();
  console.log(n || 'DONE');
  process.exit(0);
}

if (cmd === 'prepare') {
  const name = process.argv[3];
  if (!name) process.exit(1);
  const r = spawnSync(process.execPath, [loadScript, name, '--write'], {
    encoding: 'utf8',
  });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    process.exit(1);
  }
  console.log('READY', name);
  process.exit(0);
}

if (cmd === 'record') {
  const name = process.argv[3];
  const status = process.argv[4];
  const error = process.argv[5];
  const p = loadProgress();
  if (status === 'ok') {
    p.completed[name] = true;
    delete p.failed[name];
  } else {
    p.failed[name] = error || 'unknown error';
    delete p.completed[name];
  }
  saveProgress(p);
  console.log('RECORDED', name, status);
  process.exit(0);
}

if (cmd === 'finalize') {
  const finalCount = process.argv[3] === undefined ? null : Number(process.argv[3]);
  const p = loadProgress();
  const results = [];
  for (let i = START; i <= END; i++) {
    const name = batchName(i);
    if (p.completed[name]) {
      results.push({ file: name, status: 'success' });
    } else if (p.failed[name]) {
      results.push({ file: name, status: 'error', error: p.failed[name] });
    } else {
      results.push({ file: name, status: 'error', error: 'not executed' });
    }
  }
  const succeeded = results.filter((r) => r.status === 'success').length;
  const failed = results.filter((r) => r.status === 'error');
  const summary = {
    succeeded,
    failed: failed.map(({ file, error }) => ({ file, error })),
    total: results.length,
    finalCount,
    results,
  };
  fs.writeFileSync(resultsPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  process.exit(0);
}

console.error('Usage: next | prepare NAME | record NAME ok|fail [err] | finalize CNT');
process.exit(1);
