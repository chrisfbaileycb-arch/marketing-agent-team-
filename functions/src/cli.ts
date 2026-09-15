/**
 * Local dry run without Firebase:
 *   npm run dryrun -- "residential solar" "Colorado"     (research a vertical)
 *   npm run dryrun -- scout 1000 "United States"          (open-ended opportunity scout)
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
  const args = process.argv.slice(2);
  if (args[0] === 'scout') {
    const { runScout } = await import('./skills/scout');
    console.error(`Scouting via ${process.env.LLM_PROVIDER || 'gemini'}…`);
    const out = await runScout({ minCommission: Number(args[1] || 1000), region: args[2] || 'United States' });
    console.log(JSON.stringify(out, null, 2));
    return;
  }
  const [vertical = 'residential solar installation', region = 'Colorado, US'] = args;
  const { runResearch } = await import('./skills/research');
  console.error(`Researching "${vertical}" in ${region} via ${process.env.LLM_PROVIDER || 'gemini'}…`);
  const out = await runResearch({ vertical, region, minPayout: 100 }, (m) => console.error('  ' + m));
  console.log(JSON.stringify(out, null, 2));
}
main().catch((e) => { console.error(e); process.exit(1); });
