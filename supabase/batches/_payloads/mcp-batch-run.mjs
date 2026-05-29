/**
 * Build combined MCP payloads for pending batches (pairs of 2 files ~42KB each).
 * Usage: node mcp-batch-run.mjs build
 * Output: _mcp_run/manifest.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const callDir = path.join(dir, '_mcp_calls');
const resultsPath = path.join(dir, '_mcp_results.json');
const outDir = path.join(dir, '_mcp_run');
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';
const START = 2;
const END = 33;
const PAIR = 2;

function loadResults() {
  return fs.existsSync(resultsPath) ? JSON.parse(fs.readFileSync(resultsPath, 'utf8')) : [];
}

function pending() {
  const done = new Set(loadResults().filter((r) => r.status === 'success').map((r) => r.file));
  const out = [];
  for (let i = START; i <= END; i++) {
    const file = `us-${String(i).padStart(4, '0')}.sql`;
    const name = `us-${String(i).padStart(4, '0')}`;
    if (!done.has(file)) out.push({ num: i, file, name });
  }
  return out;
}

const cmd = process.argv[2];
if (cmd === 'build') {
  fs.mkdirSync(outDir, { recursive: true });
  const all = pending();
  const chunks = [];
  for (let i = 0; i < all.length; i += PAIR) {
    const pair = all.slice(i, i + PAIR);
    const parts = pair.map((p) =>
      JSON.parse(fs.readFileSync(path.join(callDir, `${p.name}.json`), 'utf8')).query.trim()
    );
    const id = `chunk_${pair[0].name}_${pair[pair.length - 1].name}`;
    const payload = { project_id: PROJECT_ID, query: parts.join('\n\n'), files: pair.map((p) => p.file) };
    fs.writeFileSync(path.join(outDir, `${id}.json`), JSON.stringify(payload));
    chunks.push({ id, files: payload.files, len: payload.query.length });
  }
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(chunks, null, 2));
  console.log(JSON.stringify({ chunks: chunks.length, pending: all.length }, null, 2));
  process.exit(0);
}

console.error('Usage: build');
process.exit(1);
