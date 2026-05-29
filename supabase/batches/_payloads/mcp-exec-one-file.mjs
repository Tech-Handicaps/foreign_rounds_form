/**
 * Execute one batch via reading _emit args and writing MCP args for agent.
 * Agent reads _last_mcp_args.json and calls execute_sql, then:
 *   node mcp-exec-one-file.mjs --done 5 [error]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const emitDir = path.join(dir, '_emit');
const lastArgsPath = path.join(dir, '_last_mcp_args.json');
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

const [cmd, arg] = process.argv.slice(2);

if (cmd === '--prepare') {
  const num = parseInt(arg, 10);
  const name = `us-${String(num).padStart(4, '0')}`;
  const args = JSON.parse(fs.readFileSync(path.join(emitDir, `${name}.args.json`), 'utf8'));
  fs.writeFileSync(lastArgsPath, JSON.stringify({ file: `${name}.sql`, ...args }));
  console.log(JSON.stringify({ file: `${name}.sql`, queryLen: args.query.length }));
  process.exit(0);
}

if (cmd === '--done') {
  const num = parseInt(arg, 10);
  const name = `us-${String(num).padStart(4, '0')}`;
  const error = process.argv[4];
  record(`${name}.sql`, error ? 'error' : 'success', error);
  console.log(`recorded ${name}.sql`);
  process.exit(0);
}

if (cmd === '--next') {
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

if (cmd === '--summary') {
  const results = loadResults();
  const ok = results.filter((r) => r.status === 'success').length;
  const fail = results.filter((r) => r.status === 'error');
  console.log(JSON.stringify({ total: results.length, success: ok, failed: fail }, null, 2));
  process.exit(0);
}

console.error('Usage: --prepare N | --done N [error] | --next | --summary');
process.exit(1);
