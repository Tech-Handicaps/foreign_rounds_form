import fs from 'fs';
const n = process.argv[2];
const j = JSON.parse(fs.readFileSync(`_emit/call-${n}.json`, 'utf8'));
process.stdout.write(JSON.stringify({ project_id: j.project_id, query: j.query }));
