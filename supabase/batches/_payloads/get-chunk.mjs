/**
 * Execute all chunks via agent MCP calls.
 * Prints chunk index and SQL length; agent calls execute_sql per chunk.
 * After agent confirms, run: node finalize-chunks.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const chunkDir = path.join(__dirname, '_chunks');
const manifest = JSON.parse(fs.readFileSync(path.join(chunkDir, 'manifest.json'), 'utf8'));

const idx = parseInt(process.argv[2] || '0', 10);
if (idx < 0 || idx >= manifest.length) {
  console.error(`Usage: node get-chunk.mjs <0-${manifest.length - 1}>`);
  process.exit(1);
}

const chunk = manifest[idx];
const sql = fs.readFileSync(path.join(chunkDir, chunk.chunkName), 'utf8');
process.stdout.write(JSON.stringify({
  index: idx,
  chunkName: chunk.chunkName,
  files: chunk.files,
  project_id: chunk.project_id,
  query: sql,
}));
