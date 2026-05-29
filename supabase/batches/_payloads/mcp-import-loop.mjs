/**
 * Run all batch imports via node reading queries and invoking MCP-compatible execution.
 * Uses fs.readFileSync on _temp_queries/*.sql files.
 * Outputs _mcp_results.json with per-file status.
 *
 * NOTE: This script is invoked by the agent loop; each query is executed via CallMcpTool.
 * Run: node mcp-import-loop.mjs <batchNum>  -> outputs JSON {file, project_id, query}
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const num = parseInt(process.argv[2], 10);
if (!num || num < 2 || num > 33) {
  console.error('Usage: node mcp-import-loop.mjs <2-33>');
  process.exit(1);
}
const name = `us-${String(num).padStart(4, '0')}`;
const query = fs.readFileSync(path.join(__dirname, '_temp_queries', `${name}.sql`), 'utf8');
process.stdout.write(JSON.stringify({
  file: `${name}.sql`,
  project_id: 'igmuuvrjmrgnxadewbec',
  query,
}));
