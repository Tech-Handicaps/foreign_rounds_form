/** Prepare _mcp_query_*.json for a list of batch ids */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const callDir = path.join(dir, '_mcp_calls');
const ids = process.argv.slice(2);
for (const id of ids) {
  const payload = JSON.parse(fs.readFileSync(path.join(callDir, `${id}.json`), 'utf8'));
  fs.writeFileSync(
    path.join(dir, `_mcp_query_${id}.json`),
    JSON.stringify({ project_id: payload.project_id, query: payload.query.replace(/\r\n/g, '\n') })
  );
}
console.log(JSON.stringify({ prepared: ids }));
