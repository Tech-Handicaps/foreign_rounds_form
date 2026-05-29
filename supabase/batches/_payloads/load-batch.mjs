import fs from 'fs';
import path from 'path';

const start = parseInt(process.argv[2], 10);
const end = parseInt(process.argv[3], 10);
const dir = 'c:/Cursor/HNA/foreign_rounds_form/supabase/batches/_payloads/_mcp_calls';
const out = [];

for (let i = start; i <= end; i++) {
  const name = `us-${String(i).padStart(4, '0')}`;
  const data = JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), 'utf8'));
  out.push({ file: `${name}.sql`, query: data.query });
}

process.stdout.write(JSON.stringify(out));
