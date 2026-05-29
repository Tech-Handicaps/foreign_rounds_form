/**
 * Execute all batch SQL via Supabase MCP execute_sql using args JSON files.
 * Run from agent: node exec-all-batches.mjs
 * Uses sequential fetch to MCP HTTP (requires auth from Cursor env when available).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const argsDir = path.join(dir, 'mcp_args');
const resultsPath = path.join(dir, 'import-results.json');
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';
const MCP_URL = 'https://mcp.supabase.com/mcp';

async function mcpExecuteSql(token, query) {
  const res = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: 'execute_sql',
        arguments: { project_id: PROJECT_ID, query },
      },
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  const parsed = JSON.parse(text);
  if (parsed.error) throw new Error(JSON.stringify(parsed.error));
  return parsed.result;
}

async function main() {
  const start = parseInt(process.argv[2] || '1', 10);
  const end = parseInt(process.argv[3] || '33', 10);
  const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_MCP_TOKEN;

  const results = [];

  if (!token) {
    // Output batch list for agent CallMcpTool fallback
    for (let i = start; i <= end; i++) {
      const name = `us-${String(i).padStart(4, '0')}`;
      results.push({ file: `${name}.sql`, status: 'pending', argsPath: path.join(argsDir, `${name}.args.json`) });
    }
    fs.writeFileSync(resultsPath, JSON.stringify({ mode: 'agent_required', results }, null, 2));
    console.log('AGENT_REQUIRED');
    console.log(JSON.stringify(results.map((r) => r.file)));
    process.exit(2);
  }

  for (let i = start; i <= end; i++) {
    const name = `us-${String(i).padStart(4, '0')}`;
    const { query } = JSON.parse(fs.readFileSync(path.join(argsDir, `${name}.args.json`), 'utf8'));
    process.stdout.write(`${name}... `);
    try {
      await mcpExecuteSql(token, query);
      results.push({ file: `${name}.sql`, status: 'success' });
      console.log('OK');
    } catch (err) {
      results.push({ file: `${name}.sql`, status: 'error', error: String(err.message || err) });
      console.log('FAIL');
    }
  }

  let finalCount = null;
  try {
    const r = await mcpExecuteSql(token, "select count(*) as cnt from public.golf_courses where country = 'United States';");
    const text = r?.content?.[0]?.text || JSON.stringify(r);
    const m = text.match(/"cnt"\s*:\s*(\d+)/);
    finalCount = m ? parseInt(m[1], 10) : text;
  } catch (err) {
    finalCount = { error: String(err.message || err) };
  }

  const summary = {
    succeeded: results.filter((r) => r.status === 'success').length,
    failed: results.filter((r) => r.status === 'error'),
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
