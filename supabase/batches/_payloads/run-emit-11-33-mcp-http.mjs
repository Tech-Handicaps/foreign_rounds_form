/**
 * Execute us-0011..us-0033 via Supabase MCP execute_sql HTTP (same as CallMcpTool).
 * Reads _emit/call-N.json. Requires SUPABASE_ACCESS_TOKEN or SUPABASE_MCP_TOKEN.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';
const MCP_URL = 'https://mcp.supabase.com/mcp';
const start = parseInt(process.argv[2] || '11', 10);
const end = parseInt(process.argv[3] || '33', 10);
const resultsPath = path.join(dir, '_emit_11_33_mcp_results.json');

async function mcpSession(token) {
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
        clientInfo: { name: 'emit-11-33', version: '1.0.0' },
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
  return headers;
}

async function executeSql(headers, query) {
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
  if (/isError["\s]*:\s*true/.test(callText) && /error/i.test(callText)) {
    throw new Error(callText.slice(0, 500));
  }
  return callText;
}

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_MCP_TOKEN;
  if (!token) {
    console.error('NO_TOKEN — use CallMcpTool from agent for each file');
    process.exit(2);
  }
  const headers = await mcpSession(token);
  const results = [];
  for (let n = start; n <= end; n++) {
    const file = `us-${String(n).padStart(4, '0')}.sql`;
    const { query } = JSON.parse(fs.readFileSync(path.join(dir, '_emit', `call-${n}.json`), 'utf8'));
    process.stdout.write(`${file}... `);
    try {
      await executeSql(headers, query);
      results.push({ file, status: 'success' });
      console.log('OK');
    } catch (err) {
      results.push({ file, status: 'error', error: String(err.message || err) });
      console.log('FAIL');
    }
  }
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  const ok = results.filter((r) => r.status === 'success').length;
  const fail = results.filter((r) => r.status === 'error');
  console.log(JSON.stringify({ success: ok, failed: fail }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
