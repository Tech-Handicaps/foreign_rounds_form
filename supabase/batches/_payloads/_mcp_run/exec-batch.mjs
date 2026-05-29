/**
 * Execute batch imports via Supabase MCP execute_sql (same as CallMcpTool).
 * Reads _emit/tool-args-N.json, updates _mcp_results.json via run-import-loop.
 * Usage: node _mcp_run/exec-batch.mjs 11 14
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const payloadsDir = path.join(dir, '..');
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';
const MCP_URL = 'https://mcp.supabase.com/mcp';

const start = parseInt(process.argv[2], 10);
const end = parseInt(process.argv[3], 10);
const token = process.env.SUPABASE_MCP_TOKEN || process.env.SUPABASE_ACCESS_TOKEN;

function loadArgs(n) {
  return JSON.parse(fs.readFileSync(path.join(payloadsDir, '_emit', `tool-args-${n}.json`), 'utf8'));
}

function mark(file, status, error) {
  const args = ['run-import-loop.mjs', status === 'success' ? 'mark-success' : 'mark-error', file];
  if (error) args.push(error.slice(0, 500));
  spawnSync('node', args, { cwd: payloadsDir, stdio: 'inherit', shell: true });
}

async function mcpExecuteSql(query) {
  const initRes = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'exec-batch', version: '1.0.0' },
      },
    }),
  });
  const initText = await initRes.text();
  if (!initRes.ok) throw new Error(`Init HTTP ${initRes.status}: ${initText.slice(0, 300)}`);
  const sessionId = initRes.headers.get('mcp-session-id');
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    Authorization: `Bearer ${token}`,
  };
  if (sessionId) headers['mcp-session-id'] = sessionId;
  await fetch(MCP_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
  });
  const callRes = await fetch(MCP_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'execute_sql',
        arguments: { project_id: PROJECT_ID, query },
      },
    }),
  });
  const callText = await callRes.text();
  if (!callRes.ok) throw new Error(`Call HTTP ${callRes.status}: ${callText.slice(0, 500)}`);
  if (/\"isError\"\s*:\s*true/.test(callText)) throw new Error(callText.slice(0, 500));
  if (/\"error\"/.test(callText) && /error code/i.test(callText)) throw new Error(callText.slice(0, 500));
  return callText;
}

async function main() {
  if (!token) {
    console.error('Missing SUPABASE_MCP_TOKEN or SUPABASE_ACCESS_TOKEN');
    process.exit(1);
  }
  const results = { success: [], failed: [] };
  for (let n = start; n <= end; n++) {
    const file = `us-${String(n).padStart(4, '0')}.sql`;
    const { query } = loadArgs(n);
    process.stdout.write(`${file}... `);
    try {
      await mcpExecuteSql(query);
      mark(file, 'success');
      results.success.push(file);
      console.log('OK');
    } catch (err) {
      const msg = String(err.message || err);
      mark(file, 'error', msg);
      results.failed.push({ file, error: msg });
      console.log('FAIL');
    }
  }
  console.log(JSON.stringify(results));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
