/**
 * Execute US batch imports via reading payloads and writing per-file query stubs.
 * Agent calls MCP execute_sql using each stub's query field.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const callDir = join(__dirname, '../supabase/batches/_payloads/_mcp_calls');
const stubDir = join(__dirname, '../supabase/batches/_payloads/_exec_stubs');
const resultsPath = join(__dirname, '../supabase/batches/_payloads/_mcp_results.json');
const projectId = 'igmuuvrjmrgnxadewbec';

const start = parseInt(process.argv[2] ?? '2', 10);
const end = parseInt(process.argv[3] ?? '33', 10);

mkdirSync(stubDir, { recursive: true });

const results = [];
for (let i = start; i <= end; i++) {
  const name = `us-${String(i).padStart(4, '0')}`;
  const payload = JSON.parse(readFileSync(join(callDir, `${name}.json`), 'utf8'));
  const stubPath = join(stubDir, `${name}.json`);
  writeFileSync(stubPath, JSON.stringify({ project_id: projectId, query: payload.query }));
  results.push({ file: `${name}.sql`, status: 'pending' });
}

writeFileSync(resultsPath, JSON.stringify(results, null, 2));
console.log(JSON.stringify({ stubDir, count: results.length, files: results.map((r) => r.file) }));
