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
  control_mode: null,
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
  list_items: [],
  savings_amount_per_payment: null,
  savings_every: null,
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

test('control setting: Ask me by default, Ask above needs an amount, Autopilot when asked for', () => {
  assert.equal(normalizeDraft(draft(), merchants, now).policy.rules.control_mode, 'ASK_ME');

  const above = normalizeDraft(draft({ human_approval_above: 30 }), merchants, now).policy.rules;
  assert.equal(above.control_mode, 'ASK_ABOVE');
  assert.equal(above.human_approval_above, 30);

  const noAmount = normalizeDraft(draft({ control_mode: 'ASK_ABOVE' }), merchants, now);
  assert.equal(noAmount.policy.rules.control_mode, 'ASK_ME');
  assert.ok(noAmount.warnings.some((w) => w.includes('top 3')));

  const auto = normalizeDraft(draft({ control_mode: 'AUTOPILOT', human_approval_above: 30 }), merchants, now).policy.rules;
  assert.equal(auto.control_mode, 'AUTOPILOT');
  assert.equal(auto.human_approval_above, undefined);
});

test('several different items become a shopping list with their own limits', () => {
  const list = (items: PolicyDraft['list_items'], over: Partial<PolicyDraft> = {}) =>
    normalizeDraft(draft({ allocated_budget: 700, max_single_transaction: null, list_items: items, ...over }), merchants, now);

  const { policy } = list([
    { name: 'Laptop', product_query: 'laptop', max_price: 600, required_keywords: [], category: 'Electronics' },
    { name: 'Bag', product_query: 'school backpack', max_price: 50, required_keywords: [], category: 'Luggage & Bags' },
    { name: 'Headphones', product_query: 'headphones', max_price: 40, required_keywords: [], category: 'electronics' },
  ]);
  assert.deepEqual(policy.rules.allowed_categories, ['Electronics', 'Audio', 'Luggage & Bags']);
  assert.deepEqual(policy.shopping?.list?.items.map((i) => [i.id, i.max_price]), [['laptop', 600], ['bag', 50], ['headphones', 40]]);
  assert.equal(policy.shopping?.list?.rebalance, 'LEFTOVER');

  // An item without a price shares what is left; a low per-payment limit is raised to the biggest item.
  const shared = list(
    [
      { name: 'Laptop', product_query: 'laptop', max_price: 600, required_keywords: [], category: null },
      { name: 'Bag', product_query: 'bag', max_price: null, required_keywords: [], category: null },
      { name: 'Bag', product_query: 'bag', max_price: null, required_keywords: [], category: null },
    ],
    { max_single_transaction: 100 },
  );
  assert.deepEqual(shared.policy.shopping?.list?.items.map((i) => [i.id, i.max_price]), [['laptop', 600], ['bag', 50], ['bag-2', 50]]);
  assert.equal(shared.policy.rules.max_single_transaction, 600);
  assert.ok(shared.warnings.some((w) => w.includes('raised to $600')));

  // One item is not a list.
  assert.equal(list([{ name: 'Laptop', product_query: 'laptop', max_price: 600, required_keywords: [], category: null }]).policy.shopping?.list, undefined);
});

test('paying in over time: a plan, an end date after the last payment, and save-only vaults', () => {
  // "I want a $100 speaker but can only pay $20 a month"
  const toBuy = normalizeDraft(draft({ allocated_budget: 100, max_single_transaction: 100, savings_amount_per_payment: 20, savings_every: 'MONTH', expiry_timestamp: null }), merchants, now);
  assert.deepEqual(toBuy.policy.savings, { amount_per_payment: 20, every: 'MONTH' });
  // 5 payments: the last on Feb 21, then two weeks to buy.
  assert.equal(toBuy.policy.rules.expiry_timestamp, '2027-03-07T12:00:00.000Z');

  // A pure savings goal: no shops, no categories, never spends.
  const save = normalizeDraft(draft({ vault_type: 'SAVINGS', allocated_budget: 300, approved_merchants: [], allowed_categories: [], savings_amount_per_payment: 25, savings_every: 'WEEK', product_query: null }), merchants, now);
  assert.equal(save.policy.vault_type, 'SAVINGS');
  assert.deepEqual(save.policy.rules.approved_merchants, []);
  assert.equal(save.policy.shopping, undefined);
  assert.equal(save.policy.rules.expiry_timestamp, '2027-01-13T12:00:00.000Z'); // 12 weekly payments (first today, last Jan 6) + 7 days

  assert.throws(() => normalizeDraft(draft({ vault_type: 'SAVINGS', savings_amount_per_payment: null }), merchants, now), /how much to put in/);
  assert.throws(() => normalizeDraft(draft({ allocated_budget: 5000, savings_amount_per_payment: 10, savings_every: 'WEEK' }), merchants, now), /longer than 2 years/);
  // Paying the whole amount at once is not a plan.
  assert.equal(normalizeDraft(draft({ savings_amount_per_payment: 50 }), merchants, now).policy.savings, undefined);
  // No interval: monthly.
  assert.equal(normalizeDraft(draft({ savings_amount_per_payment: 10 }), merchants, now).policy.savings?.every, 'MONTH');
});
