/**
 * Execute remaining batch imports via MCP in chunks of N files.
 * Concatenates SQL per chunk, records per-file success on chunk OK.
 *
 * Usage: node run-chunked-imports.mjs --chunk 4 --start 3 --end 33
 * Agent must call execute_sql for each chunk SQL emitted.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, '_temp_queries');
const chunkDir = path.join(__dirname, '_chunks');
const resultsPath = path.join(__dirname, '_mcp_results.json');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, v, i, arr) => {
    if (v.startsWith('--')) acc.push([v.slice(2), arr[i + 1]]);
    return acc;
  }, [])
);

const chunkSize = parseInt(args.chunk || '4', 10);
const start = parseInt(args.start || '3', 10);
const end = parseInt(args.end || '33', 10);

function loadResults() {
  return fs.existsSync(resultsPath) ? JSON.parse(fs.readFileSync(resultsPath, 'utf8')) : [];
}

function saveResults(r) {
  fs.writeFileSync(resultsPath, JSON.stringify(r, null, 2));
}

function record(file, status, error) {
  const results = loadResults();
  const entry = { file, status, ...(error ? { error } : {}) };
  const idx = results.findIndex((x) => x.file === file);
  if (idx >= 0) results[idx] = entry;
  else results.push(entry);
  saveResults(results);
}

if (args.cmd === 'record-chunk') {
  const files = args.files.split(',');
  const status = args.status;
  const error = args.error;
  for (const f of files) record(f, status, error);
  console.log(`recorded chunk ${files.join(',')} as ${status}`);
  process.exit(0);
}

fs.mkdirSync(chunkDir, { recursive: true });
const chunks = [];
for (let i = start; i <= end; i += chunkSize) {
  const files = [];
  let sql = '';
  for (let j = i; j < i + chunkSize && j <= end; j++) {
    const name = `us-${String(j).padStart(4, '0')}`;
    files.push(`${name}.sql`);
    sql += fs.readFileSync(path.join(tempDir, `${name}.sql`), 'utf8') + '\n';
  }
  const chunkName = `chunk-${String(i).padStart(4, '0')}-${String(Math.min(i + chunkSize - 1, end)).padStart(4, '0')}.sql`;
  fs.writeFileSync(path.join(chunkDir, chunkName), sql);
  chunks.push({ chunkName, files, sqlLen: sql.length, project_id: 'igmuuvrjmrgnxadewbec' });
}

fs.writeFileSync(path.join(chunkDir, 'manifest.json'), JSON.stringify(chunks, null, 2));
console.log(JSON.stringify({ chunks: chunks.length, totalFiles: chunks.reduce((n, c) => n + c.files.length, 0) }, null, 2));
