/** Print query from _mcp_calls for MCP execute_sql */
import fs from 'fs';
const name = process.argv[2];
if (!name) {
  console.error('Usage: node get-query.mjs us-0008');
  process.exit(1);
}
const data = JSON.parse(fs.readFileSync(`_mcp_calls/${name}.json`, 'utf8'));
process.stdout.write(data.query);
