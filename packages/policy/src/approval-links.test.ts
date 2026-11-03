import assert from 'node:assert/strict';
import { test } from 'node:test';
import { signApprovalLink, verifyApprovalLink } from './approval-links.ts';

const SECRET = 'test-secret';

test('a signed link round-trips its action', () => {
  const token = signApprovalLink({ a: 'pick', v: 'vault1', p: 'prop1', i: 2 }, SECRET);
  const checked = verifyApprovalLink(token, SECRET);
  assert.equal(checked.ok, true);
  if (checked.ok) assert.deepEqual(checked.action, { a: 'pick', v: 'vault1', p: 'prop1', i: 2 });
});

test('a changed link is refused', () => {
  const token = signApprovalLink({ a: 'reject', v: 'vault1', d: 'dec1' }, SECRET);
  const [body, sig] = token.split('.');
  const forged = Buffer.from(Buffer.from(body, 'base64url').toString().replace('reject', 'approve')).toString('base64url');
  assert.deepEqual(verifyApprovalLink(`${forged}.${sig}`, SECRET), { ok: false, reason: 'INVALID' });
  assert.deepEqual(verifyApprovalLink(token, 'other-secret'), { ok: false, reason: 'INVALID' });
  assert.deepEqual(verifyApprovalLink('garbage', SECRET), { ok: false, reason: 'INVALID' });
});

test('an old link expires', () => {
  const token = signApprovalLink({ a: 'approve', v: 'vault1', d: 'dec1' }, SECRET, 1000, 0);
  assert.equal(verifyApprovalLink(token, SECRET, 500).ok, true);
  assert.deepEqual(verifyApprovalLink(token, SECRET, 2000), { ok: false, reason: 'EXPIRED' });
});
