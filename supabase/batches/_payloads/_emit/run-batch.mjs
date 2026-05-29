import fs from 'fs';
const nums = process.argv.slice(2).map(Number);
for (const n of nums) {
  const j = JSON.parse(fs.readFileSync(`_emit/call-${n}.json`, 'utf8'));
  fs.writeFileSync(`_emit/exec-${n}.json`, JSON.stringify({ project_id: j.project_id, query: j.query }));
  console.log(n, j.query.length);
}
