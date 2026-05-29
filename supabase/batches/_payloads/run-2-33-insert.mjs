/**
 * Parse INSERT payloads from _mcp_calls and insert via supabase-js (service role).
 * Same data as MCP execute_sql batches us-0002..us-0033.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const callDir = path.join(__dirname, '_mcp_calls');
const resultsPath = path.join(__dirname, '_exec_results_2_33.json');

config({ path: path.resolve(__dirname, '../../../.env.local') });
config({ path: path.resolve(__dirname, '../../../.env') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing Supabase env');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const FILES = Array.from({ length: 32 }, (_, i) => `us-${String(i + 2).padStart(4, '0')}.json`);

function parseInsertRows(query) {
  const rows = [];
  const re = /\('United States',\s*'((?:''|[^'])*)'\)/g;
  let m;
  while ((m = re.exec(query)) !== null) {
    rows.push({ country: 'United States', name: m[1].replace(/''/g, "'") });
  }
  return rows;
}

async function main() {
  const results = [];
  for (const file of FILES) {
    const { query } = JSON.parse(fs.readFileSync(path.join(callDir, file), 'utf8'));
    const rows = parseInsertRows(query);
    process.stdout.write(`${file} (${rows.length} rows)... `);
    try {
      const { error } = await supabase.from('golf_courses').upsert(rows, {
        onConflict: 'country,name',
        ignoreDuplicates: true,
      });
      if (error) throw error;
      results.push({ file, status: 'success', rows: rows.length });
      console.log('OK');
    } catch (err) {
      const error = String(err.message || err);
      results.push({ file, status: 'error', error });
      console.log('FAIL', error.slice(0, 120));
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
    count: countErr ? String(countErr.message) : count,
    results,
  };
  fs.writeFileSync(resultsPath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
