import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from './client.ts';
import {
  addFunding, completeFunding, completeOutflow, failOutflow, LedgerError, reconcile, reserveSpend, startFunding, startLiquidation,
} from './ledger.ts';

// Ledger tests against the real database (DATABASE_URL). Each test makes its own vault under a
// throwaway user; everything is deleted at the end. No PayPal calls are made.

const run = Date.now().toString(36);
let userId: string;
let merchantId: string;

before(async () => {
  const merchant = await prisma.merchant.findFirst();
  assert.ok(merchant, 'seed the database first (npm run db:seed)');
  merchantId = merchant.id;
  userId = (await prisma.user.create({ data: { name: 'Ledger test', paypalEmail: `ledger-test-${run}@example.com` } })).id;
});

after(async () => {
  const vaults = { vault: { userId } };
  await prisma.ledgerEntry.deleteMany({ where: vaults });
  await prisma.decision.deleteMany({ where: vaults });
  await prisma.policy.deleteMany({ where: vaults });
  await prisma.vault.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

/** An ACTIVE vault holding `cents`, funded through a completed FUND entry (so reconcile agrees). */
async function fundedVault(cents: number) {
  const vault = await prisma.vault.create({
    data: { userId, name: `Ledger test ${run}`, type: 'SHOPPING', budgetCents: cents, expiresAt: new Date(Date.now() + 3_600_000) },
  });
  const orderId = `test-order-${vault.id}`;
  await startFunding(vault.id, cents, orderId);
  await completeFunding(orderId);
  return vault.id;
}

const spend = (vaultId: string, amountCents: number) => reserveSpend({ vaultId, amountCents, merchantId });
const code = (r: PromiseSettledResult<unknown>) =>
  r.status === 'rejected' && r.reason instanceof LedgerError ? r.reason.code : r.status;

test('double spend: two parallel spends that each fit, but not both, only one passes', async () => {
  const vaultId = await fundedVault(1000);
  const results = await Promise.allSettled([spend(vaultId, 700), spend(vaultId, 700)]);
  assert.deepEqual(results.map(code).sort(), ['INSUFFICIENT_VAULT_BALANCE', 'fulfilled']);
  const vault = await prisma.vault.findUniqueOrThrow({ where: { id: vaultId } });
  assert.equal(vault.balanceCents, 300);
  assert.ok((await reconcile(vaultId)).ok);
});

test('ten parallel spends never take more than the balance', async () => {
  const vaultId = await fundedVault(1000);
  const results = await Promise.allSettled(Array.from({ length: 10 }, () => spend(vaultId, 300)));
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 3);
  assert.equal((await prisma.vault.findUniqueOrThrow({ where: { id: vaultId } })).balanceCents, 100);
  assert.ok((await reconcile(vaultId)).ok);
});

test('funding the same order twice credits it once', async () => {
  const vaultId = await fundedVault(500);
  await completeFunding(`test-order-${vaultId}`);
  assert.equal((await prisma.vault.findUniqueOrThrow({ where: { id: vaultId } })).balanceCents, 500);
  assert.ok((await reconcile(vaultId)).ok);
});

test('the same subscription payment twice is added once', async () => {
  const vaultId = await fundedVault(500);
  await Promise.all([addFunding(vaultId, 200, `test-sale-${vaultId}`), addFunding(vaultId, 200, `test-sale-${vaultId}`)]);
  assert.equal((await prisma.vault.findUniqueOrThrow({ where: { id: vaultId } })).balanceCents, 700);
  assert.ok((await reconcile(vaultId)).ok);
});

test('a failed payout returns the money once, even if reported twice', async () => {
  const vaultId = await fundedVault(1000);
  const entry = await spend(vaultId, 400);
  assert.equal(await failOutflow(entry.id, 'test'), true);
  assert.equal(await failOutflow(entry.id, 'test'), false);
  assert.equal((await prisma.vault.findUniqueOrThrow({ where: { id: vaultId } })).balanceCents, 1000);
  assert.ok((await reconcile(vaultId)).ok);
});

test('liquidation waits for open spends, then refunds the rest and closes the vault', async () => {
  const vaultId = await fundedVault(1000);
  const entry = await spend(vaultId, 250);
  await assert.rejects(startLiquidation(vaultId), (e: unknown) => e instanceof LedgerError && e.code === 'PENDING_SPENDS');

  await completeOutflow(entry.id);
  const refund = await startLiquidation(vaultId);
  assert.equal(refund?.amountCents, 750);
  await assert.rejects(spend(vaultId, 100), (e: unknown) => e instanceof LedgerError && e.code === 'VAULT_INACTIVE');

  await completeOutflow(refund!.id);
  const vault = await prisma.vault.findUniqueOrThrow({ where: { id: vaultId } });
  assert.equal(vault.status, 'LIQUIDATED');
  assert.equal(vault.balanceCents, 0);
  assert.ok((await reconcile(vaultId)).ok);
});

test('an empty vault is closed without a refund entry', async () => {
  const vaultId = await fundedVault(300);
  await completeOutflow((await spend(vaultId, 300)).id);
  assert.equal(await startLiquidation(vaultId), null);
  assert.equal((await prisma.vault.findUniqueOrThrow({ where: { id: vaultId } })).status, 'LIQUIDATED');
});
