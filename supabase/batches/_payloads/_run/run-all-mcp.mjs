/**
 * Execute us-0001..us-0033 via Supabase MCP execute_sql HTTP API.
 * Uses Cursor MCP session when run from agent environment.
 * Reads pre-built args from mcp_args/*.args.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const argsDir = path.join(dir, 'mcp_args');
const resultsPath = path.join(dir, 'import-results.json');
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';
const MCP_URL = 'https://mcp.supabase.com/mcp';

const start = parseInt(process.argv[2] || '1', 10);
const end = parseInt(process.argv[3] || '33', 10);

async function executeSql(token, query) {
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
  const parsed = JSON.parse(text);
  if (parsed.error) throw new Error(JSON.stringify(parsed.error));
  if (parsed.result?.isError) throw new Error(JSON.stringify(parsed.result));
  return parsed.result;
}

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_MCP_TOKEN;
  if (!token) {
    console.error('NO_TOKEN');
    process.exit(2);
  }

  const results = [];
  for (let i = start; i <= end; i++) {
    const name = `us-${String(i).padStart(4, '0')}`;
    const args = JSON.parse(fs.readFileSync(path.join(argsDir, `${name}.args.json`), 'utf8'));
    process.stdout.write(`${name}... `);
    try {
      await executeSql(token, args.query);
      results.push({ file: `${name}.sql`, status: 'success' });
      console.log('OK');
    } catch (err) {
      results.push({ file: `${name}.sql`, status: 'error', error: String(err.message || err) });
      console.log('FAIL:', err.message || err);
    }
  }

  let finalCount = null;
  try {
    const countResult = await executeSql(
      token,
      "select count(*) as cnt from public.golf_courses where country = 'United States';"
    );
    const content = countResult?.content?.[0]?.text;
    if (content) {
      const match = content.match(/"cnt"\s*:\s*(\d+)/);
      finalCount = match ? parseInt(match[1], 10) : content;
    } else {
      finalCount = countResult;
    }
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
  console.log('\nSUMMARY:', JSON.stringify(summary));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
