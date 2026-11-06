// Writes the PayPalVault API description (OpenAPI 3.1) to openapi/paypalvault.openapi.json.
// Run: npm run openapi -w @paypalvault/api   (built from the same zod schemas the routes validate with)
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildOpenApi } from '../src/openapi.ts';

const out = fileURLToPath(new URL('../openapi/paypalvault.openapi.json', import.meta.url));
await mkdir(fileURLToPath(new URL('../openapi/', import.meta.url)), { recursive: true });
const doc = buildOpenApi();
await writeFile(out, `${JSON.stringify(doc, null, 2)}\n`);
console.log(`OpenAPI description written: ${Object.keys(doc.paths).length} paths -> ${out}`);
