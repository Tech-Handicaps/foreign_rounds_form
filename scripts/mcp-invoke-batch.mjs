/**
 * Prepare combined MCP batch and print metadata.
 * Usage: node scripts/mcp-invoke-batch.mjs <start> <end>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const payloadDir = join(__dirname, '../supabase/batches/_payloads');

const start = parseInt(process.argv[2], 10);
const end = parseInt(process.argv[3], 10);

const combine = spawnSync(
  process.execPath,
  [join(__dirname, 'mcp-combine-batch.mjs'), String(start), String(end)],
  { encoding: 'utf8' }
);
if (combine.status !== 0) {
  console.error(combine.stderr || combine.stdout);
  process.exit(1);
}

const payload = JSON.parse(combine.stdout);
const argsPath = join(payloadDir, '_mcp_exec_args.json');
writeFileSync(argsPath, JSON.stringify({ project_id: payload.project_id, query: payload.query }));
const sqlPath = join(payloadDir, '_invoke_query.sql');
writeFileSync(sqlPath, payload.query);

console.log(
  JSON.stringify({
    project_id: payload.project_id,
    files: payload.files,
    queryLength: payload.query.length,
    argsPath,
    sqlPath,
  })
);
