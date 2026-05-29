/**
 * Run us-0002..us-0033 batch imports by reading _mcp_calls payloads.
 * Outputs one JSON line per file for agent CallMcpTool loop:
 *   {"file":"us-0002.sql","project_id":"...","query":"..."}
 *
 * Usage:
 *   node run-batch-import-loop.mjs --next     # print next pending payload JSON
 *   node run-batch-import-loop.mjs --done FILE [error]
 *   node run-batch-import-loop.mjs --status
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, '..');
const callDir = path.join(root, '_mcp_calls');
const statePath = path.join(root, '_run', '_batch_state.json');
const resultsPath = path.join(root, '_mcp_results.json');
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';
const START = 2;
const END = 33;

function loadState() {
  if (!fs.existsSync(statePath)) return { next: START, results: [] };
  return JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

function saveState(state) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function finalizeResults(results) {
  const expected = [];
  for (let i = START; i <= END; i++) expected.push(`us-${String(i).padStart(4, '0')}.sql`);
  const byFile = Object.fromEntries(results.map((r) => [r.file, r]));
  const merged = expected.map((file) => byFile[file] || { file, status: 'pending' });
  fs.writeFileSync(resultsPath, JSON.stringify(merged, null, 2));
  return merged;
}

function loadPayload(num) {
  const name = `us-${String(num).padStart(4, '0')}`;
  const payload = JSON.parse(fs.readFileSync(path.join(callDir, `${name}.json`), 'utf8'));
  return { file: `${name}.sql`, project_id: PROJECT_ID, query: payload.query };
}

const cmd = process.argv[2];

if (cmd === '--next') {
  const state = loadState();
  if (state.next > END) {
    console.log(JSON.stringify({ done: true }));
    process.exit(0);
  }
  const payload = loadPayload(state.next);
  console.log(JSON.stringify(payload));
} else if (cmd === '--done') {
  const file = process.argv[3];
  const error = process.argv[4];
  const state = loadState();
  state.results = state.results.filter((r) => r.file !== file);
  state.results.push({ file, status: error ? 'error' : 'success', ...(error ? { error } : {}) });
  state.next = Math.max(state.next, parseInt(file.match(/us-(\d+)/)[1], 10) + 1);
  saveState(state);
  finalizeResults(state.results);
  console.log(JSON.stringify({ next: state.next, file, status: error ? 'error' : 'success' }));
} else if (cmd === '--status') {
  const state = loadState();
  const merged = finalizeResults(state.results);
  console.log(JSON.stringify({
    next: state.next,
    success: merged.filter((r) => r.status === 'success').length,
    failed: merged.filter((r) => r.status === 'error'),
    total: END - START + 1,
  }));
} else if (cmd === '--reset') {
  saveState({ next: START, results: [] });
  console.log('reset');
} else {
  console.error('Usage: --next | --done FILE [error] | --status | --reset');
  process.exit(1);
}
