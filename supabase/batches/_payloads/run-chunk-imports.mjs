/**
 * Prepare chunk MCP payloads from _mcp_run/manifest.json.
 * Usage: node run-chunk-imports.mjs [chunk_id ...]
 * Outputs NDJSON lines: {chunk_id, project_id, query, files}
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(dir, '_mcp_run', 'manifest.json'), 'utf8'));
const ids = process.argv.slice(2);
const chunks = ids.length ? manifest.filter((c) => ids.includes(c.id)) : manifest;

for (const c of chunks) {
  const p = JSON.parse(fs.readFileSync(path.join(dir, '_mcp_run', `${c.id}.json`), 'utf8'));
  console.log(JSON.stringify({ chunk_id: c.id, project_id: p.project_id, query: p.query, files: c.files }));
}
