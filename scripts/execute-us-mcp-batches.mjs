/**
 * Reads MCP call payloads and prints NDJSON lines for agent to invoke execute_sql.
 * Usage: node scripts/execute-us-mcp-batches.mjs [start] [end]
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const callDir = join(__dirname, '../supabase/batches/_payloads/_mcp_calls');
const resultsPath = join(__dirname, '../supabase/batches/_payloads/_mcp_results.json');

const start = process.argv[2] ?? 'us-0001';
const end = process.argv[3] ?? 'us-0033';

const files = readdirSync(callDir)
  .filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  .sort()
  .filter((f) => f.replace('.json', '') >= start && f.replace('.json', '') <= end);

const results = [];
for (const f of files) {
  const file = f.replace('.json', '');
  const payload = JSON.parse(readFileSync(join(callDir, f), 'utf8'));
  results.push({ file, project_id: payload.project_id, queryLength: payload.query.length });
}

writeFileSync(resultsPath, JSON.stringify(results, null, 2));
console.log(JSON.stringify({ count: results.length, files: results.map((r) => r.file) }));
