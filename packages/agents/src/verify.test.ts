import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractListing } from './verify.ts';
import { merchantForDomain } from './search.ts';

test('reads price and seller from JSON-LD', () => {
  const html = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Studio Headphones",
    "offers":{"@type":"Offer","price":"39.99","priceCurrency":"USD","seller":{"name":"Audio Store"}}}</script>`;
  assert.deepEqual(extractListing(html), { price: 39.99, seller: 'Audio Store', title: 'Studio Headphones' });
});

test('reads JSON-LD inside @graph and offer arrays', () => {
  const html = `<script type="application/ld+json">{"@graph":[{"@type":"WebPage"},{"@type":["Product"],"name":"X",
    "offers":[{"lowPrice":12.5,"priceCurrency":"USD"}]}]}</script>`;
  assert.equal(extractListing(html).price, 12.5);
});

test('ignores non-USD prices and falls back to meta tags', () => {
  const html = `<script type="application/ld+json">{"@type":"Product","offers":{"price":"999","priceCurrency":"INR"}}</script>
    <meta property="product:price:amount" content="24.00"><meta property="og:site_name" content="Target">`;
  assert.deepEqual(extractListing(html), { price: 24, seller: 'Target', title: null });
});

test('no price found', () => {
  assert.equal(extractListing('<html><body>hi</body></html>').price, null);
});

test('maps shop domains to registered merchants', () => {
  const merchants = [
    { name: 'Audio Store', category: 'Electronics', domain: null },
    { name: 'BestBuy', category: 'Electronics', domain: 'bestbuy.com' },
    { name: 'Target', category: 'Electronics', domain: 'target.com' },
  ];
  assert.equal(merchantForDomain('www.bestbuy.com', merchants), 'BestBuy');
  assert.equal(merchantForDomain('target.com', merchants), 'Target');
  assert.equal(merchantForDomain('shop.bestbuy.com', merchants), 'BestBuy');
  assert.equal(merchantForDomain('www.amazon.com', merchants), 'amazon.com');
});
