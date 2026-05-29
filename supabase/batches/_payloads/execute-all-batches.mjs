/**
 * Execute all batch SQL imports via Supabase MCP HTTP API.
 * Requires Cursor MCP OAuth token in SUPABASE_MCP_TOKEN env var,
 * or pass --use-cursor-token to read from Cursor storage (best-effort).
 *
 * Usage: node execute-all-batches.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';
const START = 2;
const END = 33;
const MCP_URL = 'https://mcp.supabase.com/mcp';
const execArgsDir = path.join(__dirname, '_exec_args');
const resultsPath = path.join(__dirname, '_mcp_results.json');

async function mcpCallExecuteSql(token, query) {
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
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text);
}

async function main() {
  const token = process.env.SUPABASE_MCP_TOKEN;
  if (!token) {
    console.error('Set SUPABASE_MCP_TOKEN or use CallMcpTool from agent.');
    process.exit(1);
  }

  const results = [];
  for (let i = START; i <= END; i++) {
    const name = `us-${String(i).padStart(4, '0')}`;
    const file = `${name}.sql`;
    const argsPath = path.join(execArgsDir, `${name}.json`);
    const { query } = JSON.parse(fs.readFileSync(argsPath, 'utf8'));
    process.stdout.write(`Executing ${file}... `);
    try {
      const resp = await mcpCallExecuteSql(token, query);
      if (resp.error) throw new Error(JSON.stringify(resp.error));
      results.push({ file, status: 'success' });
      console.log('OK');
    } catch (err) {
      results.push({ file, status: 'error', error: String(err.message || err) });
      console.log('FAIL:', err.message || err);
    }
  }

  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\nWrote results to ${resultsPath}`);
  console.log(`Success: ${results.filter((r) => r.status === 'success').length}/${results.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
