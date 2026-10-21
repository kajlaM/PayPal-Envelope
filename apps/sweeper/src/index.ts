// Cron job (Step 10): one background tick on the KubePay API, then exit.
// Render Cron Job, schedule "* * * * *", command: npm run start -w apps/sweeper
// The API does the work (sweeper + agent watch) so its dashboard events reach the browser.
import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';

config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

const api = (process.env.KUBEPAY_API_URL?.trim() || `http://localhost:${process.env.PORT ?? 4000}`).replace(/\/$/, '');
const key = process.env.INTERNAL_API_KEY?.trim();
if (!key) throw new Error('Missing INTERNAL_API_KEY in .env');

const res = await fetch(`${api}/api/jobs/tick`, { method: 'POST', headers: { 'x-internal-key': key } });
const body: any = await res.json().catch(() => ({}));
if (!res.ok) {
  console.error(`Tick failed (${res.status}):`, body);
  process.exit(1);
}
for (const s of body.swept ?? []) console.log(`[sweeper] vault ${s.vaultId}: ${s.action}`);
console.log(`Swept ${body.swept?.length ?? 0} vault(s), ran ${body.agentsRun?.length ?? 0} agent(s).`);
