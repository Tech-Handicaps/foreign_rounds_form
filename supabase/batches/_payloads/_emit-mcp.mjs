/**
 * Agent helper: read invoke JSON and print MCP execute_sql args as single-line JSON to stdout.
 * Usage: node _emit-mcp.mjs 8
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const num = parseInt(process.argv[2], 10);
const name = `us-${String(num).padStart(4, '0')}`;
const data = JSON.parse(fs.readFileSync(path.join(dir, '_invoke', `${name}.json`), 'utf8'));
process.stdout.write(JSON.stringify({ project_id: data.project_id, query: data.query }));
