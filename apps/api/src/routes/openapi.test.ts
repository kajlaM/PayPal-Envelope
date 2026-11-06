import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Router } from 'express';
import { buildOpenApi, OPERATIONS } from '../openapi.ts';
import { auditRouter } from './audit.ts';
import { fundRequestsRouter } from './fund-requests.ts';
import { productsRouter } from './products.ts';
import { vaultsRouter } from './vaults.ts';

// The OpenAPI description must list exactly the routes the API serves (webhooks and the demo store
// are left out on purpose: PayPal and demos call them, not PayPalVault's site or agent).

const MOUNTS: [string, Router][] = [
  ['/api/vaults', vaultsRouter],
  ['/api/fund-requests', fundRequestsRouter],
  ['/api/products', productsRouter],
  ['/api/audit', auditRouter],
];
// Declared straight on the app in index.ts (importing it would start the server).
const APP_ROUTES = ['get /health', 'post /api/jobs/tick', 'get /api/merchants', 'get /api/ledger', 'get /api/decisions'];

const APP_INTERNAL = ['post /api/jobs/tick'];

type Layer = { route?: { path: string; methods: Record<string, boolean>; stack: { name: string }[] } };

/** Every route the API serves, and the ones guarded by requireInternalKey (read from Express itself). */
function served() {
  const routes = new Set(APP_ROUTES);
  const internal = new Set(APP_INTERNAL);
  for (const [base, router] of MOUNTS) {
    for (const layer of (router as unknown as { stack: Layer[] }).stack) {
      if (!layer.route) continue;
      const path = (base + (layer.route.path === '/' ? '' : layer.route.path)).replace(/:(\w+)/g, '{$1}');
      for (const method of Object.keys(layer.route.methods)) {
        routes.add(`${method} ${path}`);
        if (layer.route.stack.some((h) => h.name === 'requireInternalKey')) internal.add(`${method} ${path}`);
      }
    }
  }
  return { routes, internal };
}

test('the OpenAPI description lists every route the API serves, and nothing else', () => {
  const described = new Set(OPERATIONS.map((o) => `${o.method} ${o.path}`));
  const actual = served().routes;
  assert.deepEqual([...actual].filter((r) => !described.has(r)).sort(), [], 'routes missing from the OpenAPI description');
  assert.deepEqual([...described].filter((r) => !actual.has(r)).sort(), [], 'described routes the API does not serve');
});

test('money can only leave a vault through the Policy Engine, and agent routes need the internal key', () => {
  const doc = buildOpenApi() as any;
  const ops = Object.entries(doc.paths).flatMap(([path, methods]: [string, any]) =>
    Object.entries(methods).map(([method, op]: [string, any]) => ({ path, method, ...op })));
  // The description marks exactly the routes the code guards with the internal key.
  const marked = ops.filter((op) => op.security?.some((s: any) => 'InternalKey' in s));
  assert.deepEqual(marked.map((op) => `${op.method} ${op.path}`).sort(), [...served().internal].sort());
  // Buying always goes through the Policy Engine: the agent's only purchase operation is requestPurchase.
  assert.ok(marked.some((op) => op.operationId === 'requestPurchase'));
  assert.equal(doc.servers.length, 1);
  assert.match(doc.servers[0].url, /^http:\/\/localhost:/); // private: no public server
  assert.ok(new Set(ops.map((op) => op.operationId)).size === ops.length, 'operationIds are unique');
});
