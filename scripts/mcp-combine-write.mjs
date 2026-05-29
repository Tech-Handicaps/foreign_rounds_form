/** Write combined batch to _combined_payload.json for MCP execute_sql */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const queryDir = join(__dirname, '../supabase/batches/_payloads/_queries');
const outPath = join(__dirname, '../supabase/batches/_payloads/_combined_payload.json');
const projectId = 'igmuuvrjmrgnxadewbec';

const start = parseInt(process.argv[2], 10);
const end = parseInt(process.argv[3], 10);
const files = [];
const parts = [];

for (let i = start; i <= end; i++) {
  const name = `us-${String(i).padStart(4, '0')}`;
  parts.push(readFileSync(join(queryDir, `${name}.sql`), 'utf8').trim());
  files.push(`${name}.sql`);
}

writeFileSync(
  outPath,
  JSON.stringify({ project_id: projectId, query: parts.join('\n\n'), files })
);
console.log(JSON.stringify({ files, queryLen: parts.join('\n\n').length, outPath }));
