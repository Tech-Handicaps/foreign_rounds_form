/**
 * Execute all US batch imports (us-0002..us-0033) via Supabase MCP execute_sql.
 * Reads payload JSON files and invokes MCP for each batch sequentially.
 *
 * Usage: node scripts/run-mcp-imports-all.mjs
 *
 * Requires CURSOR_MCP_BRIDGE env or runs in agent context with MCP access.
 * This script writes NDJSON commands for agent MCP invocation and collects results.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const callDir = join(__dirname, '../supabase/batches/_payloads/_mcp_calls');
const resultsPath = join(__dirname, '../supabase/batches/_payloads/_mcp_results.json');
const projectId = 'igmuuvrjmrgnxadewbec';

const start = 2;
const end = 33;

function loadExistingResults() {
  if (!existsSync(resultsPath)) return [];
  try {
    return JSON.parse(readFileSync(resultsPath, 'utf8'));
  } catch {
    return [];
  }
}

function saveResults(results) {
  writeFileSync(resultsPath, JSON.stringify(results, null, 2));
}

function loadPayload(num) {
  const name = `us-${String(num).padStart(4, '0')}`;
  const payload = JSON.parse(readFileSync(join(callDir, `${name}.json`), 'utf8'));
  return { file: `${name}.sql`, project_id: projectId, query: payload.query };
}

function executeViaCursorMcp(payload) {
  // Attempt cursor mcp invoke if available
  const argsFile = join(__dirname, '../supabase/batches/_payloads/_mcp_exec_args.json');
  writeFileSync(argsFile, JSON.stringify({ project_id: payload.project_id, query: payload.query }));

  const attempts = [
    ['cursor', 'mcp', 'call', 'plugin-supabase-supabase', 'execute_sql', '--args', argsFile],
    ['npx', '-y', '@supabase/mcp-server-supabase', 'execute_sql'],
  ];

  for (const cmd of attempts) {
    const r = spawnSync(cmd[0], cmd.slice(1), { encoding: 'utf8', timeout: 120000 });
    if (r.status === 0 && !r.error) {
      return { ok: true, output: r.stdout || 'ok' };
    }
  }
  return { ok: false, error: 'No CLI MCP bridge available; use CallMcpTool in agent' };
}

const existing = loadExistingResults();
const done = new Set(existing.filter((r) => r.status === 'success').map((r) => r.file));
const results = [...existing.filter((r) => done.has(r.file))];

for (let i = start; i <= end; i++) {
  const payload = loadPayload(i);
  if (done.has(payload.file)) {
    console.log(`skip ${payload.file} (already success)`);
    continue;
  }
  console.log(`executing ${payload.file}...`);
  const exec = executeViaCursorMcp(payload);
  if (exec.ok) {
    results.push({ file: payload.file, status: 'success' });
    done.add(payload.file);
    console.log(`  success`);
  } else {
    results.push({ file: payload.file, status: 'error', error: exec.error });
    console.log(`  error: ${exec.error}`);
  }
  saveResults(results);
}

console.log(JSON.stringify({ succeeded: results.filter((r) => r.status === 'success').length, total: end - start + 1 }));
