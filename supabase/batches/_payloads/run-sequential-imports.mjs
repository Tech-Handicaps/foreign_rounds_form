/**
 * Execute all remaining invoke files (3-33) sequentially via MCP execute_sql.
 * Reads _invoke/*.json and writes _mcp_results.json.
 *
 * This script prepares each call; run with --emit N to print MCP args JSON for file N.
 * Agent calls execute_sql, then: node run-sequential-imports.mjs --done N [errorMsg]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const invokeDir = path.join(__dirname, '_invoke');
const resultsPath = path.join(__dirname, '_mcp_results.json');
const START = 3;
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

const cmd = process.argv[2];
const num = parseInt(process.argv[3], 10);

if (cmd === '--emit') {
  const name = `us-${String(num).padStart(4, '0')}`;
  const data = JSON.parse(fs.readFileSync(path.join(invokeDir, `${name}.json`), 'utf8'));
  process.stdout.write(JSON.stringify({ file: data.file, project_id: data.project_id, query: data.query }));
  process.exit(0);
}

if (cmd === '--done') {
  const name = `us-${String(num).padStart(4, '0')}`;
  const file = `${name}.sql`;
  const error = process.argv[4];
  record(file, error ? 'error' : 'success', error);
  console.log(`recorded ${file}`);
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

if (cmd === '--finalize') {
  const results = loadResults();
  results.sort((a, b) => a.file.localeCompare(b.file));
  saveResults(results);
  const ok = results.filter((r) => r.status === 'success').length;
  console.log(JSON.stringify({ total: results.length, success: ok, failed: results.filter((r) => r.status === 'error') }, null, 2));
  process.exit(0);
}

console.error('Usage: --emit N | --done N [error] | --next | --finalize');
process.exit(1);
