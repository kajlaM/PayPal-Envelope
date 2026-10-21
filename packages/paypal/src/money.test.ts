import { test } from 'node:test';
import assert from 'node:assert/strict';
import { centsToValue, valueToCents } from './money.ts';

test('cents to PayPal value', () => {
  assert.equal(centsToValue(3999), '39.99');
  assert.equal(centsToValue(5), '0.05');
  assert.equal(centsToValue(5000), '50.00');
  assert.throws(() => centsToValue(1.5));
  assert.throws(() => centsToValue(-1));
});

test('PayPal value to cents', () => {
  assert.equal(valueToCents('39.99'), 3999);
  assert.equal(valueToCents('10.5'), 1050);
  assert.equal(valueToCents('50'), 5000);
  assert.equal(valueToCents('0.07'), 7);
  assert.throws(() => valueToCents('1.999'));
  assert.throws(() => valueToCents('abc'));
});
