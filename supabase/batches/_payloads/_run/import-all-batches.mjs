/**
 * Execute us-0001..us-0033 via Supabase MCP execute_sql (sequential HTTP).
 * Same payloads as CallMcpTool. Requires SUPABASE_ACCESS_TOKEN in env.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const payloadDir = path.join(dir, '..');
const argsDir = path.join(dir, 'mcp_args');
const resultsPath = path.join(dir, 'import-results.json');
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';
const MCP_URL = 'https://mcp.supabase.com/mcp';
const START = parseInt(process.env.BATCH_START || '1', 10);
const END = parseInt(process.env.BATCH_END || '33', 10);

function loadQuery(name) {
  const toolPath = path.join(payloadDir, `_mcp_tool_${name}.json`);
  if (fs.existsSync(toolPath)) {
    const t = JSON.parse(fs.readFileSync(toolPath, 'utf8'));
    return t.arguments?.query || t.query;
  }
  const argsPath = path.join(argsDir, `${name}.args.json`);
  const payloadPath = path.join(payloadDir, `${name}.json`);
  const src = fs.existsSync(argsPath) ? argsPath : payloadPath;
  return JSON.parse(fs.readFileSync(src, 'utf8')).query;
}

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
        clientInfo: { name: 'us-batch-import', version: '1.0.0' },
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
  if (/isError["\s]*:\s*true/.test(callText)) throw new Error(callText.slice(0, 500));
  return callText;
}

function batchName(i) {
  return `us-${String(i).padStart(4, '0')}`;
}

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_MCP_TOKEN;
  if (!token) {
    console.error('NO_TOKEN');
    process.exit(2);
  }

  const headers = await mcpSession(token);
  const results = [];

  for (let i = START; i <= END; i++) {
    const name = batchName(i);
    const query = loadQuery(name);
    process.stdout.write(`${name}... `);
    try {
      await executeSql(headers, query);
      results.push({ file: name, status: 'success' });
      console.log('OK');
    } catch (err) {
      const msg = String(err.message || err);
      results.push({ file: name, status: 'error', error: msg });
      console.log('FAIL');
    }
  }

  let finalCount = null;
  try {
    const countText = await executeSql(
      headers,
      "select count(*) as cnt from public.golf_courses where country = 'United States';"
    );
    const m = countText.match(/"cnt"\s*:\s*(\d+)/);
    finalCount = m ? Number(m[1]) : countText;
  } catch (err) {
    finalCount = { error: String(err.message || err) };
  }

  const summary = {
    succeeded: results.filter((r) => r.status === 'success').length,
    failed: results.filter((r) => r.status === 'error').map(({ file, error }) => ({ file, error })),
    total: results.length,
    finalCount,
    results,
  };
  fs.writeFileSync(resultsPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
