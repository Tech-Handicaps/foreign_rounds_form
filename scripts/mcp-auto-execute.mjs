/**
 * Execute batch SQL via Supabase MCP HTTP (same as execute_sql tool).
 * Reads from _mcp_calls/*.json, updates _mcp_results.json.
 *
 * Usage: SUPABASE_MCP_TOKEN=... node scripts/mcp-auto-execute.mjs [start] [end]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const callDir = join(__dirname, '../supabase/batches/_payloads/_mcp_calls');
const resultsPath = join(__dirname, '../supabase/batches/_payloads/_mcp_results.json');
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';
const MCP_URL = 'https://mcp.supabase.com/mcp';

const start = parseInt(process.argv[2] ?? '4', 10);
const end = parseInt(process.argv[3] ?? '33', 10);
const token = process.env.SUPABASE_MCP_TOKEN || process.env.SUPABASE_ACCESS_TOKEN;

function loadResults() {
  if (!existsSync(resultsPath)) return [];
  return JSON.parse(readFileSync(resultsPath, 'utf8'));
}

function saveResults(results) {
  writeFileSync(resultsPath, JSON.stringify(results, null, 2));
}

function loadPayload(num) {
  const name = `us-${String(num).padStart(4, '0')}`;
  const payload = JSON.parse(readFileSync(join(callDir, `${name}.json`), 'utf8'));
  return { file: `${name}.sql`, query: payload.query };
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
        clientInfo: { name: 'mcp-auto-execute', version: '1.0.0' },
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
  if (/\"isError\"\s*:\s*true/.test(callText) || /"error"/.test(callText) && /error/i.test(callText)) {
    throw new Error(callText.slice(0, 500));
  }
  return callText;
}

async function main() {
  if (!token) {
    console.error('Missing SUPABASE_MCP_TOKEN or SUPABASE_ACCESS_TOKEN');
    process.exit(1);
  }
  const results = loadResults();
  const done = new Set(results.filter((r) => r.status === 'success').map((r) => r.file));
  const failures = [];

  for (let i = start; i <= end; i++) {
    const { file, query } = loadPayload(i);
    if (done.has(file)) {
      console.log(`skip ${file}`);
      continue;
    }
    process.stdout.write(`${file}... `);
    try {
      await mcpExecuteSql(query);
      const idx = results.findIndex((r) => r.file === file);
      const entry = { file, status: 'success' };
      if (idx >= 0) results[idx] = entry;
      else results.push(entry);
      done.add(file);
      saveResults(results);
      console.log('OK');
    } catch (err) {
      const msg = String(err.message || err);
      const idx = results.findIndex((r) => r.file === file);
      const entry = { file, status: 'error', error: msg };
      if (idx >= 0) results[idx] = entry;
      else results.push(entry);
      saveResults(results);
      failures.push({ file, error: msg });
      console.log('FAIL');
    }
  }

  let countResp = '';
  try {
    countResp = await mcpExecuteSql(
      "select count(*) as cnt from public.golf_courses where country = 'United States';"
    );
  } catch (e) {
    countResp = `count failed: ${e.message}`;
  }

  const success = results.filter((r) => r.status === 'success').length;
  console.log(JSON.stringify({ success, total: results.length, failures, countResp: countResp.slice(0, 300) }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
