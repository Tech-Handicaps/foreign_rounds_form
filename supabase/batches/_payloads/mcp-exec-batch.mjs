/**
 * Emit one MCP execute_sql payload per line (NDJSON) for agent CallMcpTool.
 * Usage: node mcp-exec-batch.mjs us-0010 us-0011 ...
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const callDir = path.join(dir, '_mcp_calls');
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';

const names = process.argv.slice(2);
if (!names.length) {
  console.error('Usage: node mcp-exec-batch.mjs us-0010 ...');
  process.exit(1);
}

for (const name of names) {
  const payload = JSON.parse(fs.readFileSync(path.join(callDir, `${name}.json`), 'utf8'));
  console.log(JSON.stringify({ project_id: PROJECT_ID, query: payload.query }));
}
