/**
 * Import US golf courses from batch SQL files via Supabase JS (same SQL payloads).
 * Parses INSERT ... ON CONFLICT statements from queries/*.sql
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const queriesDir = path.join(dir, 'queries');
const resultsPath = path.join(dir, 'import-results.json');

config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing Supabase env');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function parseInsertRows(sql) {
  const rows = [];
  const re = /\('United States',\s*'((?:''|[^'])*)'\)/g;
  let m;
  while ((m = re.exec(sql))) {
    rows.push({ country: 'United States', name: m[1].replace(/''/g, "'") });
  }
  return rows;
}

async function main() {
  const start = parseInt(process.argv[2] || '2', 10);
  const end = parseInt(process.argv[3] || '33', 10);
  const results = [];

  for (let i = start; i <= end; i++) {
    const name = `us-${String(i).padStart(4, '0')}`;
    const file = `${name}.sql`;
    process.stdout.write(`${name}... `);
    try {
      const sql = fs.readFileSync(path.join(queriesDir, `${name}.sql`), 'utf8');
      const rows = parseInsertRows(sql);
      if (!rows.length) throw new Error('no rows parsed');
      const { error } = await supabase.from('golf_courses').upsert(rows, {
        onConflict: 'country,name',
        ignoreDuplicates: true,
      });
      if (error) throw error;
      results.push({ file, status: 'success', rows: rows.length });
      console.log(`OK (${rows.length} rows)`);
    } catch (err) {
      results.push({ file, status: 'error', error: String(err.message || err) });
      console.log('FAIL:', err.message || err);
    }
  }

  const { count, error: countErr } = await supabase
    .from('golf_courses')
    .select('*', { count: 'exact', head: true })
    .eq('country', 'United States');

  const summary = {
    succeeded: results.filter((r) => r.status === 'success').length,
    failed: results.filter((r) => r.status === 'error'),
    total: results.length,
    finalCount: countErr ? { error: countErr.message } : count,
    results,
  };
  fs.writeFileSync(resultsPath, JSON.stringify(summary, null, 2));
  console.log('\nSUMMARY:', JSON.stringify(summary));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
