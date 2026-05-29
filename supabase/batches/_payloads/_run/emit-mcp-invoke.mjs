/** Write _mcp_invoke.json for agent CallMcpTool. Usage: node emit-mcp-invoke.mjs us-0008 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const name = process.argv[2];
if (!name) process.exit(1);
const r = spawnSync(process.execPath, [path.join(dir, 'load-mcp-args.mjs'), name, '--write'], {
  encoding: 'utf8',
});
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  process.exit(1);
}
const exec = JSON.parse(fs.readFileSync(path.join(dir, '_exec_now.json'), 'utf8'));
const out = { project_id: exec.project_id, query: exec.query };
fs.writeFileSync(path.join(dir, '_mcp_invoke.json'), JSON.stringify(out), 'utf8');
console.log('READY', name, out.query.length);
