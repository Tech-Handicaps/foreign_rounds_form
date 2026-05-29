/**
 * Run us-0002..us-0033 SQL via direct Postgres (service role connection string).
 * Fallback when MCP HTTP token unavailable; same SQL as MCP execute_sql payloads.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const callDir = path.join(__dirname, '_mcp_calls');
const resultsPath = path.join(__dirname, '_exec_results_2_33.json');

const PROJECT_REF = 'igmuuvrjmrgnxadewbec';
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || process.env.DB_PASSWORD;
const DATABASE_URL =
  process.env.DATABASE_URL ||
  (DB_PASSWORD
    ? `postgresql://postgres.${PROJECT_REF}:${encodeURIComponent(DB_PASSWORD)}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
    : null);

const FILES = Array.from({ length: 32 }, (_, i) => `us-${String(i + 2).padStart(4, '0')}.json`);

async function main() {
  if (!DATABASE_URL) {
    console.error('NO_DATABASE_URL');
    process.exit(2);
  }

  const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const results = [];
  for (const file of FILES) {
    const { query } = JSON.parse(fs.readFileSync(path.join(callDir, file), 'utf8'));
    process.stdout.write(`${file}... `);
    try {
      await client.query(query);
      results.push({ file, status: 'success' });
      console.log('OK');
    } catch (err) {
      const error = String(err.message || err);
      results.push({ file, status: 'error', error });
      console.log('FAIL', error.slice(0, 120));
    }
  }

  const countRes = await client.query(
    "select count(*)::int as cnt from public.golf_courses where country = 'United States'"
  );
  await client.end();

  const summary = {
    succeeded: results.filter((r) => r.status === 'success').length,
    failed: results.filter((r) => r.status === 'error'),
    total: results.length,
    count: countRes.rows[0].cnt,
    results,
  };
  fs.writeFileSync(resultsPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
