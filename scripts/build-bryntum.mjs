// Builds the Bryntum bundle the site loads (paypal-interface/vendor/bryntum.{js,css} + fonts).
// Run: npm run build:bryntum. The site server also runs it on start when the bundle is missing.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const site = fileURLToPath(new URL('../paypal-interface/', import.meta.url));
export const BRYNTUM_OUT = `${site}vendor`;

export async function buildBryntum() {
  await build({
    entryPoints: { bryntum: `${site}bryntum/entry.js` },
    bundle: true,
    minify: true,
    format: 'iife',
    globalName: 'Bryntum',
    target: 'es2022',
    outdir: BRYNTUM_OUT,
    logLevel: 'warning',
  });
  await build({
    entryPoints: { bryntum: `${site}bryntum/entry.css` },
    bundle: true,
    minify: true,
    outdir: BRYNTUM_OUT,
    loader: { '.woff2': 'file', '.woff': 'file', '.ttf': 'file', '.eot': 'file', '.svg': 'file' },
    assetNames: 'fonts/[name]-[hash]',
    logLevel: 'warning',
  });
}

export async function ensureBryntum() {
  if (!existsSync(`${BRYNTUM_OUT}/bryntum.js`) || !existsSync(`${BRYNTUM_OUT}/bryntum.css`)) await buildBryntum();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const t = Date.now();
  await buildBryntum();
  console.log(`Bryntum bundle built in ${Date.now() - t} ms -> ${BRYNTUM_OUT}`);
}
