import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compareStores, dailyPoints, historyText, modelCode, priceVerdict, sameModel, shouldWaitForPrice } from './channel3.ts';
import type { Product } from './search.ts';

const p = (over: Partial<Product>): Product => ({
  title: 'Sony WH-CH530 Wireless Headphones', price: 50, merchant: 'BestBuy', url: `https://x.test/${Math.random()}`,
  condition: 'new', rating: 4.5, ratingCount: 10, deliveryDays: null, categoryPath: ['Electronics'], source: 'channel3',
  productId: null, image: null, brand: 'Sony', wasPrice: null, ...over,
});

test('model code: longest letters+digits word, not a unit', () => {
  assert.equal(modelCode('Sony WH-CH530 Wireless On-Ear Headphones'), 'whch530');
  assert.equal(modelCode('Soundcore P30i Earbuds, 60W, 2m cable'), 'p30i');
  assert.equal(modelCode('Wireless Headphones 40mm 5.3'), null);
});

test('same model: same Channel3 product, or same brand + model code', () => {
  assert.ok(sameModel(p({ productId: 'a' }), p({ productId: 'a', title: 'Other' })));
  assert.ok(sameModel(p({}), p({ title: 'WH-CH530 Wireless Headphone with Mic', merchant: 'Walmart' })));
  assert.ok(!sameModel(p({}), p({ title: 'Sony WH-CH720N Headphones' })));
  assert.ok(!sameModel(p({}), p({ brand: 'JBL' })));
});

test('compare stores: cheapest offer per store, cheapest store first, saving vs the dearest', () => {
  const best = p({ price: 48, merchant: 'BestBuy' });
  const pool = [best, p({ price: 52, merchant: 'Walmart' }), p({ price: 55, merchant: 'Target' }), p({ price: 60, merchant: 'Target' }), p({ price: 30, merchant: 'Walmart', condition: 'used' })];
  const { stores, saved, cheapest } = compareStores(best, pool);
  assert.deepEqual(stores.map((s) => `${s.merchant} ${s.price}`), ['BestBuy 48', 'Walmart 52', 'Target 55']);
  assert.equal(saved, 7);
  assert.equal(cheapest, best);
});

test('wait for a better price only when clearly high and the vault is not about to end', () => {
  const high = { status: 'high' as const, mean: 40, min: 35, max: 60, days: 90 };
  const later = new Date(Date.now() + 5 * 86_400_000);
  assert.ok(shouldWaitForPrice(50, high, later));
  assert.ok(!shouldWaitForPrice(43, high, later)); // under 10% above the average
  assert.ok(!shouldWaitForPrice(50, high, new Date(Date.now() + 86_400_000))); // ends tomorrow: buy
  assert.ok(!shouldWaitForPrice(50, null, later));
  assert.match(historyText(35, { ...high, status: 'low' })!, /Lowest price in 90 days/);
});

test('price verdict comes from the numbers (not the label)', () => {
  const h = { mean: 46.44, min: 24.99 };
  assert.equal(priceVerdict(24.99, h), 'low'); // at the 90-day low
  assert.equal(priceVerdict(41, h), 'low'); // 10%+ under the average
  assert.equal(priceVerdict(46, h), 'typical');
  assert.equal(priceVerdict(52, h), 'high'); // 10%+ over the average
});

test('dailyPoints: one price per day (the lowest), oldest first, USD only', () => {
  const points = dailyPoints([
    { timestamp: '2026-10-02T18:00:00Z', price: 51, currency: 'USD' },
    { timestamp: '2026-10-01T09:00:00Z', price: 49.999, currency: 'USD' },
    { timestamp: '2026-10-02T08:00:00Z', price: 55, currency: 'USD' },
    { timestamp: '2026-10-03T08:00:00Z', price: 40, currency: 'EUR' },
    { timestamp: 'bad', price: 'x' },
  ]);
  assert.deepEqual(points, [['2026-10-01', 50], ['2026-10-02', 51]]); // Oct 2: lowest of 51 and 55
  assert.deepEqual(dailyPoints(undefined), []);
});
