/**
 * Emit MCP execute_sql invocations for agent (reads _mcp_calls payloads).
 * Usage: node emit-mcp-range.mjs 3 33
 * Prints NDJSON: {"file","project_id","query"}
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const start = parseInt(process.argv[2], 10);
const end = parseInt(process.argv[3], 10);
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '_mcp_calls');

for (let i = start; i <= end; i++) {
  const file = `us-${String(i).padStart(4, '0')}.json`;
  const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  process.stdout.write(JSON.stringify({ file, project_id: data.project_id, query: data.query }) + '\n');
}
