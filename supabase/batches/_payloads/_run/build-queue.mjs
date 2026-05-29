/**
 * Prepare batches us-0006..us-0033 for agent MCP loop.
 * Writes queue file with batch names and args paths.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const runner = path.join(dir, 'mcp-batch-runner.mjs');
const queuePath = path.join(dir, '_batch_queue.json');
const start = parseInt(process.argv[2] ?? '6', 10);
const end = parseInt(process.argv[3] ?? '33', 10);
const queue = [];

for (let i = start; i <= end; i++) {
  const name = `us-${String(i).padStart(4, '0')}`;
  const r = spawnSync(process.execPath, [runner, 'payload', name], { encoding: 'utf8' });
  if (r.status !== 0) {
    console.error(`FAIL prep ${name}`, r.stderr || r.stdout);
    process.exit(1);
  }
  const payload = JSON.parse(fs.readFileSync(path.join(dir, '_current_mcp_payload.json'), 'utf8'));
  const argsPath = path.join(dir, 'mcp_args', `${name}.args.json`);
  fs.mkdirSync(path.dirname(argsPath), { recursive: true });
  fs.writeFileSync(argsPath, JSON.stringify(payload.arguments, null, 2));
  queue.push({ name, argsPath, queryLen: payload.arguments.query.length });
  console.log('QUEUED', name, payload.arguments.query.length);
}
fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));
console.log('DONE', queue.length);
