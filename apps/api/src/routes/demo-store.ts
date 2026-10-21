import { Router, type Request } from 'express';
import { z } from 'zod';

// A small fake shop for demos (used when there is no Channel3 key, or DEMO_STORE=on).
// Product pages carry schema.org JSON-LD, the same data verify_listing reads on real shops.
// It shows every rule the shopping agent applies:
//   - tg-bass: listed at $29.99 but the page charges $37.99 (vendor overcharge -> PRICE_MISMATCH)
//   - wm-refurb: used; bb-generic: 2.8 stars; tg-slow: 12-day delivery; az-budget: unapproved merchant
//   - bb-sony: $59.99, over budget until POST /demo-store/price-drop {"sku":"bb-sony","price":39.99}

type Item = {
  sku: string;
  title: string;
  merchant: string;
  tags: string;
  categoryPath: string[];
  condition: 'new' | 'used';
  rating: number;
  ratingCount: number;
  deliveryDays: number;
  listedPrice: number; // what search results show
  pagePrice: number; // what the product page charges
};

const HEADPHONES = ['Electronics', 'Audio', 'Headphones'];

const INITIAL: Item[] = [
  { sku: 'as-studio', title: 'Studio Wireless Headphones', merchant: 'Audio Store', tags: 'headphones audio bluetooth over-ear', categoryPath: HEADPHONES, condition: 'new', rating: 4.4, ratingCount: 812, deliveryDays: 3, listedPrice: 39.99, pagePrice: 39.99 },
  { sku: 'bb-nc', title: 'Noise-Cancelling Wireless Headphones', merchant: 'BestBuy', tags: 'headphones audio anc bluetooth over-ear', categoryPath: HEADPHONES, condition: 'new', rating: 4.6, ratingCount: 2210, deliveryDays: 2, listedPrice: 44.99, pagePrice: 44.99 },
  { sku: 'tg-bass', title: 'Bass Boost Wireless Headphones', merchant: 'Target', tags: 'headphones audio bluetooth', categoryPath: HEADPHONES, condition: 'new', rating: 4.1, ratingCount: 340, deliveryDays: 4, listedPrice: 29.99, pagePrice: 37.99 },
  { sku: 'wm-refurb', title: 'Refurbished Wireless Headphones', merchant: 'Walmart', tags: 'headphones audio bluetooth', categoryPath: HEADPHONES, condition: 'used', rating: 4.0, ratingCount: 95, deliveryDays: 5, listedPrice: 24.99, pagePrice: 24.99 },
  { sku: 'bb-generic', title: 'Generic Bluetooth Headphones', merchant: 'BestBuy', tags: 'headphones audio bluetooth wireless', categoryPath: HEADPHONES, condition: 'new', rating: 2.8, ratingCount: 41, deliveryDays: 3, listedPrice: 22.99, pagePrice: 22.99 },
  { sku: 'tg-slow', title: 'Over-Ear Wireless Headphones', merchant: 'Target', tags: 'headphones audio bluetooth over-ear', categoryPath: HEADPHONES, condition: 'new', rating: 4.3, ratingCount: 260, deliveryDays: 12, listedPrice: 32.99, pagePrice: 32.99 },
  { sku: 'az-budget', title: 'Budget Wired Headphones', merchant: 'Amazon', tags: 'headphones audio wired', categoryPath: HEADPHONES, condition: 'new', rating: 3.9, ratingCount: 5000, deliveryDays: 1, listedPrice: 19.99, pagePrice: 19.99 },
  { sku: 'bb-sony', title: 'Sony WH-CH520 Wireless Headphones', merchant: 'BestBuy', tags: 'headphones audio bluetooth sony on-ear', categoryPath: HEADPHONES, condition: 'new', rating: 4.5, ratingCount: 9800, deliveryDays: 2, listedPrice: 59.99, pagePrice: 59.99 },
  { sku: 'as-pro', title: 'Pro Reference Headphones', merchant: 'Audio Store', tags: 'headphones audio studio wired', categoryPath: HEADPHONES, condition: 'new', rating: 4.8, ratingCount: 150, deliveryDays: 3, listedPrice: 129, pagePrice: 129 },
  { sku: 'as-cable', title: 'USB-C Audio Cable', merchant: 'Audio Store', tags: 'cable audio accessory', categoryPath: ['Electronics', 'Accessories'], condition: 'new', rating: 4.2, ratingCount: 77, deliveryDays: 2, listedPrice: 9.99, pagePrice: 9.99 },
];

let catalog: Item[] = structuredClone(INITIAL);

const baseUrl = (req: Request) => `${req.protocol}://${req.get('host')}`;

export const demoStoreRouter = Router();

demoStoreRouter.get('/search', (req, res) => {
  const words = String(req.query.q ?? '').toLowerCase().split(/[^a-z0-9-]+/).filter((w) => w.length >= 3);
  const matches = catalog.filter((i) => words.some((w) => `${i.title} ${i.tags}`.toLowerCase().includes(w.replace(/s$/, ''))));
  res.json(
    matches.map((i) => ({
      title: i.title,
      price: i.listedPrice,
      merchant: i.merchant,
      url: `${baseUrl(req)}/demo-store/p/${i.sku}`,
      condition: i.condition,
      rating: i.rating,
      ratingCount: i.ratingCount,
      deliveryDays: i.deliveryDays,
      categoryPath: i.categoryPath,
      source: 'demo-store',
    })),
  );
});

demoStoreRouter.get('/p/:sku', (req, res) => {
  const item = catalog.find((i) => i.sku === req.params.sku);
  if (!item) return res.status(404).send('Not found');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.title,
    aggregateRating: { '@type': 'AggregateRating', ratingValue: item.rating, reviewCount: item.ratingCount },
    offers: {
      '@type': 'Offer',
      price: item.pagePrice.toFixed(2),
      priceCurrency: 'USD',
      itemCondition: item.condition === 'used' ? 'https://schema.org/UsedCondition' : 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: item.merchant },
    },
  };
  res.type('html').send(`<!doctype html><html><head><title>${item.title}</title>
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script></head>
<body><h1>${item.title}</h1><p>Sold by ${item.merchant}</p><p>$${item.pagePrice.toFixed(2)}</p>
<p>Delivery in ${item.deliveryDays} days</p></body></html>`);
});

/** Demo control: change a product's price (search listing and page), e.g. to show watch mode buying after a drop. */
demoStoreRouter.post('/price-drop', (req, res) => {
  const { sku, price } = z.object({ sku: z.string(), price: z.number().positive() }).parse(req.body);
  const item = catalog.find((i) => i.sku === sku);
  if (!item) return res.status(404).json({ error: 'SKU_NOT_FOUND' });
  item.listedPrice = price;
  item.pagePrice = price;
  res.json(item);
});

/** Demo control: restore the original catalog. */
demoStoreRouter.post('/reset', (_req, res) => {
  catalog = structuredClone(INITIAL);
  res.json({ ok: true });
});
