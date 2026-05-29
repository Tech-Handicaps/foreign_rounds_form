/**
 * Load batch payloads for agent MCP execute_sql calls.
 * Usage:
 *   node scripts/mcp-batch-runner.mjs prepare 4 8
 *   node scripts/mcp-batch-runner.mjs payload 5
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const callDir = join(__dirname, '../supabase/batches/_payloads/_mcp_calls');
const execDir = join(__dirname, '../supabase/batches/_payloads/_exec_batch');
const projectId = 'igmuuvrjmrgnxadewbec';

function loadPayload(num) {
  const name = `us-${String(num).padStart(4, '0')}`;
  const payload = JSON.parse(readFileSync(join(callDir, `${name}.json`), 'utf8'));
  return { file: `${name}.sql`, project_id: projectId, query: payload.query };
}

const cmd = process.argv[2];
if (cmd === 'prepare') {
  const start = parseInt(process.argv[3], 10);
  const end = parseInt(process.argv[4], 10);
  mkdirSync(execDir, { recursive: true });
  const files = [];
  for (let i = start; i <= end; i++) {
    const p = loadPayload(i);
    const out = join(execDir, `us-${String(i).padStart(4, '0')}.json`);
    writeFileSync(out, JSON.stringify(p));
    files.push({ num: i, file: p.file, bytes: p.query.length, path: out });
  }
  console.log(JSON.stringify(files));
} else if (cmd === 'payload') {
  const num = parseInt(process.argv[3], 10);
  console.log(JSON.stringify(loadPayload(num)));
} else {
  console.log('Usage: prepare <start> <end> | payload <num>');
}
