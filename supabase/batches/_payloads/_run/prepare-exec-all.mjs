/**
 * Prepare exec JSON for us-0002..us-0033 and print batch ranges.
 * Agent calls CallMcpTool execute_sql for each exec_*.json query.
 *
 * Usage:
 *   node prepare-exec-all.mjs
 *   node prepare-exec-all.mjs --range 3 7
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const splitDir = path.join(dir, 'split');
const queryDir = path.join(dir, '..', '_queries');
const outDir = dir;
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';

const args = process.argv.slice(2);
const start = args[0] === '--range' ? Number(args[1]) : 2;
const end = args[0] === '--range' ? Number(args[2]) : 33;

for (let i = start; i <= end; i++) {
  const name = `us-${String(i).padStart(4, '0')}`;
  const src = path.join(splitDir, `${name}.sql`);
  const fallback = path.join(queryDir, `${name}.sql`);
  const q = fs.readFileSync(fs.existsSync(src) ? src : fallback, 'utf8');
  fs.writeFileSync(
    path.join(outDir, `exec_${name}.json`),
    JSON.stringify({ project_id: PROJECT_ID, query: q, file: `${name}.sql` })
  );
}

const files = [];
for (let i = start; i <= end; i++) {
  files.push(`us-${String(i).padStart(4, '0')}.sql`);
}
console.log(JSON.stringify({ start, end, files, count: files.length }));
