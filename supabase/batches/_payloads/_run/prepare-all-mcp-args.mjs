/**
 * Prepare MCP args files for us-0002..us-0033 and run via agent CallMcpTool.
 * node prepare-all-mcp-args.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, '..');
const callDir = path.join(root, '_mcp_calls');
const argsDir = path.join(root, '_run', 'mcp_args');
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';

fs.mkdirSync(argsDir, { recursive: true });

for (let i = 2; i <= 33; i++) {
  const name = `us-${String(i).padStart(4, '0')}`;
  const payload = JSON.parse(fs.readFileSync(path.join(callDir, `${name}.json`), 'utf8'));
  fs.writeFileSync(
    path.join(argsDir, `${name}.json`),
    JSON.stringify({ project_id: PROJECT_ID, query: payload.query, file: `${name}.sql` })
  );
}

console.log('Prepared 32 MCP arg files in', argsDir);
