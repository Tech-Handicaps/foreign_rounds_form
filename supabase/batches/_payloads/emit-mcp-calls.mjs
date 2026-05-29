/**
 * Run MCP batch imports for files start..end by reading _invoke JSON files.
 * Outputs one JSON line per file: {file, project_id, query}
 * Agent calls execute_sql for each line.
 *
 * Usage: node emit-mcp-calls.mjs 3 33
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const start = parseInt(process.argv[2], 10);
const end = parseInt(process.argv[3], 10);
const invokeDir = path.join(__dirname, '_invoke');

for (let i = start; i <= end; i++) {
  const name = `us-${String(i).padStart(4, '0')}`;
  const data = JSON.parse(fs.readFileSync(path.join(invokeDir, `${name}.json`), 'utf8'));
  process.stdout.write(JSON.stringify(data) + '\n');
}
