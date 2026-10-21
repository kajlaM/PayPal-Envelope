import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeDraft, PolicyCompileError, type PolicyDraft } from './compiler.ts';

const merchants = [
  { name: 'Audio Store', category: 'Electronics' },
  { name: 'BestBuy', category: 'Electronics' },
  { name: 'City Utility', category: 'Utilities' },
];
const now = new Date('2026-10-21T12:00:00Z');

const draft = (over: Partial<PolicyDraft> = {}): PolicyDraft => ({
  vault_name: 'Headphones',
  vault_type: 'SHOPPING',
  allocated_budget: 50,
  max_single_transaction: 45,
  allowed_categories: ['Electronics', 'Audio'],
  approved_merchants: ['audio store'],
  expiry_timestamp: '2026-10-24T23:59:59+05:30',
  max_transactions_per_day: null,
  human_approval_above: null,
  currency_mentioned: 'USD',
  product_query: 'wireless headphones',
  required_keywords: [],
  preferred_keywords: [],
  allow_used: null,
  min_rating: null,
  max_delivery_days: null,
  price_weight: null,
  rating_weight: null,
  delivery_weight: null,
  model_match_weight: null,
  check_every_minutes: null,
  assumptions: [],
  ...over,
});

test('valid draft becomes a policy with registry merchant names', () => {
  const { policy, warnings } = normalizeDraft(draft(), merchants, now);
  assert.equal(policy.allocated_budget, 50);
  assert.equal(policy.rules.max_single_transaction, 45);
  assert.deepEqual(policy.rules.approved_merchants, ['Audio Store']);
  assert.equal(policy.rules.expiry_timestamp, '2026-10-24T18:29:59.000Z');
  assert.deepEqual(warnings, []);
});

test('per-payment limit above budget is clamped', () => {
  const { policy, warnings } = normalizeDraft(draft({ max_single_transaction: 80 }), merchants, now);
  assert.equal(policy.rules.max_single_transaction, 50);
  assert.ok(warnings.some((w) => w.includes('Per-payment limit')));
});

test('missing limit and expiry get safe defaults', () => {
  const { policy } = normalizeDraft(draft({ max_single_transaction: null, expiry_timestamp: null }), merchants, now);
  assert.equal(policy.rules.max_single_transaction, 50);
  assert.equal(policy.rules.expiry_timestamp, '2026-10-28T12:00:00.000Z');
});

test('past expiry is replaced, far expiry is capped at 90 days', () => {
  assert.equal(normalizeDraft(draft({ expiry_timestamp: '2026-10-01T00:00:00Z' }), merchants, now).policy.rules.expiry_timestamp, '2026-10-28T12:00:00.000Z');
  assert.equal(normalizeDraft(draft({ expiry_timestamp: '2027-12-01T00:00:00Z' }), merchants, now).policy.rules.expiry_timestamp, '2027-01-19T12:00:00.000Z');
});

test('unknown merchants are removed; none left falls back to category merchants', () => {
  const { policy, warnings } = normalizeDraft(draft({ approved_merchants: ['Amazon'] }), merchants, now);
  assert.deepEqual(policy.rules.approved_merchants, ['Audio Store', 'BestBuy']);
  assert.ok(warnings.some((w) => w.includes('Amazon')));
});

test('utility vault always allows the Utilities category', () => {
  const { policy } = normalizeDraft(
    draft({ vault_type: 'UTILITY', allowed_categories: ['Electricity'], approved_merchants: ['City Utility'] }), merchants, now);
  assert.deepEqual(policy.rules.allowed_categories, ['Electricity', 'Utilities']);
});

test('rejects non-USD, zero and huge budgets', () => {
  assert.throws(() => normalizeDraft(draft({ currency_mentioned: 'INR' }), merchants, now), PolicyCompileError);
  assert.throws(() => normalizeDraft(draft({ allocated_budget: 0 }), merchants, now), PolicyCompileError);
  assert.throws(() => normalizeDraft(draft({ allocated_budget: 50_000 }), merchants, now), PolicyCompileError);
});

test('shopping preferences: defaults are cheapest-first, new only, check every 3 hours', () => {
  const { policy } = normalizeDraft(draft(), merchants, now);
  assert.deepEqual(policy.shopping, {
    product_query: 'wireless headphones', required_keywords: [], preferred_keywords: [], condition: 'NEW',
    min_rating: undefined, max_delivery_days: undefined,
    weights: { price: 5, rating: 0, delivery: 0, model_match: 0 }, check_every_minutes: 180,
  });
});

test('shopping preferences: user rules and weights are kept and clamped', () => {
  const { policy } = normalizeDraft(draft({
    required_keywords: [' Sony ', 'Sony'], allow_used: true, min_rating: 4, max_delivery_days: 4.5,
    price_weight: 2, rating_weight: 9, delivery_weight: -1, check_every_minutes: 5,
  }), merchants, now);
  assert.deepEqual(policy.shopping?.required_keywords, ['Sony']);
  assert.equal(policy.shopping?.condition, 'ANY');
  assert.equal(policy.shopping?.max_delivery_days, 5);
  assert.deepEqual(policy.shopping?.weights, { price: 2, rating: 5, delivery: 0, model_match: 0 });
  assert.equal(policy.shopping?.check_every_minutes, 15);
});

test('utility vaults have no shopping preferences', () => {
  const { policy } = normalizeDraft(
    draft({ vault_type: 'UTILITY', allowed_categories: ['Electricity'], approved_merchants: ['City Utility'] }), merchants, now);
  assert.equal(policy.shopping, undefined);
});
