/**
 * Execute US golf course batch imports via Supabase MCP execute_sql.
 * Reads payload JSON files (us-0002 through us-0033) and writes results.
 *
 * Usage: node execute-mcp-imports.mjs
 *
 * This script reads queries from _mcp_calls payload files and writes
 * a manifest for sequential MCP execution. Run with --dry-run to verify.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';
const START = 2;
const END = 33;
const callsDir = path.join(__dirname, '_mcp_calls');
const resultsPath = path.join(__dirname, '_mcp_results.json');

const dryRun = process.argv.includes('--dry-run');

const manifest = [];
for (let i = START; i <= END; i++) {
  const name = `us-${String(i).padStart(4, '0')}`;
  const payloadPath = path.join(callsDir, `${name}.json`);
  const data = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
  manifest.push({
    file: `${name}.sql`,
    project_id: PROJECT_ID,
    query: data.query,
  });
}

if (dryRun) {
  console.log(JSON.stringify(manifest.map(m => ({ file: m.file, queryLen: m.query.length })), null, 2));
  process.exit(0);
}

// Output manifest for agent MCP execution
const manifestPath = path.join(__dirname, '_mcp_manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest));
console.log(`Wrote manifest with ${manifest.length} entries to ${manifestPath}`);
