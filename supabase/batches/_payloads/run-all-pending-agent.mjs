/**
 * Print next pending batch id for agent MCP loop.
 * Usage: node run-all-pending-agent.mjs next-id
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const resultsPath = path.join(dir, '_mcp_results.json');
const callDir = path.join(dir, '_mcp_calls');
const START = 2;
const END = 33;

function pending() {
  const results = fs.existsSync(resultsPath) ? JSON.parse(fs.readFileSync(resultsPath, 'utf8')) : [];
  const done = new Set(results.filter((r) => r.status === 'success').map((r) => r.file));
  const out = [];
  for (let i = START; i <= END; i++) {
    const file = `us-${String(i).padStart(4, '0')}.sql`;
    if (!done.has(file)) out.push({ num: i, file, name: `us-${String(i).padStart(4, '0')}` });
  }
  return out;
}

const cmd = process.argv[2];
if (cmd === 'next-id') {
  const next = pending()[0];
  if (!next) {
    console.log('ALL_DONE');
    process.exit(0);
  }
  console.log(next.name);
  process.exit(0);
}

if (cmd === 'write-exec') {
  const name = process.argv[3];
  const payload = JSON.parse(fs.readFileSync(path.join(callDir, `${name}.json`), 'utf8'));
  const args = { project_id: 'igmuuvrjmrgnxadewbec', query: payload.query.replace(/\r\n/g, '\n') };
  fs.writeFileSync(path.join(dir, '_mcp_exec_args.json'), JSON.stringify(args));
  console.log(JSON.stringify({ name, file: `${name}.sql`, len: args.query.length }));
  process.exit(0);
}

console.error('Usage: next-id | write-exec us-NNNN');
process.exit(1);
