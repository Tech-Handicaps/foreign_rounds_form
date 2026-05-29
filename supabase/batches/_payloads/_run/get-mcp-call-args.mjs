/** Output execute_sql MCP arguments JSON for one batch. */
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
} else {
  const data = JSON.parse(fs.readFileSync(argsPath, 'utf8'));
  query = data.query;
}
const out = { project_id: 'igmuuvrjmrgnxadewbec', query };
if (process.argv[3] === '--write') {
  fs.writeFileSync(path.join(dir, '_mcp_call.json'), JSON.stringify(out), 'utf8');
} else {
  process.stdout.write(JSON.stringify(out));
}
