/**
 * Reads _emit/*.args.json and writes per-file MCP invocation payloads.
 * Usage: node run-mcp-imports.mjs --record us-0002.sql success [error]
 *        node run-mcp-imports.mjs --summary
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const emitDir = path.join(dir, '_emit');
const resultsPath = path.join(dir, '_mcp_results.json');
const START = 2;
const END = 33;

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

const [cmd, ...rest] = process.argv.slice(2);

if (cmd === '--record') {
  const [file, status, ...errParts] = rest;
  record(file, status, errParts.join(' ') || undefined);
  console.log(`recorded ${file}: ${status}`);
  process.exit(0);
}

if (cmd === '--get') {
  const num = parseInt(rest[0], 10);
  const name = `us-${String(num).padStart(4, '0')}`;
  const args = JSON.parse(fs.readFileSync(path.join(emitDir, `${name}.args.json`), 'utf8'));
  process.stdout.write(JSON.stringify({ file: `${name}.sql`, ...args }));
  process.exit(0);
}

if (cmd === '--summary') {
  const results = loadResults();
  const ok = results.filter((r) => r.status === 'success').length;
  const fail = results.filter((r) => r.status === 'error');
  console.log(JSON.stringify({ total: results.length, success: ok, failed: fail }, null, 2));
  process.exit(0);
}

if (cmd === '--pending') {
  for (let i = START; i <= END; i++) {
    const file = `us-${String(i).padStart(4, '0')}.sql`;
    const results = loadResults();
    if (!results.find((r) => r.file === file && r.status === 'success')) {
      console.log(i);
      process.exit(0);
    }
  }
  console.log('ALL_DONE');
  process.exit(0);
}

console.error('Usage: --get N | --record file status [error] | --pending | --summary');
process.exit(1);
