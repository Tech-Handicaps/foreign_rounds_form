/**
 * Execute all batch imports by reading _exec_args and calling Supabase MCP HTTP API.
 * Uses Streamable HTTP transport (JSON-RPC tools/call).
 *
 * Token: set SUPABASE_ACCESS_TOKEN env var (Supabase personal access token or MCP OAuth token).
 * If unset, prints instructions and exits.
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

async function mcpExecuteSql(token, query) {
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
        clientInfo: { name: 'batch-import', version: '1.0.0' },
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
  return callText;
}

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_MCP_TOKEN;
  if (!token) {
    console.error('Missing SUPABASE_ACCESS_TOKEN. Use CallMcpTool from Cursor agent instead.');
    process.exit(1);
  }

  const results = [];
  for (let i = START; i <= END; i++) {
    const name = `us-${String(i).padStart(4, '0')}`;
    const file = `${name}.sql`;
    const { query } = JSON.parse(fs.readFileSync(path.join(execArgsDir, `${name}.json`), 'utf8'));
    process.stdout.write(`${file}... `);
    try {
      const resp = await mcpExecuteSql(token, query);
      if (/error/i.test(resp) && /"isError"\s*:\s*true/.test(resp)) {
        throw new Error(resp.slice(0, 500));
      }
      results.push({ file, status: 'success' });
      console.log('OK');
    } catch (err) {
      results.push({ file, status: 'error', error: String(err.message || err) });
      console.log('FAIL');
    }
  }

  // Final count
  try {
    const countResp = await mcpExecuteSql(
      token,
      "select count(*) as cnt from public.golf_courses where country = 'United States';"
    );
    console.log('\nCount response:', countResp.slice(0, 200));
  } catch (e) {
    console.log('\nCount query failed:', e.message);
  }

  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  const ok = results.filter((r) => r.status === 'success').length;
  console.log(`\nResults: ${ok}/${results.length} succeeded`);
  console.log(`Saved: ${resultsPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
