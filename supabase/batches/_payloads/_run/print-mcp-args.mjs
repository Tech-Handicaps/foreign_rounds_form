/**
 * Agent helper: print MCP args JSON for a batch file number (2-33).
 * Usage: node print-mcp-args.mjs 3
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const num = Number(process.argv[2]);
if (!num || num < 2 || num > 33) {
  console.error('Usage: node print-mcp-args.mjs NUM (2-33)');
  process.exit(1);
}
const name = `us-${String(num).padStart(4, '0')}`;
const argsPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'out',
  `${name}.args.json`
);
const fallback = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '_mcp_calls',
  `${name}.json`
);
const src = fs.existsSync(argsPath) ? argsPath : fallback;
const payload = JSON.parse(fs.readFileSync(src, 'utf8'));
process.stdout.write(JSON.stringify({
  file: `${name}.sql`,
  project_id: payload.project_id || 'igmuuvrjmrgnxadewbec',
  query: payload.query,
}));
