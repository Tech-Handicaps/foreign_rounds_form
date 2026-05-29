/**
 * Agent loop helper: prepare N files, return their _queries paths for MCP.
 * Usage: node batch-mcp-loop.mjs next 4
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const callDir = path.join(dir, '_mcp_calls');
const resultsPath = path.join(dir, '_mcp_results.json');
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';
const START = 2;
const END = 33;

function loadResults() {
  return fs.existsSync(resultsPath) ? JSON.parse(fs.readFileSync(resultsPath, 'utf8')) : [];
}

function pending() {
  const done = new Set(loadResults().filter((r) => r.status === 'success').map((r) => r.file));
  const out = [];
  for (let i = START; i <= END; i++) {
    const file = `us-${String(i).padStart(4, '0')}.sql`;
    if (!done.has(file)) out.push({ num: i, file, name: `us-${String(i).padStart(4, '0')}` });
  }
  return out;
}

const [cmd, nStr] = process.argv.slice(2);

if (cmd === 'next') {
  const n = parseInt(nStr || '1', 10);
  const batch = pending().slice(0, n);
  if (!batch.length) {
    console.log(JSON.stringify({ done: true }));
    process.exit(0);
  }
  const outDir = path.join(dir, '_mcp_next');
  fs.mkdirSync(outDir, { recursive: true });
  for (const b of batch) {
    const payload = JSON.parse(fs.readFileSync(path.join(callDir, `${b.name}.json`), 'utf8'));
    fs.writeFileSync(
      path.join(outDir, `${b.name}.json`),
      JSON.stringify({ file: b.file, project_id: PROJECT_ID, query: payload.query })
    );
  }
  console.log(JSON.stringify({ files: batch.map((b) => b.file), count: batch.length, remaining: pending().length }));
  process.exit(0);
}

if (cmd === 'mark') {
  const file = process.argv[3];
  const status = process.argv[4] || 'success';
  const error = process.argv.slice(5).join(' ');
  const results = loadResults();
  const entry = { file, status, ...(error ? { error } : {}) };
  const idx = results.findIndex((x) => x.file === file);
  if (idx >= 0) results[idx] = entry;
  else results.push(entry);
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log('ok');
  process.exit(0);
}

if (cmd === 'status') {
  const results = loadResults();
  console.log(JSON.stringify({
    success: results.filter((r) => r.status === 'success').length,
    failed: results.filter((r) => r.status === 'error'),
    pending: pending().map((p) => p.file),
  }, null, 2));
  process.exit(0);
}

console.error('Usage: next [N] | mark FILE [success|error] [msg] | status');
process.exit(1);
