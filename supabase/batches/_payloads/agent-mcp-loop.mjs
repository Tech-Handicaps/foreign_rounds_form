/**
 * Execute us-0002..us-0033 by reading _mcp_calls payloads.
 * Outputs JSON summary to stdout. Used with agent CallMcpTool loop OR direct HTTP MCP.
 *
 * Agent mode: node agent-mcp-loop.mjs emit 2 5  -> prints files to execute
 *             (agent calls CallMcpTool for each, then: node agent-mcp-loop.mjs record ...)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const callDir = path.join(__dirname, '_mcp_calls');
const statePath = path.join(__dirname, '_agent_mcp_state.json');

function loadPayload(num) {
  const file = `us-${String(num).padStart(4, '0')}.json`;
  const data = JSON.parse(fs.readFileSync(path.join(callDir, file), 'utf8'));
  return { file, project_id: data.project_id, query: data.query };
}

function loadState() {
  if (fs.existsSync(statePath)) return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  return { results: [] };
}

function saveState(s) {
  fs.writeFileSync(statePath, JSON.stringify(s, null, 2));
}

const [cmd, a, b] = process.argv.slice(2);

if (cmd === 'payload') {
  const num = parseInt(a, 10);
  console.log(JSON.stringify(loadPayload(num)));
  process.exit(0);
}

if (cmd === 'range') {
  const start = parseInt(a, 10);
  const end = parseInt(b, 10);
  const out = [];
  for (let i = start; i <= end; i++) out.push(loadPayload(i));
  console.log(JSON.stringify(out));
  process.exit(0);
}

if (cmd === 'record') {
  const state = loadState();
  state.results.push({ file: a, status: b, ...(process.argv[4] ? { error: process.argv[4] } : {}) });
  saveState(state);
  console.log(JSON.stringify({ recorded: a, status: b }));
  process.exit(0);
}

if (cmd === 'init') {
  saveState({ results: [] });
  console.log('initialized');
  process.exit(0);
}

if (cmd === 'summary') {
  const state = loadState();
  const success = state.results.filter((r) => r.status === 'success').length;
  const failed = state.results.filter((r) => r.status === 'error');
  console.log(JSON.stringify({ success, failed, total: state.results.length }));
  process.exit(0);
}

console.error('Usage: init | payload N | range START END | record FILE success|error [msg] | summary');
