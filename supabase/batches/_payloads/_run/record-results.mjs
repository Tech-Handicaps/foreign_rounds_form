/**
 * Record batch import results to _mcp_results.json
 * Usage: node record-results.mjs success us-0003.sql
 *        node record-results.mjs error us-0003.sql "message"
 *        node record-results.mjs finalize
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const resultsPath = path.join(root, '_mcp_results.json');
const START = 2;
const END = 33;

function load() {
  return fs.existsSync(resultsPath) ? JSON.parse(fs.readFileSync(resultsPath, 'utf8')) : [];
}

function save(results) {
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
}

const [cmd, file, error] = process.argv.slice(2);

if (cmd === 'finalize') {
  const existing = load();
  const byFile = Object.fromEntries(existing.map((r) => [r.file, r]));
  const merged = [];
  for (let i = START; i <= END; i++) {
    const f = `us-${String(i).padStart(4, '0')}.sql`;
    merged.push(byFile[f] || { file: f, status: 'pending' });
  }
  save(merged);
  console.log(JSON.stringify({
    success: merged.filter((r) => r.status === 'success').length,
    failed: merged.filter((r) => r.status === 'error'),
    total: merged.length,
  }));
} else if (cmd && file) {
  const results = load().filter((r) => r.file !== file);
  results.push({ file, status: cmd, ...(error ? { error } : {}) });
  save(results);
  console.log(`recorded ${file} ${cmd}`);
} else {
  console.error('Usage: success|error FILE [msg] | finalize');
  process.exit(1);
}
