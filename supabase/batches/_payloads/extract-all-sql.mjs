import fs from 'fs';
const start = parseInt(process.argv[2] || '10', 10);
const end = parseInt(process.argv[3] || '33', 10);
for (let n = start; n <= end; n++) {
  const j = JSON.parse(fs.readFileSync(`_emit/call-${n}.json`, 'utf8'));
  fs.writeFileSync(`_q_${n}.sql`, j.query);
}
console.log(`extracted ${end - start + 1} sql files`);
