/**
 * Prep one batch for agent CallMcpTool (execute_sql).
 * Usage: node run-agent-batch.mjs us-0009
 * Writes _call_args.json; agent reads and calls CallMcpTool, then:
 *   node run-mcp-loop.mjs done us-0009 ok
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const name = process.argv[2];
if (!name) {
  console.error('Usage: node run-agent-batch.mjs us-0009');
  process.exit(1);
}
const r = spawnSync(process.execPath, [path.join(dir, 'prep-call-args.mjs'), name], {
  encoding: 'utf8',
});
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  process.exit(1);
}
const args = JSON.parse(fs.readFileSync(path.join(dir, '_call_args.json'), 'utf8'));
console.log(JSON.stringify({ batch: name, project_id: args.project_id, query_len: args.query.length }));
