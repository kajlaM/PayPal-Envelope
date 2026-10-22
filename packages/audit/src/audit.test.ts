import { test } from 'node:test';
import assert from 'node:assert/strict';
import { describeDecision, describeLedger } from './describe.ts';
import { scoreAnomaly } from './anomaly.ts';

const base = {
  id: 'd1', vaultId: 'v1', vaultName: 'Headphones', vaultType: 'SHOPPING', resolvedBy: null, createdAt: new Date(),
  request: { merchant: 'Audio Store', amount: 48, category: 'Audio', reason: 'headphones' },
};

test('decision summaries explain reason codes in words', () => {
  const s = describeDecision({ ...base, result: 'BLOCK', reasons: ['MAX_LIMIT_EXCEEDED'] });
  assert.match(s, /^Blocked payment of \$48\.00 to Audio Store/);
  assert.match(s, /above the per-purchase limit \(MAX_LIMIT_EXCEEDED\)/);
  assert.match(describeDecision({ ...base, result: 'APPROVE', reasons: [] }), /All policy checks passed/);
  assert.match(describeDecision({ ...base, result: 'NEEDS_HUMAN', reasons: ['PRICE_NOT_VERIFIED'], resolvedBy: 'APPROVED_BY_HUMAN' }), /owner approved it/);
});

test('ledger summaries', () => {
  const e = { id: 'l1', vaultId: 'v1', vaultName: 'Headphones', vaultType: 'SHOPPING', merchant: null, note: null, decisionId: null, updatedAt: new Date() };
  assert.equal(describeLedger({ ...e, type: 'FUND', status: 'COMPLETED', amountCents: 5000 }), 'Vault "Headphones" was funded with $50.00.');
  assert.match(describeLedger({ ...e, type: 'LIQUIDATE', status: 'COMPLETED', amountCents: 701 }), /Refunded the unused \$7\.01/);
  assert.match(describeLedger({ ...e, type: 'SPEND', status: 'FAILED', amountCents: 100, merchant: 'BestBuy', note: 'Payout FAILED' }), /went back to vault/);
});

test('anomaly: not enough history scores 0', () => {
  assert.equal(scoreAnomaly({ count: 2, median: 10, merchants: [], categories: [] }, { amount: 999, merchant: 'X', category: 'Y' }).score, 0);
});

test('anomaly: usual spend is 0, 5x the median is 1, new merchant + category add 0.4', () => {
  const h = { count: 5, median: 10, merchants: ['Audio Store'], categories: ['Audio'] };
  assert.equal(scoreAnomaly(h, { amount: 12, merchant: 'audio store', category: 'audio' }).score, 0);
  assert.equal(scoreAnomaly(h, { amount: 50, merchant: 'Audio Store', category: 'Audio' }).score, 1);
  const r = scoreAnomaly(h, { amount: 40, merchant: 'BestBuy', category: 'Headphones' });
  assert.equal(r.score, 1); // 4x median = 0.67, + 0.4 novelty
  assert.equal(r.why.length, 3);
  assert.equal(scoreAnomaly(h, { amount: 10, merchant: 'BestBuy', category: 'Headphones' }).score, 0.4); // new but normal amount: below 0.8
});
