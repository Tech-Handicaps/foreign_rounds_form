/** Prep one batch for agent CallMcpTool. Usage: node prep-batch.mjs us-0003 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const name = process.argv[2];
if (!name) {
  console.error('Usage: node prep-batch.mjs us-XXXX');
  process.exit(1);
}
const runner = path.join(dir, 'mcp-batch-runner.mjs');
const r = spawnSync(process.execPath, [runner, 'payload', name], { encoding: 'utf8' });
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  process.exit(1);
}
const payload = JSON.parse(fs.readFileSync(path.join(dir, '_current_mcp_payload.json'), 'utf8'));
const argsPath = path.join(dir, '_mcp_args_only.json');
fs.writeFileSync(argsPath, JSON.stringify(payload.arguments));
console.log(JSON.stringify({ name, server: payload.server, toolName: payload.toolName, queryLen: payload.arguments.query.length }));
