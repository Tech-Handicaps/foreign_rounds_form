/**
 * Execute all us-*.sql batch files via Supabase MCP is not available from Node.
 * This script prints batch file paths for manual/MCP import.
 * Prefer: npm run import:us-courses (needs SUPABASE_SERVICE_ROLE_KEY in .env.local)
 */
import { readdirSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";

const dir = resolve("supabase/batches");
const files = readdirSync(dir)
  .filter((f) => f.startsWith("us-") && f.endsWith(".sql"))
  .sort();

console.log(JSON.stringify({ count: files.length, files: files.map((f) => join(dir, f)) }));
