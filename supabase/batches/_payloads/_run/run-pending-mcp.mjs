/**
 * Prepare pending batch files for MCP execute_sql calls.
 * Outputs one JSON line per pending file: {file, project_id, query}
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const resultsPath = path.join(dir, '..', '_mcp_results.json');
const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const pending = results.filter((r) => r.status !== 'success');

for (const row of pending) {
  const base = row.file.replace('.sql', '');
  const execPath = path.join(dir, `exec_${base}.json`);
  const j = JSON.parse(fs.readFileSync(execPath, 'utf8'));
  console.log(JSON.stringify({ file: row.file, project_id: j.project_id, query: j.query }));
}
