/**
 * Execute all _emit/call-N.json via Supabase MCP HTTP (when SUPABASE_MCP_TOKEN is set).
 * Falls back to printing files for agent CallMcpTool.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';
const MCP_URL = 'https://mcp.supabase.com/mcp';
const start = parseInt(process.argv[2] || '10', 10);
const end = parseInt(process.argv[3] || '33', 10);
const resultsPath = path.join(dir, '_range_run_results.json');

async function mcpExecuteSql(token, query) {
  const body = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: 'execute_sql',
      arguments: { project_id: PROJECT_ID, query },
    },
  };
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 800)}`);
  const data = JSON.parse(text);
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data;
}

function loadResults() {
  return fs.existsSync(resultsPath) ? JSON.parse(fs.readFileSync(resultsPath, 'utf8')) : [];
}

function saveResults(r) {
  fs.writeFileSync(resultsPath, JSON.stringify(r, null, 2));
}

const token = process.env.SUPABASE_MCP_TOKEN;
const results = loadResults();
const done = new Set(results.filter((r) => r.status === 'success').map((r) => r.file));

for (let n = start; n <= end; n++) {
  const file = `us-${String(n).padStart(4, '0')}.sql`;
  if (done.has(file)) continue;
  const j = JSON.parse(fs.readFileSync(path.join(dir, '_emit', `call-${n}.json`), 'utf8'));
  process.stdout.write(`Executing ${file} (${j.query.length} chars)... `);
  if (!token) {
    console.log('SKIP (no SUPABASE_MCP_TOKEN)');
    continue;
  }
  try {
    await mcpExecuteSql(token, j.query);
    results.push({ file, status: 'success' });
    console.log('OK');
  } catch (err) {
    results.push({ file, status: 'error', error: String(err.message || err) });
    console.log('FAIL:', err.message || err);
  }
}

saveResults(results);
const ok = results.filter((r) => r.status === 'success').length;
const fail = results.filter((r) => r.status === 'error');
console.log(`\nSuccess: ${ok}, Failed: ${fail.length}`);
if (fail.length) console.log(JSON.stringify(fail, null, 2));
