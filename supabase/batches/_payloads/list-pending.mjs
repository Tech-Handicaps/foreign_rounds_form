/**
 * Execute remaining MCP imports (files 4-33) by reading _invoke JSON.
 * Prints one line per file: INDEX|FILE|QUERY_LEN
 * Agent should call execute_sql for each using run-sequential-imports.mjs --emit N
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resultsPath = path.join(__dirname, '_mcp_results.json');
const START = 4;
const END = 33;

const results = fs.existsSync(resultsPath) ? JSON.parse(fs.readFileSync(resultsPath, 'utf8')) : [];
const done = new Set(results.filter((r) => r.status === 'success').map((r) => r.file));

for (let i = START; i <= END; i++) {
  const file = `us-${String(i).padStart(4, '0')}.sql`;
  if (!done.has(file)) console.log(`${i}|${file}`);
}
