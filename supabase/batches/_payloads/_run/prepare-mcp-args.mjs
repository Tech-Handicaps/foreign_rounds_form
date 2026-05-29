/**
 * Run us-0001..us-0033 via agent CallMcpTool (execute_sql).
 * Outputs one MCP args JSON per file for sequential agent calls.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const payloadDir = path.join(dir, '..');
const outDir = path.join(dir, 'mcp_args');
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';

const start = parseInt(process.argv[2] || '1', 10);
const end = parseInt(process.argv[3] || '33', 10);

fs.mkdirSync(outDir, { recursive: true });

const files = [];
for (let i = start; i <= end; i++) {
  const name = `us-${String(i).padStart(4, '0')}`;
  const payload = JSON.parse(fs.readFileSync(path.join(payloadDir, `${name}.json`), 'utf8'));
  const args = { project_id: PROJECT_ID, query: payload.query };
  const outPath = path.join(outDir, `${name}.args.json`);
  fs.writeFileSync(outPath, JSON.stringify(args));
  files.push(name);
}
console.log(JSON.stringify(files));
