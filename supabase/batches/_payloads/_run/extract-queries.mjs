import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const payloadDir = path.join(dir, '..');

for (let i = 1; i <= 33; i++) {
  const name = `us-${String(i).padStart(4, '0')}`;
  const payload = JSON.parse(fs.readFileSync(path.join(payloadDir, `${name}.json`), 'utf8'));
  fs.writeFileSync(path.join(dir, `${name}.query.sql`), payload.query);
}
console.log('extracted 33 queries');
