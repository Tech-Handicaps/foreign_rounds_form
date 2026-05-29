import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const num = parseInt(process.argv[2], 10);
const name = `us-${String(num).padStart(4, '0')}`;
const data = JSON.parse(
  fs.readFileSync(path.join(dir, '_mcp_calls', `${name}.json`), 'utf8')
);
const outDir = path.join(dir, '_emit');
fs.mkdirSync(outDir, { recursive: true });
const args = { project_id: data.project_id, query: data.query };
fs.writeFileSync(path.join(outDir, `${name}.args.json`), JSON.stringify(args));
console.log(JSON.stringify({ file: `${name}.sql`, queryLen: data.query.length }));
