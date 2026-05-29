/**
 * Reads payload JSON files and outputs queries for MCP execution.
 * Usage: node mcp-exec-runner.mjs <start> <end>
 * Outputs JSON array: [{ file, query }]
 */
import fs from 'fs';
import path from 'path';

const start = parseInt(process.argv[2], 10);
const end = parseInt(process.argv[3], 10);
const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const callsDir = path.join(dir, '_mcp_calls');
const out = [];

for (let i = start; i <= end; i++) {
  const name = `us-${String(i).padStart(4, '0')}`;
  const data = JSON.parse(fs.readFileSync(path.join(callsDir, `${name}.json`), 'utf8'));
  out.push({ file: `${name}.sql`, query: data.query });
}

process.stdout.write(JSON.stringify(out));
