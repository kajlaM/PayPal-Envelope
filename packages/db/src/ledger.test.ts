import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from './client.ts';
import {
  addFunding, changeVaultPolicy, completeFunding, completeOutflow, failOutflow, LedgerError, reconcile, reserveSpend, startFunding,
  startLiquidation,
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

// ---------- Changing a vault's policy (and amount) ----------

const isCode = (c: string) => (e: unknown) => e instanceof LedgerError && e.code === c;

/** Saves a new policy version with `budgetCents` as the vault amount. */
const changeTo = (vaultId: string, budgetCents: number) =>
  changeVaultPolicy(vaultId, {
    policyJson: { test: true, budgetCents },
    sourceText: `test change to ${budgetCents}`,
    name: `Ledger test ${run} (changed)`,
    expiresAt: new Date(Date.now() + 7_200_000),
    budgetCents,
  });

const getVault = (vaultId: string) => prisma.vault.findUniqueOrThrow({ where: { id: vaultId } });

test('policy change keeps every version as history', async () => {
  const vaultId = await fundedVault(1000);
  await prisma.policy.create({ data: { vaultId, version: 1, policyJson: { test: true } } });
  const { policy } = await changeTo(vaultId, 1000);
  assert.equal(policy.version, 2);
  assert.equal((await changeTo(vaultId, 1000)).policy.version, 3);
  assert.deepEqual((await prisma.policy.findMany({ where: { vaultId }, orderBy: { version: 'asc' } })).map((p) => p.version), [1, 2, 3]);
  assert.equal((await getVault(vaultId)).name, `Ledger test ${run} (changed)`);
});

test('lowering the amount refunds the difference and keeps the vault active', async () => {
  const vaultId = await fundedVault(10000);
  const { refund, changeCents } = await changeTo(vaultId, 8000);
  assert.equal(changeCents, -2000);
  assert.equal(refund?.amountCents, 2000);
  assert.equal(refund?.type, 'LIQUIDATE');
  let vault = await getVault(vaultId);
  assert.equal(vault.budgetCents, 8000);
  assert.equal(vault.balanceCents, 8000);

  await completeOutflow(refund!.id); // the refund payout arrived
  vault = await getVault(vaultId);
  assert.equal(vault.status, 'ACTIVE');
  assert.equal(vault.balanceCents, 8000);
  assert.ok((await reconcile(vaultId)).ok);
});

test('a failed refund after lowering puts the money and the amount back', async () => {
  const vaultId = await fundedVault(10000);
  const { refund } = await changeTo(vaultId, 8000);
  await failOutflow(refund!.id, 'test');
  const vault = await getVault(vaultId);
  assert.equal(vault.balanceCents, 10000);
  assert.equal(vault.budgetCents, 10000);
  assert.ok((await reconcile(vaultId)).ok);
});

test('raising the amount needs the extra money paid in first', async () => {
  const vaultId = await fundedVault(10000);
  await assert.rejects(changeTo(vaultId, 12000), isCode('TOP_UP_NOT_PAID'));

  await startFunding(vaultId, 2000, `test-topup-${vaultId}`);
  await assert.rejects(changeTo(vaultId, 12000), isCode('TOP_UP_NOT_PAID')); // not captured yet
  await completeFunding(`test-topup-${vaultId}`);

  const { refund, changeCents } = await changeTo(vaultId, 12000);
  assert.equal(changeCents, 2000);
  assert.equal(refund, null);
  const vault = await getVault(vaultId);
  assert.equal(vault.budgetCents, 12000);
  assert.equal(vault.balanceCents, 12000);
  assert.ok((await reconcile(vaultId)).ok);
});

test('the amount cannot drop below what was already spent, or while a payment is in flight', async () => {
  const vaultId = await fundedVault(1000);
  const entry = await spend(vaultId, 700);
  await assert.rejects(changeTo(vaultId, 900), isCode('PENDING_SPENDS'));
  await completeOutflow(entry.id);
  await assert.rejects(changeTo(vaultId, 200), isCode('INSUFFICIENT_VAULT_BALANCE')); // only 300 left
  const { refund } = await changeTo(vaultId, 700); // spent 700: the rest (300) can come back
  assert.equal(refund?.amountCents, 300);
  assert.equal((await getVault(vaultId)).balanceCents, 0);
});

test('expired or closed vaults cannot be changed', async () => {
  const vaultId = await fundedVault(500);
  await startLiquidation(vaultId);
  await assert.rejects(changeTo(vaultId, 500), isCode('VAULT_INACTIVE'));
});

test('after lowering the amount, closing the vault refunds the rest and closes it', async () => {
  const vaultId = await fundedVault(1000);
  const { refund } = await changeTo(vaultId, 600);
  await assert.rejects(startLiquidation(vaultId), isCode('PENDING_SPENDS')); // waits for the first refund
  await completeOutflow(refund!.id);
  const closing = await startLiquidation(vaultId);
  assert.equal(closing?.amountCents, 600);
  await completeOutflow(closing!.id);
  const vault = await getVault(vaultId);
  assert.equal(vault.status, 'LIQUIDATED');
  assert.equal(vault.balanceCents, 0);
  assert.ok((await reconcile(vaultId)).ok);
});

test('a vault paid over time stays SAVING until it holds its full amount, and cannot spend before', async () => {
  const vault = await prisma.vault.create({
    data: {
      userId, name: `Ledger savings ${run}`, type: 'SHOPPING', budgetCents: 10000, expiresAt: new Date(Date.now() + 3_600_000),
      savingsPerPaymentCents: 4000, savingsEvery: 'MONTH', nextChargeAt: new Date(),
    },
  });
  const pay = async (n: number, cents: number) => {
    await startFunding(vault.id, cents, `test-save-${vault.id}-${n}`);
    return completeFunding(`test-save-${vault.id}-${n}`);
  };
  assert.equal((await pay(1, 4000)).status, 'SAVING');
  await assert.rejects(spend(vault.id, 100), (e: unknown) => e instanceof LedgerError && e.code === 'VAULT_INACTIVE');
  assert.equal((await pay(2, 4000)).status, 'SAVING');
  const done = await pay(3, 2000);
  assert.equal(done.status, 'ACTIVE');
  assert.equal(done.balanceCents, 10000);
  assert.equal(done.nextChargeAt, null); // no more payments
  assert.ok((await reconcile(vault.id)).ok);
});
