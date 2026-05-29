/**
 * Agent helper: read one batch args JSON and print metadata (not full query).
 * Full query must be read by agent from mcp_args/{name}.args.json for CallMcpTool.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const argsDir = path.join(dir, 'mcp_args');
const name = process.argv[2];
if (!name) {
  console.error('Usage: node read-batch-meta.mjs us-0002');
  process.exit(1);
}
const argsPath = path.join(argsDir, `${name}.args.json`);
const { project_id, query } = JSON.parse(fs.readFileSync(argsPath, 'utf8'));
console.log(JSON.stringify({ name, project_id, queryLength: query.length, argsPath }));
