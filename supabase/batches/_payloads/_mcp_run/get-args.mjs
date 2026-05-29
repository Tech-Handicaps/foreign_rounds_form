/** Print execute_sql args JSON for batch number N (stdout, one line) */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const payloadsDir = path.join(dir, '..');
const n = parseInt(process.argv[2], 10);
const args = JSON.parse(
  fs.readFileSync(path.join(payloadsDir, '_emit', `tool-args-${n}.json`), 'utf8')
);
process.stdout.write(JSON.stringify({ project_id: args.project_id, query: args.query }));
