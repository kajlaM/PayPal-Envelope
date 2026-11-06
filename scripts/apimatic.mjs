// APIMatic, kept private: SDKs and a static docs portal built from PayPalVault's own API description
// (apimatic/vault) and PayPal's published descriptions of the APIs its Server SDK lacks (apimatic/paypal).
// Nothing is published: the portal is static files on this machine, the SDKs are local packages.
//
//   npm run apimatic -- spec          write the latest API description into apimatic/vault/src/spec
//   npm run apimatic -- sdk           PayPalVault TypeScript SDK  -> packages/vault-sdk
//   npm run apimatic -- portal        private docs portal         -> apimatic/vault/portal (static files)
//   npm run apimatic -- serve         view the private portal on this machine only (localhost)
//   npm run apimatic -- paypal-sdk    PayPal Payouts + Invoicing + Webhooks SDK -> packages/paypal-rest-sdk
//
// The SDK and portal steps need an APIMatic login first:  npx @apimatic/cli@2.2.0 auth login
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const cli = (...args) => execFileSync('npx', ['-y', '@apimatic/cli@2.2.0', ...args], { cwd: root, stdio: 'inherit' });
const spec = () => {
  execFileSync('npm', ['run', 'openapi', '-w', '@paypalvault/api'], { cwd: root, stdio: 'inherit' });
  copyFileSync(`${root}apps/api/openapi/paypalvault.openapi.json`, `${root}apimatic/vault/src/spec/paypalvault.openapi.json`);
  console.log('API description copied to apimatic/vault/src/spec');
};

// PayPal's own descriptions (apimatic/paypal/original, as downloaded from
// github.com/paypal/paypal-rest-api-specifications) get two fixes before generation:
//  1. They list error MESSAGES as enum values, some longer than APIMatic's 100-character name limit.
//     Those lists only label error text, so they become plain strings.
//  2. They mark fields 'required' that PayPal does not always send (a FAILED payout item's error has no
//     debug_id), and the SDK refuses a reply missing one. A failed payout is exactly when its status
//     must be read, so 'required' lists are dropped: every field is optional, as the callers already treat them.
const paypalSpecs = () => {
  const strip = (node) => {
    if (Array.isArray(node)) return node.map(strip);
    if (!node || typeof node !== 'object') return node;
    const out = Object.fromEntries(Object.entries(node).map(([k, v]) => [k, strip(v)]));
    if (Array.isArray(out.enum) && out.enum.some((v) => typeof v === 'string' && v.length > 60)) delete out.enum;
    if (Array.isArray(out.required) && out.properties) delete out.required;
    return out;
  };
  for (const file of readdirSync(`${root}apimatic/paypal/original`).filter((f) => f.endsWith('.json'))) {
    const dir = `${root}apimatic/paypal/src/spec/${file.replace(/\.json$/, '')}`;
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/openapi.json`, `${JSON.stringify(strip(JSON.parse(readFileSync(`${root}apimatic/paypal/original/${file}`, 'utf8'))), null, 2)}\n`);
  }
  console.log('PayPal descriptions prepared in apimatic/paypal/src/spec');
};

const steps = {
  spec,
  sdk: () => { spec(); cli('sdk', 'generate', '-i', 'apimatic/vault', '-l', 'typescript', '-d', 'packages/vault-sdk', '-f'); },
  portal: () => { spec(); cli('portal', 'generate', '-i', 'apimatic/vault', '-d', 'apimatic/vault/portal', '-f'); },
  serve: () => cli('portal', 'serve', '-i', 'apimatic/vault'),
  'paypal-sdk': () => { paypalSpecs(); cli('sdk', 'generate', '-i', 'apimatic/paypal', '-l', 'typescript', '-d', 'packages/paypal-rest-sdk', '-f'); },
};

const step = process.argv[2];
if (!steps[step]) {
  console.error(`Usage: npm run apimatic -- ${Object.keys(steps).join(' | ')}`);
  process.exit(1);
}
steps[step]();
