/**
 * Read batch JSON files and output MCP-ready args for agent.
 * Usage: node mcp-run-batch.mjs us-0005 us-0006 ...
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const names = process.argv.slice(2);
for (const name of names) {
  const p = path.join(dir, '_batch_ready', `${name}.json`);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  console.log(JSON.stringify({ name, queryLen: data.query.length, project_id: data.project_id }));
}
