/**
 * Concatenate SQL batch files for grouped MCP execute_sql calls.
 * Usage: node scripts/mcp-combine-batch.mjs <startNum> <endNum>
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const queryDir = join(__dirname, '../supabase/batches/_payloads/_queries');
const projectId = 'igmuuvrjmrgnxadewbec';

const start = parseInt(process.argv[2], 10);
const end = parseInt(process.argv[3], 10);
const files = [];
const parts = [];

for (let i = start; i <= end; i++) {
  const name = `us-${String(i).padStart(4, '0')}`;
  const sql = readFileSync(join(queryDir, `${name}.sql`), 'utf8').trim();
  files.push(`${name}.sql`);
  parts.push(sql);
}

const payload = {
  project_id: projectId,
  query: parts.join('\n\n'),
  files,
};

process.stdout.write(JSON.stringify(payload));
