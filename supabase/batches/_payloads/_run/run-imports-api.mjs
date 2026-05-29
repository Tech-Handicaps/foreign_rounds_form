/**
 * Execute us-0001..us-0033 SQL batches via Supabase Management API postgres.
 * Fallback when MCP token unavailable; same SQL as execute_sql payloads.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const payloadDir = path.join(dir, '..');
const argsDir = path.join(dir, 'mcp_args');
const resultsPath = path.join(dir, 'import-results.json');
const PROJECT_ID = 'igmuuvrjmrgnxadewbec';

const start = parseInt(process.argv[2] || '1', 10);
const end = parseInt(process.argv[3] || '33', 10);

async function executeSql(token, query) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_MCP_TOKEN;
  if (!token) {
    console.error('No SUPABASE_ACCESS_TOKEN or SUPABASE_MCP_TOKEN');
    process.exit(1);
  }

  const results = [];
  for (let i = start; i <= end; i++) {
    const name = `us-${String(i).padStart(4, '0')}`;
    const argsPath = path.join(argsDir, `${name}.args.json`);
    const payloadPath = path.join(payloadDir, `${name}.json`);
    const src = fs.existsSync(argsPath) ? argsPath : payloadPath;
    const { query } = JSON.parse(fs.readFileSync(src, 'utf8'));
    process.stdout.write(`${name}... `);
    try {
      await executeSql(token, query);
      results.push({ file: `${name}.sql`, status: 'success' });
      console.log('OK');
    } catch (err) {
      results.push({ file: `${name}.sql`, status: 'error', error: String(err.message || err) });
      console.log('FAIL:', err.message || err);
    }
  }

  let finalCount = null;
  try {
    const countResp = await executeSql(
      token,
      "select count(*) as cnt from public.golf_courses where country = 'United States';"
    );
    finalCount = countResp?.[0]?.cnt ?? countResp;
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
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
