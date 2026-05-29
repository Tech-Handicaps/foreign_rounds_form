/**
 * Execute us-0002..us-0033 via MCP execute_sql HTTP API (same tool as CallMcpTool).
 * Reads _mcp_calls/{filename}.json payloads.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const callDir = path.join(__dirname, '_mcp_calls');
const resultsPath = path.join(__dirname, '_exec_results_2_33.json');
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';
const MCP_URL = 'https://mcp.supabase.com/mcp';

const FILES = Array.from({ length: 32 }, (_, i) => `us-${String(i + 2).padStart(4, '0')}.json`);

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
        clientInfo: { name: 'batch-import-2-33', version: '1.0.0' },
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
  if (/isError["\s]*:\s*true|"error"\s*:\s*\{/.test(callText) && /error/i.test(callText)) {
    throw new Error(callText.slice(0, 500));
  }
  return callText;
}

async function runBatch(headers, files, concurrency = 4) {
  const results = [];
  for (let i = 0; i < files.length; i += concurrency) {
    const chunk = files.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(async (file) => {
        const payload = JSON.parse(fs.readFileSync(path.join(callDir, file), 'utf8'));
        process.stdout.write(`${file}... `);
        try {
          await executeSql(headers, payload.query);
          console.log('OK');
          return { file, status: 'success' };
        } catch (err) {
          const error = String(err.message || err);
          console.log('FAIL');
          return { file, status: 'error', error };
        }
      })
    );
    results.push(...chunkResults);
  }
  return results;
}

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_MCP_TOKEN;
  if (!token) {
    console.error('NO_TOKEN');
    process.exit(2);
  }

  const headers = await mcpSession(token);
  const results = await runBatch(headers, FILES, 4);

  let count = null;
  try {
    const resp = await executeSql(
      headers,
      "select count(*) as cnt from public.golf_courses where country = 'United States';"
    );
    const m = resp.match(/"cnt"\s*:\s*"?(\d+)"?/);
    count = m ? parseInt(m[1], 10) : resp.slice(0, 300);
  } catch (e) {
    count = `error: ${e.message}`;
  }

  const summary = {
    succeeded: results.filter((r) => r.status === 'success').length,
    failed: results.filter((r) => r.status === 'error'),
    total: results.length,
    count,
    results,
  };
  fs.writeFileSync(resultsPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(String(e));
  process.exit(1);
});
