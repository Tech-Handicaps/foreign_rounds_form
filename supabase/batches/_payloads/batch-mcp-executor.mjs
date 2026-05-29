/**
 * Execute all batch SQL imports by reading queries from _temp_queries
 * and writing MCP-ready payload files. Agent calls execute_sql per file.
 *
 * Also supports --extract-all to regenerate temp query files from payloads.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';
const START = 2;
const END = 33;

const callsDir = path.join(__dirname, '_mcp_calls');
const tempDir = path.join(__dirname, '_temp_queries');
const resultsPath = path.join(__dirname, '_mcp_results.json');

function getQuery(num) {
  const name = `us-${String(num).padStart(4, '0')}`;
  const tempPath = path.join(tempDir, `${name}.sql`);
  if (fs.existsSync(tempPath)) {
    return { file: `${name}.sql`, query: fs.readFileSync(tempPath, 'utf8') };
  }
  const data = JSON.parse(fs.readFileSync(path.join(callsDir, `${name}.json`), 'utf8'));
  return { file: `${name}.sql`, query: data.query };
}

const cmd = process.argv[2];
const num = parseInt(process.argv[3], 10);

if (cmd === 'get' && num) {
  const { file, query } = getQuery(num);
  process.stdout.write(JSON.stringify({ file, project_id: PROJECT_ID, query }));
  process.exit(0);
}

if (cmd === 'merge-results') {
  const partial = process.argv.slice(3);
  const results = [];
  for (const p of partial) {
    results.push(...JSON.parse(fs.readFileSync(p, 'utf8')));
  }
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`Wrote ${results.length} results to ${resultsPath}`);
  process.exit(0);
}

console.error('Usage: node batch-mcp-executor.mjs get <2-33>');
process.exit(1);
