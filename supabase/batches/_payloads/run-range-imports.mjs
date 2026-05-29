/**
 * Run MCP execute_sql for emit files in a numeric range.
 * Writes per-file status to _range_results.json
 * Agent must use CallMcpTool — this script only prepares slot files.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = parseInt(process.argv[2] || '10', 10);
const end = parseInt(process.argv[3] || '33', 10);
const slotDir = path.join(dir, '_mcp_slot');
fs.mkdirSync(slotDir, { recursive: true });

const files = [];
for (let n = start; n <= end; n++) {
  const emitPath = path.join(dir, '_emit', `call-${n}.json`);
  const j = JSON.parse(fs.readFileSync(emitPath, 'utf8'));
  const slotPath = path.join(slotDir, `${n}.json`);
  fs.writeFileSync(slotPath, JSON.stringify({ project_id: j.project_id, query: j.query }));
  files.push({ n, file: `us-${String(n).padStart(4, '0')}.sql`, slotPath, queryLen: j.query.length });
}
console.log(JSON.stringify(files, null, 2));
