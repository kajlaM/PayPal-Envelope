import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, type EngineContext, type VaultSnapshot } from './engine.ts';
import { isCategoryAllowed } from './categories.ts';
import type { Policy, SpendRequest } from './schema.ts';

const now = new Date('2026-10-21T12:00:00Z');
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000);

const shopVault: VaultSnapshot = { type: 'SHOPPING', status: 'ACTIVE', balanceCents: 5000, expiresAt: new Date('2026-10-25T00:00:00Z') };
const utilVault: VaultSnapshot = { ...shopVault, type: 'UTILITY', balanceCents: 25000 };

const policy = (rules: Partial<Policy['rules']> = {}): Policy => ({
  vault_name: 'Test',
  vault_type: 'SHOPPING',
  allocated_budget: 50,
  currency: 'USD',
  rules: {
    max_single_transaction: 45,
    allowed_categories: ['Electronics'],
    approved_merchants: ['Audio Store', 'City Utility'],
    expiry_timestamp: '2026-10-25T00:00:00Z',
    on_policy_violation: 'BLOCK_AND_ALERT',
    ...rules,
  },
  liquidation: { auto_refund: true },
});

const req = (over: Partial<SpendRequest> = {}): SpendRequest => ({
  merchant: 'Audio Store', amount: 39.99, category: 'Audio', reason: 'headphones', verified_price: 39.99, ...over,
});

const ctx = (over: Partial<EngineContext> = {}): EngineContext => ({
  recentSpends: [], merchant: { name: 'Audio Store', category: 'Electronics' }, ...over,
});

const run = (o: { vault?: VaultSnapshot; policy?: Policy; req?: SpendRequest; ctx?: EngineContext; ignoreSoft?: boolean } = {}) =>
  evaluate(o.vault ?? shopVault, o.policy ?? policy(), o.req ?? req(), o.ctx ?? ctx(), { now, ignoreSoft: o.ignoreSoft });

test('valid verified purchase is approved', () => {
  assert.deepEqual(run(), { result: 'APPROVE', reasons: [] });
});

test('hard rules block', () => {
  const blocked = (o: Parameters<typeof run>[0], reason: string) => {
    const d = run(o);
    assert.equal(d.result, 'BLOCK', reason);
    assert.ok(d.reasons.includes(reason), `${reason} in ${d.reasons}`);
  };
  blocked({ vault: { ...shopVault, status: 'PENDING_FUNDING' } }, 'VAULT_INACTIVE');
  blocked({ vault: { ...shopVault, expiresAt: minutesAgo(1) } }, 'VAULT_EXPIRED');
  blocked({ req: req({ amount: 48, verified_price: 48 }) }, 'MAX_LIMIT_EXCEEDED');
  blocked({ vault: { ...shopVault, balanceCents: 1001 } }, 'INSUFFICIENT_VAULT_BALANCE');
  blocked({ req: req({ merchant: 'Amazon' }) }, 'MERCHANT_NOT_APPROVED');
  blocked({ ctx: ctx({ merchant: null }) }, 'MERCHANT_NOT_REGISTERED');
  blocked({ req: req({ category: 'Groceries' }) }, 'CATEGORY_NOT_ALLOWED');
  blocked({ policy: policy({ max_transactions_per_day: 2 }), ctx: ctx({ recentSpends: [
    { merchant: 'BestBuy', amountCents: 100, at: minutesAgo(300) },
    { merchant: 'BestBuy', amountCents: 200, at: minutesAgo(200) },
  ] }) }, 'DAILY_LIMIT_REACHED');
  blocked({ req: req({ amount: 39.99, verified_price: 34.99 }) }, 'PRICE_MISMATCH');
});

test('soft rules need a human, and ignoreSoft lets an approved one through', () => {
  const human = (o: Parameters<typeof run>[0], reason: string) => {
    const d = run(o);
    assert.equal(d.result, 'NEEDS_HUMAN', reason);
    assert.ok(d.reasons.includes(reason));
    assert.equal(run({ ...o, ignoreSoft: true }).result, 'APPROVE');
  };
  human({ req: req({ verified_price: undefined }) }, 'PRICE_NOT_VERIFIED');
  human({ ctx: ctx({ recentSpends: [{ merchant: 'audio store', amountCents: 3999, at: minutesAgo(3) }] }) }, 'POSSIBLE_DUPLICATE');
  human({ ctx: ctx({ anomalyScore: 0.95 }) }, 'UNUSUAL_SPEND');
  human({ policy: policy({ human_approval_above: 30 }) }, 'ABOVE_HUMAN_APPROVAL_THRESHOLD');
});

test('a hard block wins over soft flags', () => {
  const d = run({ req: req({ amount: 48, verified_price: undefined }) });
  assert.deepEqual(d, { result: 'BLOCK', reasons: ['MAX_LIMIT_EXCEEDED'] });
});

test('same purchase 11 minutes later is not a duplicate', () => {
  assert.equal(run({ ctx: ctx({ recentSpends: [{ merchant: 'Audio Store', amountCents: 3999, at: minutesAgo(11) }] }) }).result, 'APPROVE');
});

test('utility bills: open invoice from the merchant, exact amount, paid once', () => {
  const p = policy({ allowed_categories: ['Utilities'], max_single_transaction: 250 });
  const bill = (over: Partial<SpendRequest> = {}) =>
    req({ merchant: 'City Utility', category: 'Electricity', amount: 120.5, verified_price: undefined, invoice_id: 'INV2-1', ...over });
  const utilCtx = (invoice: EngineContext['invoice']) =>
    ctx({ merchant: { name: 'City Utility', category: 'Utilities' }, invoice });
  const open = { found: true, status: 'SENT', amountCents: 12050, issuedByMerchant: true, alreadyPaid: false };
  const check = (r: SpendRequest, c: EngineContext) => evaluate(utilVault, p, r, c, { now });

  assert.deepEqual(check(bill(), utilCtx(open)), { result: 'APPROVE', reasons: [] });
  assert.deepEqual(check(bill({ invoice_id: undefined }), utilCtx(undefined)).reasons, ['INVOICE_REQUIRED']);
  assert.deepEqual(check(bill(), utilCtx({ found: false })).reasons, ['INVOICE_NOT_FOUND']);
  assert.deepEqual(check(bill({ amount: 130 }), utilCtx(open)).reasons, ['INVOICE_MISMATCH']);
  assert.deepEqual(check(bill(), utilCtx({ ...open, status: 'PAID' })).reasons, ['INVOICE_NOT_OPEN']);
  assert.deepEqual(check(bill(), utilCtx({ ...open, alreadyPaid: true })).reasons, ['INVOICE_NOT_OPEN']);
  assert.deepEqual(check(bill(), utilCtx({ ...open, issuedByMerchant: false })).reasons, ['INVOICE_MERCHANT_MISMATCH']);
});

test('category tree: child allowed under parent, not parent under child', () => {
  assert.ok(isCategoryAllowed('Audio', ['Electronics']));
  assert.ok(isCategoryAllowed('Headphones', ['electronics']));
  assert.ok(isCategoryAllowed('Electricity', ['Utilities']));
  assert.ok(!isCategoryAllowed('Electronics', ['Audio']));
  assert.ok(!isCategoryAllowed('Groceries', ['Electronics']));
});

test('control setting: Ask me never buys alone, Autopilot ignores the threshold, old vaults ask above $X', () => {
  const askMe = run({ policy: policy({ control_mode: 'ASK_ME' }) });
  assert.deepEqual(askMe, { result: 'NEEDS_HUMAN', reasons: ['OWNER_APPROVAL_REQUIRED'] });
  // The owner picked this exact purchase from the agent's options: it goes through.
  assert.equal(evaluate(shopVault, policy({ control_mode: 'ASK_ME' }), req(), ctx(), { now, ownerChose: true }).result, 'APPROVE');

  assert.equal(run({ policy: policy({ control_mode: 'AUTOPILOT', human_approval_above: 30 }) }).result, 'APPROVE');
  assert.deepEqual(run({ policy: policy({ control_mode: 'ASK_ABOVE', human_approval_above: 30 }) }).reasons, ['ABOVE_HUMAN_APPROVAL_THRESHOLD']);
  assert.equal(run({ policy: policy({ control_mode: 'ASK_ABOVE' }) }).result, 'APPROVE'); // no threshold: never asks
  assert.deepEqual(run({ policy: policy({ human_approval_above: 30 }) }).reasons, ['ABOVE_HUMAN_APPROVAL_THRESHOLD']); // no mode = ASK_ABOVE
});

test('control setting never hides safety flags or hard rules', () => {
  const auto = policy({ control_mode: 'AUTOPILOT' });
  assert.deepEqual(run({ policy: auto, req: req({ verified_price: undefined }) }).reasons, ['PRICE_NOT_VERIFIED']);
  assert.deepEqual(run({ policy: auto, ctx: ctx({ anomalyScore: 0.95 }) }).reasons, ['UNUSUAL_SPEND']);
  const chosen = evaluate(shopVault, policy({ control_mode: 'ASK_ME' }), req({ amount: 46, verified_price: 46 }), ctx(), { now, ownerChose: true });
  assert.deepEqual(chosen, { result: 'BLOCK', reasons: ['MAX_LIMIT_EXCEEDED'] });
});
