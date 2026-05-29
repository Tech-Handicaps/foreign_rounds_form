/**
 * Reads batch payload JSON files and prints MCP execute_sql arguments as NDJSON.
 * Agent reads stdout lines and calls CallMcpTool for each (or batches in parallel).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const payloadDir = join(__dirname, '../supabase/batches/_payloads');
const start = process.argv[2] ?? 'us-0001';
const end = process.argv[3] ?? 'us-0033';

const files = readdirSync(payloadDir)
  .filter((f) => f.endsWith('.json'))
  .sort()
  .filter((f) => f.replace('.json', '') >= start && f.replace('.json', '') <= end);

for (const f of files) {
  const payload = JSON.parse(readFileSync(join(payloadDir, f), 'utf8'));
  console.log(JSON.stringify({ file: f.replace('.json', ''), ...payload }));
}
