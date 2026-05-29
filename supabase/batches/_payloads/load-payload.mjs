import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const num = parseInt(process.argv[2], 10);
const name = `us-${String(num).padStart(4, '0')}`;
const dir = path.dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(
  fs.readFileSync(path.join(dir, '_mcp_calls', `${name}.json`), 'utf8')
);
process.stdout.write(JSON.stringify({ project_id: data.project_id, query: data.query }));
