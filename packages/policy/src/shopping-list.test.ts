import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, type EngineContext, type VaultSnapshot } from './engine.ts';
import { PolicySchema, type Policy, type SpendRequest } from './schema.ts';
import { itemPrefs, itemProgress } from './shopping-list.ts';

// "Back to school: laptop ≤ $600, bag ≤ $50, headphones ≤ $40, total $700"
const now = new Date('2026-10-21T12:00:00Z');
const school = (rebalance?: 'LEFTOVER' | 'NONE'): Policy =>
  PolicySchema.parse({
    vault_name: 'Back to school',
    vault_type: 'SHOPPING',
    allocated_budget: 700,
    rules: {
      max_single_transaction: 700,
      allowed_categories: ['Electronics'],
      approved_merchants: ['BestBuy'],
      expiry_timestamp: '2026-11-25T00:00:00Z',
      control_mode: 'AUTOPILOT',
    },
    shopping: {
      product_query: 'back to school',
      list: {
        rebalance,
        items: [
          { id: 'laptop', name: 'Laptop', product_query: 'laptop', max_price: 600 },
          { id: 'bag', name: 'Bag', product_query: 'school backpack', max_price: 50, required_keywords: ['backpack'] },
          { id: 'headphones', name: 'Headphones', product_query: 'headphones', max_price: 40 },
        ],
      },
    },
  });
const limits = (p: Policy, balance: number, spent: Record<string, number> = {}) =>
  Object.fromEntries(itemProgress(p, balance, spent).map((i) => [i.id, i.limitCents]));

test('item limits: unplanned money and leftovers go to the items still to buy, never below the others', () => {
  // $700 in the vault, limits add up to $690: each item may use the $10 nobody planned for.
  assert.deepEqual(limits(school(), 70000), { laptop: 61000, bag: 6000, headphones: 5000 });
  // Laptop bought for $560: $140 left, bag + headphones planned $90, so $50 spare.
  assert.deepEqual(limits(school(), 14000, { laptop: 56000 }), { laptop: 0, bag: 10000, headphones: 9000 });
  // NONE: every item stays at its own limit.
  assert.deepEqual(limits(school('NONE'), 14000, { laptop: 56000 }), { laptop: 0, bag: 5000, headphones: 4000 });
  // Less money than planned: an item still gets its own limit, as long as the balance has it.
  assert.deepEqual(limits(school(), 7000, { laptop: 63000 }), { laptop: 0, bag: 5000, headphones: 4000 });
  assert.deepEqual(limits(school(), 3000, { laptop: 63000, bag: 4000 }), { laptop: 0, bag: 0, headphones: 3000 });
});

test('the engine enforces the list: an item on it, not bought yet, within its limit', () => {
  const vault = (balanceCents: number): VaultSnapshot => ({ type: 'SHOPPING', status: 'ACTIVE', balanceCents, expiresAt: new Date('2026-11-25T00:00:00Z') });
  const ctx = (itemSpentCents: Record<string, number> = {}): EngineContext => ({ recentSpends: [], merchant: { name: 'BestBuy', category: 'Electronics' }, itemSpentCents });
  const req = (amount: number, item_id?: string): SpendRequest => ({ merchant: 'BestBuy', amount, category: 'Electronics', reason: 'x', verified_price: amount, item_id });
  const run = (r: SpendRequest, balance = 70000, spent = {}) => evaluate(vault(balance), school(), r, ctx(spent), { now });

  assert.equal(run(req(559.99, 'laptop')).result, 'APPROVE');
  assert.deepEqual(run(req(30)).reasons, ['ITEM_REQUIRED']);
  assert.deepEqual(run(req(30, 'pencil')).reasons, ['UNKNOWN_ITEM']);
  assert.deepEqual(run(req(611, 'laptop')).reasons, ['ITEM_LIMIT_EXCEEDED']);
  assert.deepEqual(run(req(30, 'laptop'), 14000, { laptop: 56000 }).reasons, ['ITEM_ALREADY_BOUGHT']);
  // The $40 headphones may cost $90 now that the laptop left money over.
  assert.equal(run(req(89, 'headphones'), 14000, { laptop: 56000 }).result, 'APPROVE');
  assert.deepEqual(run(req(91, 'headphones'), 14000, { laptop: 56000 }).reasons, ['ITEM_LIMIT_EXCEEDED']);
});

test('the list is validated, and single-item vaults are unchanged', () => {
  const bad = school() as any;
  bad.shopping.list.items[1].id = 'laptop';
  assert.throws(() => PolicySchema.parse(bad), /unique/);
  const tooBig = school() as any;
  tooBig.shopping.list.items[0].max_price = 701;
  assert.throws(() => PolicySchema.parse(tooBig), /more than the vault holds/);

  const single = { ...school(), shopping: { ...school().shopping!, list: undefined } };
  const d = evaluate({ type: 'SHOPPING', status: 'ACTIVE', balanceCents: 70000, expiresAt: new Date('2026-11-25T00:00:00Z') }, single,
    { merchant: 'BestBuy', amount: 30, category: 'Electronics', reason: 'x', verified_price: 30 },
    { recentSpends: [], merchant: { name: 'BestBuy', category: 'Electronics' } }, { now });
  assert.equal(d.result, 'APPROVE');
});

test('an item searches with its own words and the vault preferences for the rest', () => {
  const p = school();
  const bag = itemPrefs(p.shopping!, p.shopping!.list!.items[1]!);
  assert.equal(bag.product_query, 'school backpack');
  assert.deepEqual(bag.required_keywords, ['backpack']);
  assert.equal(bag.condition, 'NEW');
  assert.equal(bag.check_every_minutes, 180);
});
