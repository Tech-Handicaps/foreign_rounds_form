/**
 * Process all pending US batch imports: emit MCP args paths for agent,
 * or with --auto flag read query and print compact status (agent uses CallMcpTool).
 *
 * Usage:
 *   node run-all-pending-mcp.mjs emit-batch 4   -> writes _mcp_parallel/*.json
 *   node run-all-pending-mcp.mjs parse us-0010  -> stdout JSON {project_id,query}
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
    const name = `us-${String(i).padStart(4, '0')}`;
    if (!done.has(file)) out.push({ num: i, file, name });
  }
  return out;
}

const [cmd, arg] = process.argv.slice(2);

if (cmd === 'parse') {
  const name = arg;
  const payload = JSON.parse(fs.readFileSync(path.join(callDir, `${name}.json`), 'utf8'));
  process.stdout.write(JSON.stringify({ project_id: PROJECT_ID, query: payload.query }));
  process.exit(0);
}

if (cmd === 'emit-batch') {
  const n = parseInt(arg || '4', 10);
  const batch = pending().slice(0, n);
  const outDir = path.join(dir, '_mcp_parallel');
  fs.mkdirSync(outDir, { recursive: true });
  for (const b of batch) {
    const payload = JSON.parse(fs.readFileSync(path.join(callDir, `${b.name}.json`), 'utf8'));
    fs.writeFileSync(
      path.join(outDir, `${b.name}.json`),
      JSON.stringify({ file: b.file, project_id: PROJECT_ID, query: payload.query })
    );
  }
  console.log(JSON.stringify(batch.map((b) => b.name)));
  process.exit(0);
}

if (cmd === 'list-pending') {
  console.log(JSON.stringify(pending().map((p) => p.name)));
  process.exit(0);
}

console.error('Usage: parse NAME | emit-batch N | list-pending');
process.exit(1);
