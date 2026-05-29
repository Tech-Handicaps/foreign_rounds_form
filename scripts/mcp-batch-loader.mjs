/**
 * Execute all US batch imports (us-0002..us-0033) by reading payload JSON files
 * and writing incremental results. SQL is loaded from _mcp_calls payloads.
 *
 * This script prepares batch execution data; MCP execute_sql calls are made
 * by the agent using CallMcpTool with each entry's project_id and query.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const callDir = join(__dirname, '../supabase/batches/_payloads/_mcp_calls');
const resultsPath = join(__dirname, '../supabase/batches/_payloads/_mcp_results.json');
const projectId = 'igmuuvrjmrgnxadewbec';

const start = parseInt(process.argv[2] ?? '2', 10);
const end = parseInt(process.argv[3] ?? '33', 10);
const index = process.argv[4] ? parseInt(process.argv[4], 10) : null;

function loadPayload(num) {
  const name = `us-${String(num).padStart(4, '0')}`;
  const payload = JSON.parse(readFileSync(join(callDir, `${name}.json`), 'utf8'));
  return { file: `${name}.sql`, project_id: projectId, query: payload.query };
}

if (index !== null) {
  // Output single payload for MCP call
  console.log(JSON.stringify(loadPayload(index)));
} else {
  // List all files
  const files = [];
  for (let i = start; i <= end; i++) {
    files.push(loadPayload(i).file);
  }
  console.log(JSON.stringify({ start, end, count: files.length, files }));
}
