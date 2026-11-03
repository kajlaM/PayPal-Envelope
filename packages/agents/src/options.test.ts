import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sameListing, withProsAndCons, type Prepared } from './options.ts';

const option = (over: Partial<Prepared>): Prepared => {
  const base = {
    title: 'Sony WH-CH720N Wireless Headphones', merchant: 'BestBuy', price: 40, verified_price: 40, url: 'https://shop.example/a',
    category: 'Headphones', rating: 4.2, delivery_days: 3, condition: 'new' as const,
  };
  const o = { ...base, ...over };
  return { ...o, candidate: { ...o, ratingCount: null, deliveryDays: o.delivery_days ?? null, categoryPath: [], source: 'demo-store', score: 1 } } as Prepared;
};

test('pros and cons compare the options with each other', () => {
  const [cheap, rated, fast] = withProsAndCons(
    [
      option({ url: 'u1', price: 30, verified_price: 30, rating: 3.8, delivery_days: 7 }),
      option({ url: 'u2', price: 45, verified_price: 45, rating: 4.7, delivery_days: 5, title: 'Sony noise cancelling' }),
      option({ url: 'u3', price: 40, verified_price: 40, rating: null, delivery_days: 1, condition: 'used' }),
    ],
    new Map(),
    ['noise cancelling'],
  );
  assert.ok(cheap!.pros.includes('Lowest price of the 3'));
  assert.ok(cheap!.cons.includes('Rated only 3.8★'));
  assert.ok(rated!.pros.includes('Best rated (4.7★)'));
  assert.ok(rated!.pros.includes('Has what you prefer: noise cancelling'));
  assert.ok(rated!.cons.includes('Most expensive of the 3'));
  assert.ok(fast!.pros.includes('Fastest delivery (1 days)'));
  assert.deepEqual(fast!.cons, ['No rating yet', 'Used or refurbished']);
  assert.equal('candidate' in cheap!, false);
});

test('unverified or changed prices are called out; agent notes are added after the facts', () => {
  const [unverified, changed] = withProsAndCons(
    [option({ url: 'u1', verified_price: null }), option({ url: 'u2', price: 40, verified_price: 42 })],
    new Map([['u2', { pros: ['Folds flat for travel', 'Two-year warranty', 'third note is dropped'], cons: [] }]]),
  );
  assert.ok(unverified!.cons.some((c) => c.startsWith('Live price could not be checked')));
  assert.ok(changed!.cons.includes('Price changed on the shop page (was $40.00)'));
  assert.deepEqual(changed!.pros.slice(-2), ['Folds flat for travel', 'Two-year warranty']);
});

test('the same product under another URL counts as one option', () => {
  const a = { title: 'Wireless Bluetooth Headphones', merchant: 'Walmart', price: 13.78 };
  assert.ok(sameListing(a, { title: 'wireless bluetooth headphones!', merchant: 'walmart', price: 13.78 }));
  assert.ok(!sameListing(a, { ...a, price: 14.5 }));
  assert.ok(!sameListing(a, { ...a, merchant: 'Target' }));
});
