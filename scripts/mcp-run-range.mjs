/**
 * Run MCP execute_sql for a range via node reading payloads.
 * Outputs one JSON line per file for agent CallMcpTool batching.
 * Usage: node scripts/mcp-run-range.mjs list 5 8
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const callDir = join(__dirname, '../supabase/batches/_payloads/_mcp_calls');
const projectId = 'igmuuvrjmrgnxadewbec';

function load(num) {
  const name = `us-${String(num).padStart(4, '0')}`;
  const payload = JSON.parse(readFileSync(join(callDir, `${name}.json`), 'utf8'));
  return { file: `${name}.sql`, project_id: projectId, query: payload.query };
}

const cmd = process.argv[2];
const start = parseInt(process.argv[3], 10);
const end = parseInt(process.argv[4], 10);

if (cmd === 'list') {
  for (let i = start; i <= end; i++) {
    const p = load(i);
    console.log(JSON.stringify({ num: i, file: p.file, queryLen: p.query.length }));
  }
} else if (cmd === 'get') {
  const num = parseInt(process.argv[3], 10);
  console.log(JSON.stringify(load(num)));
}
