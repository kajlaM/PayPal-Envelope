import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate } from './engine.ts';
import { addInterval, savingsSchedule } from './savings.ts';
import { PolicySchema } from './schema.ts';

test('intervals: days, weeks, and months that keep the day where they can', () => {
  const jan31 = new Date('2027-01-31T10:00:00Z');
  assert.equal(addInterval(jan31, 'DAY').toISOString(), '2027-02-01T10:00:00.000Z');
  assert.equal(addInterval(jan31, 'WEEK', 2).toISOString(), '2027-02-14T10:00:00.000Z');
  assert.equal(addInterval(jan31, 'MONTH').toISOString(), '2027-02-28T10:00:00.000Z');
  assert.equal(addInterval(jan31, 'MONTH', 2).toISOString(), '2027-03-31T10:00:00.000Z');
});

test('schedule: $100 at $30 a week is 4 payments, the last one $10', () => {
  const s = savingsSchedule(10000, { amount_per_payment: 30, every: 'WEEK' }, new Date('2027-01-01T00:00:00Z'));
  assert.deepEqual(s, { payments: 4, perPaymentCents: 3000, lastPaymentCents: 1000, lastPaymentAt: new Date('2027-01-22T00:00:00Z') });
});

test('a savings plan is validated, and nothing is spent while saving or from a savings vault', () => {
  const base = {
    vault_name: 'Speaker', vault_type: 'SHOPPING', allocated_budget: 100,
    rules: { max_single_transaction: 100, allowed_categories: ['Electronics'], approved_merchants: ['BestBuy'], expiry_timestamp: '2027-03-01T00:00:00Z' },
    savings: { amount_per_payment: 20, every: 'MONTH' },
  };
  const policy = PolicySchema.parse(base);
  assert.throws(() => PolicySchema.parse({ ...base, savings: { amount_per_payment: 101, every: 'MONTH' } }), /at most the vault amount/);
  assert.throws(() => PolicySchema.parse({ ...base, vault_type: 'SAVINGS', savings: undefined }), /needs a payment plan/);
  assert.throws(() => PolicySchema.parse({ ...base, vault_type: 'UTILITY' }), /subscription/);
  assert.throws(() => PolicySchema.parse({ ...base, rules: { ...base.rules, approved_merchants: [] } }), /at least one merchant/);
  const saveOnly = PolicySchema.parse({ ...base, vault_type: 'SAVINGS', rules: { ...base.rules, approved_merchants: [], allowed_categories: [] } });

  const req = { merchant: 'BestBuy', amount: 50, category: 'Electronics', reason: 'x', verified_price: 50 };
  const ctx = { recentSpends: [], merchant: { name: 'BestBuy', category: 'Electronics' } };
  const vault = { type: 'SHOPPING' as const, status: 'SAVING', balanceCents: 6000, expiresAt: new Date('2027-03-01T00:00:00Z') };
  const now = new Date('2027-01-01T00:00:00Z');
  assert.deepEqual(evaluate(vault, policy, req, ctx, { now }).reasons, ['STILL_SAVING']);
  assert.ok(evaluate({ ...vault, type: 'SAVINGS', status: 'ACTIVE' }, saveOnly, req, ctx, { now }).reasons.includes('SAVINGS_VAULT'));
});
