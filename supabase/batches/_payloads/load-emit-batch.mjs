import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nums = process.argv.slice(2).map((n) => parseInt(n, 10)).filter(Boolean);
const outDir = path.join(__dirname, '_emit_out');

for (const num of nums) {
  const j = JSON.parse(fs.readFileSync(path.join(outDir, `${num}.json`), 'utf8'));
  process.stdout.write(JSON.stringify({ num, file: j.file, project_id: j.project_id, query: j.query }) + '\n');
}
