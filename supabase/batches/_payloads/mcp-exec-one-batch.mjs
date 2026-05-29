/**
 * Emit MCP execute_sql args for one batch id (stdout JSON one line).
 * Usage: node mcp-exec-one-batch.mjs us-0011
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const name = process.argv[2];
if (!name) {
  console.error('Usage: node mcp-exec-one-batch.mjs us-0011');
  process.exit(1);
}
const payload = JSON.parse(fs.readFileSync(path.join(dir, '_mcp_calls', `${name}.json`), 'utf8'));
const query = payload.query.replace(/\r\n/g, '\n');
process.stdout.write(JSON.stringify({ project_id: 'igmuuvrjmrgnxadewbec', query }));
