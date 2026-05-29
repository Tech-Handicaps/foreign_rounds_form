/** Emit MCP args for batch range from _invoke JSON files */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const invokeDir = path.join(dir, '_invoke');
const [start, end] = process.argv.slice(2).map(Number);

for (let i = start; i <= end; i++) {
  const name = `us-${String(i).padStart(4, '0')}`;
  const data = JSON.parse(fs.readFileSync(path.join(invokeDir, `${name}.json`), 'utf8'));
  fs.writeFileSync(
    path.join(dir, '_mcp_exec_args', `${name}.json`),
    JSON.stringify({ project_id: data.project_id, query: data.query, file: data.file })
  );
}
console.log(`Prepared ${start}-${end}`);
