/**
 * Read _mcp_calls payloads for us-0002..us-0033 and write per-file args for agent MCP calls.
 * Usage: node exec-range-2-33.mjs prepare | node exec-range-2-33.mjs next | node exec-range-2-33.mjs record <file> <success|error> [msg]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const callDir = path.join(__dirname, '_mcp_calls');
const statePath = path.join(__dirname, '_exec_state.json');
const resultsPath = path.join(__dirname, '_exec_results_2_33.json');
const currentPath = path.join(__dirname, '_exec_current.json');

const FILES = Array.from({ length: 32 }, (_, i) => `us-${String(i + 2).padStart(4, '0')}.json`);

function loadState() {
  if (fs.existsSync(statePath)) return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  return { index: 0, results: [] };
}

function saveState(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

const cmd = process.argv[2];

if (cmd === 'prepare') {
  saveState({ index: 0, results: [] });
  fs.writeFileSync(resultsPath, '[]');
  console.log(JSON.stringify({ files: FILES.length, range: [FILES[0], FILES[FILES.length - 1]] }));
  process.exit(0);
}

if (cmd === 'next') {
  const state = loadState();
  if (state.index >= FILES.length) {
    console.log(JSON.stringify({ done: true, results: state.results }));
    process.exit(0);
  }
  const file = FILES[state.index];
  const payload = JSON.parse(fs.readFileSync(path.join(callDir, file), 'utf8'));
  fs.writeFileSync(
    currentPath,
    JSON.stringify({ file, project_id: payload.project_id, query: payload.query })
  );
  console.log(JSON.stringify({ file, index: state.index + 1, total: FILES.length, currentPath }));
  process.exit(0);
}

if (cmd === 'record') {
  const file = process.argv[3];
  const status = process.argv[4];
  const error = process.argv[5];
  const state = loadState();
  const entry = { file, status, ...(error ? { error } : {}) };
  state.results.push(entry);
  if (state.results[state.results.length - 1]?.file === file) {
    // ok
  }
  state.index += 1;
  saveState(state);
  fs.writeFileSync(resultsPath, JSON.stringify(state.results, null, 2));
  console.log(JSON.stringify({ recorded: file, status, nextIndex: state.index }));
  process.exit(0);
}

if (cmd === 'summary') {
  const state = loadState();
  const success = state.results.filter((r) => r.status === 'success').length;
  const failed = state.results.filter((r) => r.status === 'error');
  console.log(JSON.stringify({ success, failed, total: state.results.length }));
  process.exit(0);
}

console.error('Usage: prepare | next | record <file> <success|error> [msg] | summary');
