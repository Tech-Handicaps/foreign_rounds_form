import fs from 'fs';
import path from 'path';

const num = process.argv[2];
if (!num) {
  console.error('Usage: node load-query.mjs <batch-number 2-33>');
  process.exit(1);
}
const name = `us-${String(num).padStart(4, '0')}`;
const file = path.join(
  'c:/Cursor/HNA/foreign_rounds_form/supabase/batches/_payloads/_mcp_calls',
  `${name}.json`
);
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
process.stdout.write(JSON.stringify({ file: `${name}.sql`, query: data.query }));
