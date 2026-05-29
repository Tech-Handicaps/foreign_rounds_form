import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const start = parseInt(process.argv[2] || '10', 10);
const end = parseInt(process.argv[3] || '33', 10);

for (let n = start; n <= end; n++) {
  const j = JSON.parse(fs.readFileSync(path.join(dir, '_emit', `call-${n}.json`), 'utf8'));
  const tool = {
    server: 'plugin-supabase-supabase',
    toolName: 'execute_sql',
    arguments: { project_id: j.project_id, query: j.query },
  };
  const name = `us-${String(n).padStart(4, '0')}`;
  fs.writeFileSync(path.join(dir, `_mcp_tool_${name}.json`), JSON.stringify(tool));
  console.log(name);
}
