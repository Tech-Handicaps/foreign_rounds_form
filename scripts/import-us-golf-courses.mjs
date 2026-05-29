/**
 * Import US golf courses from OpenGolfAPI (ODbL)
 * https://github.com/opengolfapi/data
 *
 * Usage: node scripts/import-us-golf-courses.mjs [path-to-csv.gz]
 */

import { createReadStream, existsSync } from "node:fs";
import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "node:path";

const COUNTRY = "United States";
const BATCH_SIZE = 500;

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key || key.includes("YOUR_")) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const csvPath =
  process.argv[2] ||
  process.env.OPENGOLF_CSV ||
  resolve(process.env.TEMP || "/tmp", "opengolf-us.csv.gz");

if (!existsSync(csvPath)) {
  console.error(`CSV not found: ${csvPath}`);
  console.error("Download: https://github.com/opengolfapi/data/raw/main/opengolfapi-us.csv.gz");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

async function readCourses() {
  const names = new Set();
  const stream = createReadStream(csvPath).pipe(createGunzip());
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  let headers = null;
  let nameIdx = -1;

  for await (const line of rl) {
    if (!headers) {
      headers = parseCsvLine(line);
      nameIdx = headers.indexOf("name");
      if (nameIdx < 0) throw new Error("CSV missing 'name' column");
      continue;
    }
    const cols = parseCsvLine(line);
    const name = cols[nameIdx]?.trim();
    if (name) names.add(name);
  }

  return [...names];
}

async function insertBatch(rows) {
  const { error } = await supabase.from("golf_courses").upsert(rows, {
    onConflict: "country,name",
    ignoreDuplicates: true,
  });
  if (error) throw error;
}

async function main() {
  console.log(`Reading ${csvPath}…`);
  const names = await readCourses();
  console.log(`Found ${names.length} unique course names for ${COUNTRY}`);

  let inserted = 0;
  for (let i = 0; i < names.length; i += BATCH_SIZE) {
    const chunk = names.slice(i, i + BATCH_SIZE).map((name) => ({
      country: COUNTRY,
      name,
    }));
    await insertBatch(chunk);
    inserted += chunk.length;
    process.stdout.write(`\rImported ${inserted}/${names.length}`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
