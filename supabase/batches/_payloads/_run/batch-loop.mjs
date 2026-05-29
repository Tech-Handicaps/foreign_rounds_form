/**
 * Batch loop helper for agent MCP imports.
 * Usage:
 *   node batch-loop.mjs mark ok us-0003
 *   node batch-loop.mjs mark fail us-0003 "error msg"
 *   node batch-loop.mjs prep us-0004
 *   node batch-loop.mjs next-from 4   -> next batch name from number
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const loop = path.join(dir, 'run-mcp-loop.mjs');
const runner = path.join(dir, 'mcp-batch-runner.mjs');
const argsPath = path.join(dir, '_mcp_args_only.json');

const cmd = process.argv[2];

if (cmd === 'mark') {
  const status = process.argv[3];
  const name = process.argv[4];
  const err = process.argv[5];
  const args = [loop, 'done', name];
  if (status === 'ok') args.push('ok');
  else if (err) args.push('fail', err);
  else args.push('fail', 'unknown error');
  const r = spawnSync(process.execPath, args, { encoding: 'utf8' });
  process.stdout.write(r.stdout || '');
  process.stderr.write(r.stderr || '');
  process.exit(r.status ?? 0);
}

if (cmd === 'prep') {
  const name = process.argv[3];
  const r = spawnSync(process.execPath, [runner, 'payload', name], { encoding: 'utf8' });
  if (r.status !== 0) {
    process.stderr.write(r.stderr || r.stdout || '');
    process.exit(1);
  }
  const payload = JSON.parse(fs.readFileSync(path.join(dir, '_current_mcp_payload.json'), 'utf8'));
  fs.writeFileSync(argsPath, JSON.stringify(payload.arguments));
  console.log(JSON.stringify({ name, queryLen: payload.arguments.query.length }));
  process.exit(0);
}

if (cmd === 'args') {
  const a = JSON.parse(fs.readFileSync(argsPath, 'utf8'));
  process.stdout.write(JSON.stringify(a));
  process.exit(0);
}

console.error('Usage: mark ok|fail NAME [err] | prep NAME | args');
process.exit(1);
