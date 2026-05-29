/**
 * Process us-0010..us-0033: prep args, print batch name for agent CallMcpTool loop.
 * Agent must CallMcpTool execute_sql with _call_args.json then:
 *   node run-mcp-loop.mjs done NAME ok
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const progressPath = path.join(dir, 'import-progress.json');
const start = parseInt(process.argv[2] ?? '10', 10);
const end = parseInt(process.argv[3] ?? '33', 10);

function loadProgress() {
  return JSON.parse(fs.readFileSync(progressPath, 'utf8'));
}

function batchName(i) {
  return `us-${String(i).padStart(4, '0')}`;
}

const p = loadProgress();
const pending = [];
for (let i = start; i <= end; i++) {
  const name = batchName(i);
  if (!p.completed[name] && !p.failed[name]) pending.push(name);
}
if (pending.length === 0) {
  console.log('ALL_DONE');
  process.exit(0);
}
const name = pending[0];
const r = spawnSync(process.execPath, [path.join(dir, 'prep-call-args.mjs'), name], {
  encoding: 'utf8',
});
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  process.exit(1);
}
const args = JSON.parse(fs.readFileSync(path.join(dir, '_call_args.json'), 'utf8'));
console.log(JSON.stringify({ next: name, pending: pending.length, query_len: args.query.length }));
