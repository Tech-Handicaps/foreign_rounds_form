/** Extract query from _mcp_next JSON to _current_query.sql for MCP CallMcpTool */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const name = process.argv[2];
if (!name) {
  console.error('Usage: node extract-query.mjs us-0007');
  process.exit(1);
}
const src = path.join(dir, '_mcp_next', `${name}.json`);
const data = JSON.parse(fs.readFileSync(src, 'utf8'));
fs.writeFileSync(path.join(dir, '_current_query.sql'), data.query);
console.log(JSON.stringify({ file: data.file, len: data.query.length }));
