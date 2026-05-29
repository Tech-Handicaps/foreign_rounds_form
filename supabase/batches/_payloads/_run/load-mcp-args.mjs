/** Print MCP execute_sql args JSON for one batch. Usage: node load-mcp-args.mjs us-0001 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const name = process.argv[2];
if (!name) process.exit(1);
const argsPath = path.join(dir, 'mcp_args', `${name}.args.json`);
const payloadPath = path.join(dir, '..', `${name}.json`);
const src = fs.existsSync(argsPath) ? argsPath : payloadPath;
const data = JSON.parse(fs.readFileSync(src, 'utf8'));
const out = {
  project_id: data.project_id || 'igmuuvrjmrgnxadewbec',
  query: data.query,
};
const outPath = path.join(dir, '_exec_now.json');
const sqlDir = path.join(dir, '_queries');
const sqlPath = path.join(sqlDir, `${name}.sql`);
if (process.argv[3] === '--write') {
  fs.mkdirSync(sqlDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(out), 'utf8');
  fs.writeFileSync(sqlPath, out.query, 'utf8');
  fs.writeFileSync(path.join(dir, '_current_query.sql'), out.query, 'utf8');
} else {
  process.stdout.write(JSON.stringify(out));
}
