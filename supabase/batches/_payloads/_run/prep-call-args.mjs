/** Build _call_args.json from _queries/{name}.sql. Usage: node prep-call-args.mjs us-0009 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const name = process.argv[2];
if (!name) process.exit(1);
const sqlPath = path.join(dir, '_queries', `${name}.sql`);
const argsPath = path.join(dir, 'mcp_args', `${name}.args.json`);
let query;
if (fs.existsSync(sqlPath)) {
  query = fs.readFileSync(sqlPath, 'utf8');
} else if (fs.existsSync(argsPath)) {
  query = JSON.parse(fs.readFileSync(argsPath, 'utf8')).query;
} else {
  console.error('Missing', name);
  process.exit(1);
}
const out = { project_id: 'igmuuvrjmrgnxadewbec', query };
fs.writeFileSync(path.join(dir, '_call_args.json'), JSON.stringify(out), 'utf8');
fs.writeFileSync(path.join(dir, '_current_query.sql'), query, 'utf8');
console.log('READY', name, query.length);
