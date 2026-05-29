/** Load MCP payloads for a numeric range. Usage: node batch-load.mjs 2 5 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const start = parseInt(process.argv[2], 10);
const end = parseInt(process.argv[3], 10);
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '_mcp_calls');

const out = [];
for (let i = start; i <= end; i++) {
  const file = `us-${String(i).padStart(4, '0')}.json`;
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  out.push({ file, project_id: data.project_id, query: data.query });
}
process.stdout.write(JSON.stringify(out));
