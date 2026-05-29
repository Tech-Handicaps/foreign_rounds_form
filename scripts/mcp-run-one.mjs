/**
 * Print MCP execute_sql args for one batch file (stdout JSON).
 * Usage: node scripts/mcp-run-one.mjs 5
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const queryDir = join(__dirname, '../supabase/batches/_payloads/_queries');
const projectId = 'igmuuvrjmrgnxadewbec';
const num = parseInt(process.argv[2], 10);
const name = `us-${String(num).padStart(4, '0')}`;
const query = readFileSync(join(queryDir, `${name}.sql`), 'utf8');
process.stdout.write(JSON.stringify({ file: `${name}.sql`, project_id: projectId, query }));
