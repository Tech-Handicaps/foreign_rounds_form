/**
 * Execute remaining batch imports via Supabase db query --linked (parallel batches).
 * Records results to _mcp_results.json and marks done via run-sequential-imports.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const dir = path.dirname(fileURLToPath(import.meta.url));
const invokeDir = path.join(dir, '_invoke');
const batchesDir = path.join(dir, '..');
const resultsPath = path.join(dir, '_mcp_results.json');
const runner = path.join(dir, 'run-sequential-imports.mjs');
const START = parseInt(process.argv[2] || '7', 10);
const END = parseInt(process.argv[3] || '33', 10);
const BATCH = parseInt(process.argv[4] || '5', 10);
const root = path.resolve(dir, '../../..');

function runSql(fileNum) {
  const name = `us-${String(fileNum).padStart(4, '0')}`;
  const sqlFile = path.join(batchesDir, `${name}.sql`);
  const r = spawnSync('npx', ['supabase', 'db', 'query', '--linked', '-f', sqlFile], {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    timeout: 120000,
  });
  return { name, file: `${name}.sql`, ok: r.status === 0, err: (r.stderr || r.stdout || '').slice(0, 500) };
}

async function main() {
  const nums = [];
  for (let i = START; i <= END; i++) nums.push(i);

  for (let b = 0; b < nums.length; b += BATCH) {
    const chunk = nums.slice(b, b + BATCH);
    const results = chunk.map(runSql);
    for (const r of results) {
      const num = parseInt(r.name.split('-')[1], 10);
      const args = r.ok ? ['--done', String(num)] : ['--done', String(num), r.err];
      spawnSync('node', [runner, ...args], { encoding: 'utf8', shell: true });
      console.log(`${r.file}: ${r.ok ? 'OK' : 'FAIL ' + r.err.slice(0, 80)}`);
    }
  }
}

main();
