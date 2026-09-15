/**
 * Local dry run without Firebase: `npm run dryrun -- "residential solar" "Colorado"`
 * Needs functions/.env with a model key. Prints the research result to stdout.
 */
import * as fs from 'fs';
import * as path from 'path';

// minimal .env loader so this works outside the Functions runtime
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"#]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}

async function main() {
  const [vertical = 'residential solar installation', region = 'Colorado, US'] = process.argv.slice(2);
  const { runResearch } = await import('./skills/research');
  console.error(`Researching "${vertical}" in ${region} via ${process.env.LLM_PROVIDER || 'gemini'}…`);
  const out = await runResearch({ vertical, region, minPayout: 100 }, (m) => console.error('  ' + m));
  console.log(JSON.stringify(out, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
