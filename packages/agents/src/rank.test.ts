import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ShoppingPrefsSchema } from '@paypalvault/policy';
import { pickCategory, rankProducts, type RankContext } from './rank.ts';
import type { Product } from './search.ts';

const p = (title: string, price: number, over: Partial<Product> = {}): Product => ({
  title, price, merchant: 'BestBuy', url: `https://shop/${title}`, condition: 'new', rating: 4.2, ratingCount: 10,
  deliveryDays: 3, categoryPath: ['Electronics', 'Audio', 'Headphones'], source: 'demo-store', ...over,
});

const ctx = (prefs: Partial<Parameters<typeof ShoppingPrefsSchema.parse>[0]> = {}): RankContext => ({
  prefs: ShoppingPrefsSchema.parse({ product_query: 'headphones', ...prefs }),
  cap: 45,
  approvedMerchants: ['BestBuy', 'Target'],
  allowedCategories: ['Electronics'],
});

const titles = (r: ReturnType<typeof rankProducts>) => r.candidates.map((c) => c.title);
const reasons = (r: ReturnType<typeof rankProducts>) => Object.fromEntries(r.rejected.map((x) => [x.title, x.reason]));

test('default weights: cheapest first, within budget', () => {
  const r = rankProducts([p('B', 39.99), p('A', 29.99), p('C', 44.99), p('Big', 59.99)], ctx());
  assert.deepEqual(titles(r), ['A', 'B', 'C']);
  assert.deepEqual(reasons(r), { Big: 'OVER_BUDGET' });
});

test('hard rules drop wrong merchant, category, used, wrong model, low rating, slow delivery', () => {
  const r = rankProducts([
    p('Sony WH-CH520 Headphones', 40),
    p('Sony Amazon', 20, { merchant: 'Amazon' }),
    p('Sony Shirt', 20, { categoryPath: ['Apparel'] }),
    p('Sony Used', 20, { condition: 'used' }),
    p('JBL Tune', 20),
    p('Sony Bad', 20, { rating: 2.5 }),
    p('Sony Slow', 20, { deliveryDays: 10 }),
    p('Sony Unrated', 30, { rating: null, deliveryDays: null }),
  ], ctx({ required_keywords: ['sony'], min_rating: 4, max_delivery_days: 5 }));
  assert.deepEqual(titles(r), ['Sony Unrated', 'Sony WH-CH520 Headphones']);
  assert.deepEqual(reasons(r), {
    'Sony Amazon': 'MERCHANT_NOT_APPROVED', 'Sony Shirt': 'CATEGORY_NOT_ALLOWED', 'Sony Used': 'USED',
    'JBL Tune': 'WRONG_MODEL', 'Sony Bad': 'LOW_RATING', 'Sony Slow': 'SLOW_DELIVERY',
  });
});

test('used is fine when condition is ANY; model numbers match ignoring dashes', () => {
  const r = rankProducts([p('Sony WHCH520 refurb', 20, { condition: 'used' })], ctx({ condition: 'ANY', required_keywords: ['WH-CH520'] }));
  assert.equal(r.candidates.length, 1);
});

test('weights: rating and delivery can beat a lower price', () => {
  const items = [p('Cheap', 25, { rating: 3.5, deliveryDays: 9 }), p('Good', 35, { rating: 4.9, deliveryDays: 1 })];
  assert.deepEqual(titles(rankProducts(items, ctx())), ['Cheap', 'Good']);
  assert.deepEqual(titles(rankProducts(items, ctx({ weights: { price: 1, rating: 5, delivery: 3, model_match: 0 } }))), ['Good', 'Cheap']);
});

test('preferred keywords lift a product when weighted', () => {
  const items = [p('Generic', 30), p('Sony Wireless', 34)];
  assert.deepEqual(titles(rankProducts(items, ctx({ preferred_keywords: ['Sony'], weights: { price: 1, rating: 0, delivery: 0, model_match: 4 } }))), ['Sony Wireless', 'Generic']);
});

test('pickCategory picks the most specific allowed category', () => {
  assert.equal(pickCategory(['Electronics', 'Audio', 'Headphones & Headsets', 'On-Ear Headphones'], ['Electronics']), 'Audio');
  assert.equal(pickCategory(['Electronics', 'Audio', 'Headphones'], ['Electronics']), 'Headphones');
  assert.equal(pickCategory(['Apparel', 'Shirts'], ['Electronics']), 'Shirts');
  assert.equal(pickCategory([], ['Electronics']), 'Electronics');
});
