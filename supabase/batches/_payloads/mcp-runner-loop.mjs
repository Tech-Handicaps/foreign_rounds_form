/**
 * Loop: load pending, for each batch call execute_sql via MCP HTTP if token set,
 * else write _mcp_invoke/{name}.json for agent CallMcpTool.
 * Usage: node mcp-runner-loop.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const callDir = path.join(dir, '_mcp_calls');
const resultsPath = path.join(dir, '_mcp_results.json');
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';
const MCP_URL = 'https://mcp.supabase.com/mcp';
const BATCH = 4;
const START = 2;
const END = 33;

function loadResults() {
  return fs.existsSync(resultsPath) ? JSON.parse(fs.readFileSync(resultsPath, 'utf8')) : [];
}

function saveResults(r) {
  fs.writeFileSync(resultsPath, JSON.stringify(r, null, 2));
}

function record(file, status, error) {
  const results = loadResults();
  const entry = { file, status, ...(error ? { error } : {}) };
  const idx = results.findIndex((x) => x.file === file);
  if (idx >= 0) results[idx] = entry;
  else results.push(entry);
  saveResults(results);
}

function pending() {
  const done = new Set(loadResults().filter((r) => r.status === 'success').map((r) => r.file));
  const out = [];
  for (let i = START; i <= END; i++) {
    const file = `us-${String(i).padStart(4, '0')}.sql`;
    const name = `us-${String(i).padStart(4, '0')}`;
    if (!done.has(file)) out.push({ file, name });
  }
  return out;
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

const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_MCP_TOKEN;
const allPending = pending();

if (!token) {
  console.log(JSON.stringify({ mode: 'agent', pending: allPending.map((p) => p.name) }));
  process.exit(2);
}

const headers = await mcpSession(token);
const failed = [];

for (let i = 0; i < allPending.length; i += BATCH) {
  const batch = allPending.slice(i, i + BATCH);
  const results = await Promise.all(
    batch.map(async ({ file, name }) => {
      const { query } = JSON.parse(fs.readFileSync(path.join(callDir, `${name}.json`), 'utf8'));
      try {
        await executeSql(headers, query);
        record(file, 'success');
        return { file, status: 'success' };
      } catch (err) {
        const msg = String(err.message || err);
        record(file, 'error', msg);
        return { file, status: 'error', error: msg };
      }
    })
  );
  for (const r of results) {
    console.log(`${r.file}: ${r.status}`);
    if (r.status === 'error') failed.push(r);
  }
}

let count = null;
try {
  const resp = await executeSql(
    headers,
    "select count(*) as cnt from public.golf_courses where country = 'United States';"
  );
  const m = resp.match(/"cnt"\s*:\s*"?(\d+)"?/);
  count = m ? parseInt(m[1], 10) : resp.slice(0, 200);
} catch (e) {
  count = `error: ${e.message}`;
}

console.log(
  JSON.stringify(
    {
      totalSuccess: loadResults().filter((r) => r.status === 'success').length,
      failed,
      count,
    },
    null,
    2
  )
);
