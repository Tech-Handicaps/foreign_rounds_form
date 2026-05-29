/**
 * Split _all_batches_2_33.sql into per-file statements and write to _run/split/
 * Usage: node split-batches.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, '..');
const src = path.join(root, '_all_batches_2_33.sql');
const outDir = path.join(dir, 'split');
fs.mkdirSync(outDir, { recursive: true });

const sql = fs.readFileSync(src, 'utf8');
const parts = sql.split(/(?=insert into public\.golf_courses)/i).filter((p) => p.trim());
console.log('parts', parts.length);
for (let i = 0; i < parts.length; i++) {
  const num = i + 2; // us-0002..us-0033
  const name = `us-${String(num).padStart(4, '0')}.sql`;
  fs.writeFileSync(path.join(outDir, name), parts[i].trim());
  console.log(name, parts[i].length);
}
