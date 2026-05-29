/**
 * Execute remaining US batch imports via MCP execute_sql.
 * Reads payload JSON files and writes incremental results.
 * Run from agent context: processes files sequentially using CallMcpTool pattern.
 *
 * This script outputs each file's MCP arguments as NDJSON for batch processing.
 * Usage: node scripts/emit-mcp-batch.mjs [start] [end]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const callDir = join(__dirname, '../supabase/batches/_payloads/_mcp_calls');
const resultsPath = join(__dirname, '../supabase/batches/_payloads/_mcp_results.json');
const projectId = 'igmuuvrjmrgnxadewbec';

const start = parseInt(process.argv[2] ?? '3', 10);
const end = parseInt(process.argv[3] ?? '33', 10);

function loadResults() {
  if (!existsSync(resultsPath)) return [];
  return JSON.parse(readFileSync(resultsPath, 'utf8'));
}

function saveResults(results) {
  writeFileSync(resultsPath, JSON.stringify(results, null, 2));
}

function loadPayload(num) {
  const name = `us-${String(num).padStart(4, '0')}`;
  const payload = JSON.parse(readFileSync(join(callDir, `${name}.json`), 'utf8'));
  return { file: `${name}.sql`, project_id: projectId, query: payload.query };
}

// Emit NDJSON for agent to process via CallMcpTool
for (let i = start; i <= end; i++) {
  const payload = loadPayload(i);
  console.log(JSON.stringify(payload));
}
