// One command for the whole stack: KubePay API + PayPal site + Cloudflare link.
//   npm run up            ->  prints https://<name>.trycloudflare.com
//   npm run up -- --local ->  same, without the tunnel (http://localhost:3000)
// Ctrl+C stops everything. If one part crashes, the others are stopped too.

import { type ChildProcess, spawn } from 'node:child_process';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const API_PORT = Number(process.env.PORT ?? 4000);
const SITE_PORT = Number(process.env.INTERFACE_PORT ?? 3000);
const LOCAL_ONLY = process.argv.includes('--local');

const colors = { api: 36, site: 35, tunnel: 33, up: 32 } as const;
type Name = keyof typeof colors;
const tag = (name: Name) => `\x1b[${colors[name]}m[${name}]\x1b[0m`;
const log = (name: Name, line: string) => console.log(`${tag(name)} ${line}`);

const children: ChildProcess[] = [];
let stopping = false;

function stopAll(code = 0) {
  if (stopping) return;
  stopping = true;
  log('up', 'Stopping...');
  for (const child of children) {
    // Each child leads its own process group, so npm/tsx and their children all stop.
    if (child.pid && child.exitCode === null) {
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch {}
    }
  }
  setTimeout(() => process.exit(code), 1500).unref();
}

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));

function start(name: Name, command: string, args: string[], env: Record<string, string> = {}, onLine?: (line: string) => void) {
  const child = spawn(command, args, { cwd: ROOT, env: { ...process.env, ...env }, detached: true });
  children.push(child);
  for (const stream of [child.stdout, child.stderr]) {
    let buffered = '';
    stream?.on('data', (chunk: Buffer) => {
      buffered += chunk.toString();
      const lines = buffered.split('\n');
      buffered = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.trim() || stopping) continue; // npm prints "command failed" when we stop it
        if (onLine) onLine(line);
        else log(name, line);
      }
    });
  }
  child.on('exit', (code) => {
    if (stopping) return;
    log(name, `exited (code ${code}). Stopping the rest.`);
    stopAll(1);
  });
  return child;
}

function portFree(port: number) {
  return new Promise<boolean>((resolve) => {
    const probe = net.createServer().once('error', () => resolve(false));
    probe.listen(port, () => probe.close(() => resolve(true)));
  });
}

async function ready(url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline && !stopping) {
    const ok = await fetch(url, { signal: AbortSignal.timeout(4000) }).then((r) => r.ok).catch(() => false);
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function waitFor(name: Name, url: string, timeoutMs: number) {
  if (await ready(url, timeoutMs)) return;
  if (!stopping) {
    log(name, `did not become ready at ${url}`);
    stopAll(1);
  }
  throw new Error('not ready');
}

/** Starts the quick tunnel and resolves with its public URL once it answers. */
function startTunnel() {
  return new Promise<string>((resolve) => {
    let found = false;
    start('tunnel', 'npx', ['-y', 'cloudflared', 'tunnel', '--no-autoupdate', '--url', `http://localhost:${SITE_PORT}`], {}, (line) => {
      const url = line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)?.[0];
      if (url && !found) {
        found = true;
        resolve(url);
      }
      if (/\bERR\b|error/i.test(line)) log('tunnel', line); // cloudflared is chatty: only show problems
    });
  });
}

function banner(url: string) {
  const lines = [
    'Your PayPal site is live:',
    '',
    `  ${url}`,
    '',
    'Log in with kajla / 1234 or jugal / 1234',
    LOCAL_ONLY ? 'Local only (no Cloudflare link).' : `PayPal webhooks: npm run setup:webhooks -w packages/paypal -- ${url}`,
    'Press Ctrl+C to stop everything.',
  ];
  const width = Math.max(...lines.map((l) => l.length)) + 4;
  console.log(`\n\x1b[32m${'='.repeat(width)}`);
  for (const l of lines) console.log(`  ${l}`);
  console.log(`${'='.repeat(width)}\x1b[0m\n`);
}

async function main() {
  for (const [name, port] of [['api', API_PORT], ['site', SITE_PORT]] as const) {
    if (!(await portFree(port))) {
      log(name, `port ${port} is already in use. Stop whatever is running there and try again.`);
      process.exit(1);
    }
  }

  // The Cloudflare link comes first: the API puts it in alert emails (SITE_URL), so their
  // "Open the vault" links work from any phone. cloudflared prints it before the site is up.
  let url = `http://localhost:${SITE_PORT}`;
  if (!LOCAL_ONLY) {
    log('up', 'Opening the Cloudflare link (first run downloads cloudflared)...');
    url = await startTunnel();
    log('up', `Got ${url}`);
  }

  log('up', 'Starting the KubePay API...');
  start('api', 'npm', ['run', 'api:start'], { SITE_URL: url });
  await waitFor('api', `http://localhost:${API_PORT}/health`, 60_000);
  log('up', `API ready on http://localhost:${API_PORT}`);

  log('up', 'Starting the PayPal site...');
  start('site', 'npm', ['run', 'site:start']);
  await waitFor('site', `http://localhost:${SITE_PORT}/health`, 60_000);
  log('up', `Site ready on http://localhost:${SITE_PORT}`);

  if (!LOCAL_ONLY) {
    // New quick-tunnel hostnames take a few seconds to resolve; the link usually works even if this check is slow.
    log('up', 'Waiting for the Cloudflare link to answer...');
    if (!(await ready(`${url}/health`, 60_000)) && !stopping) log('tunnel', 'Link not answering yet from this machine; give it a minute.');
  }
  if (!stopping) banner(url);
}

main().catch((err) => {
  if (!stopping) {
    console.error(err);
    stopAll(1);
  }
});
