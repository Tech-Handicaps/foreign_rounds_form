import fs from 'fs';
const n = process.argv[2];
const j = JSON.parse(fs.readFileSync(`_mcp_slot/${n}.json`, 'utf8'));
// stdout: single-line JSON for agent CallMcpTool arguments
process.stdout.write(JSON.stringify({ project_id: j.project_id, query: j.query }));
