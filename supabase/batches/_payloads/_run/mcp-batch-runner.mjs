/**
 * Emit next MCP execute_sql payload for agent CallMcpTool loop.
 * Usage:
 *   node mcp-batch-runner.mjs next
 *   node mcp-batch-runner.mjs payload us-0010  -> writes _current_mcp_payload.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const payloadDir = path.join(dir, '..');
const argsDir = path.join(dir, 'mcp_args');
const statePath = path.join(dir, 'import-progress.json');
const outPath = path.join(dir, '_current_mcp_payload.json');
const START = 1;
const END = 33;

function loadState() {
  if (!fs.existsSync(statePath)) return { completed: {}, failed: {} };
  return JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

function batchName(i) {
  return `us-${String(i).padStart(4, '0')}`;
}

function nextPending() {
  const s = loadState();
  for (let i = START; i <= END; i++) {
    const name = batchName(i);
    if (!s.completed[name] && !s.failed[name]) return name;
  }
  return null;
}

function loadPayload(name) {
  const toolPath = path.join(payloadDir, `_mcp_tool_${name}.json`);
  if (fs.existsSync(toolPath)) {
    const t = JSON.parse(fs.readFileSync(toolPath, 'utf8'));
    return {
      server: t.server || 'plugin-supabase-supabase',
      toolName: t.toolName || 'execute_sql',
      arguments: t.arguments || { project_id: 'igmuuvrjmrgnxadewbec', query: t.query },
    };
  }
  const argsPath = path.join(argsDir, `${name}.args.json`);
  const payloadPath = path.join(payloadDir, `${name}.json`);
  const src = fs.existsSync(argsPath) ? argsPath : payloadPath;
  const data = JSON.parse(fs.readFileSync(src, 'utf8'));
  return {
    server: 'plugin-supabase-supabase',
    toolName: 'execute_sql',
    arguments: {
      project_id: data.project_id || 'igmuuvrjmrgnxadewbec',
      query: data.query,
    },
  };
}

const cmd = process.argv[2];
if (cmd === 'next') {
  console.log(nextPending() || 'DONE');
  process.exit(0);
}

if (cmd === 'payload') {
  const name = process.argv[3];
  const p = loadPayload(name);
  fs.writeFileSync(outPath, JSON.stringify(p, null, 2), 'utf8');
  console.log('PAYLOAD', name, p.arguments.query.length);
  process.exit(0);
}

console.error('Usage: next | payload NAME');
process.exit(1);
