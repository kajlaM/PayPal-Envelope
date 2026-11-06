import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Policy } from '@paypalvault/policy';
import { buildEmail, shortId, type EmailInput, type VaultFacts } from './emails.ts';
import { policyChanges, recipients } from './notify.ts';

// Alert emails: every kind, the vault in the subject, the right inbox. No network, no database.

const vault: VaultFacts = {
  id: 'cmvpeozl20000unuj3tirgrix',
  name: 'Mechanical Keyboard',
  type: 'SHOPPING',
  ownerName: 'Kajla',
  budgetCents: 600,
  balanceCents: 334,
  expiresAt: new Date('2026-11-02T15:49:00Z'),
  lookingFor: 'mechanical keyboard',
  maxPerPaymentCents: 600,
  shops: ['BestBuy', 'Walmart'],
  link: 'https://demo.trycloudflare.com/?vault=cmvpeozl20000unuj3tirgrix',
};
const earbuds = { item: 'Wireless Earbuds', merchant: 'Walmart', amountCents: 266, productUrl: 'https://walmart.example/earbuds' };

const every: EmailInput[] = [
  { kind: 'VAULT_LIVE', vault },
  { kind: 'PURCHASED', vault, purchase: earbuds },
  { kind: 'NEEDS_HUMAN', vault, purchase: earbuds, reasons: ['ABOVE_HUMAN_APPROVAL_THRESHOLD'] },
  { kind: 'BLOCK', vault, purchase: earbuds, reasons: ['MAX_LIMIT_EXCEEDED'] },
  { kind: 'POLICY_CHANGED', vault, version: 3, changes: [{ label: 'Amount', before: '$3.00', after: '$6.00' }], changeCents: 300, cancelledApprovals: 0 },
  { kind: 'REFUND_SENT', vault, amountCents: 200 },
  { kind: 'LIQUIDATED', vault, refundCents: 334, totals: { paidInCents: 800, spentCents: 266, refundedCents: 534 }, purchases: [earbuds], ruleVersions: 3, openedAt: new Date('2026-10-26T15:47:00Z') },
  { kind: 'ENDING_SOON', vault },
  { kind: 'PAYOUT_FAILED', vault, amountCents: 266, to: 'Walmart', refund: false, reason: 'RECEIVER_UNREGISTERED' },
  { kind: 'OPTIONS_READY', vault, options: [earbuds, { ...earbuds, item: 'Bluetooth Earbuds', amountCents: 300 }], summary: 'Two good matches.' },
  { kind: 'SAVINGS_PAYMENT', vault, amountCents: 200, paymentNumber: 2, paymentsTotal: 3, nextAt: new Date('2026-11-26T15:47:00Z') },
  { kind: 'SAVINGS_GOAL_REACHED', vault, willShop: true },
  { kind: 'SAVINGS_PAYMENT_FAILED', vault, reason: 'Instrument declined.', failures: 3, paused: true },
];

test('every email names the vault and its short id in the subject, and links to that vault', () => {
  assert.equal(shortId(vault.id), 'RGRIX');
  for (const input of every) {
    const email = buildEmail(input);
    assert.ok(email.subject.startsWith('[Mechanical Keyboard · #RGRIX] '), `${input.kind}: ${email.subject}`);
    assert.ok(email.text.startsWith('Hi Kajla,'), input.kind);
    assert.ok(email.text.includes(vault.link) && email.html.includes(vault.link), `${input.kind} links to the vault`);
    assert.ok(email.html.includes('#RGRIX'), input.kind);
  }
});

test('different vaults get different subjects', () => {
  const other = buildEmail({ kind: 'VAULT_LIVE', vault: { ...vault, id: 'cmvpftiye000011ujr7hsa09j', name: 'Sony Headphones' } });
  assert.notEqual(other.subject, buildEmail({ kind: 'VAULT_LIVE', vault }).subject);
  assert.ok(other.subject.startsWith('[Sony Headphones · #SA09J] '));
});

test('each email says what happened, with the numbers that matter', () => {
  const [live, bought, approve, blocked, changed, refund, closed, ending, failed] = every.map(buildEmail);
  assert.match(live!.subject, /live: \$6\.00 locked until/);
  assert.match(live!.text, /mechanical keyboard/);
  assert.match(bought!.subject, /Bought Wireless Earbuds for \$2\.66 at Walmart/);
  assert.match(bought!.text, /\$3\.34 of \$6\.00/);
  assert.match(approve!.subject, /Approve Wireless Earbuds: \$2\.66 at Walmart\?/);
  assert.match(approve!.text, /Review and approve/);
  assert.match(blocked!.text, /above the per-purchase limit/);
  assert.match(blocked!.text, /Raise "max per payment"/);
  assert.match(changed!.subject, /Rules updated \(version 3\): \+\$3\.00 charged/);
  assert.match(changed!.text, /\$3\.00 → \$6\.00/);
  assert.match(refund!.subject, /\$2\.00 refunded to your PayPal/);
  assert.match(closed!.subject, /Vault closed: \$3\.34 refunded/);
  assert.match(closed!.text, /Paid in\s+\$8\.00/);
  assert.match(closed!.text, /Wireless Earbuds \(\$2\.66, Walmart\)/);
  assert.match(ending!.subject, /Ends in 24 hours: \$3\.34 still unspent/);
  assert.match(failed!.text, /money is safe/);
});

test('a lowered amount says a refund is coming, or that it failed', () => {
  const base = { kind: 'POLICY_CHANGED' as const, vault, version: 2, changes: [], cancelledApprovals: 1 };
  assert.match(buildEmail({ ...base, changeCents: -200 }).subject, /\$2\.00 refund on its way/);
  assert.match(buildEmail({ ...base, changeCents: -200 }).text, /1 purchase\(s\) that were waiting/);
  assert.match(buildEmail({ ...base, changeCents: -200, refundFailed: 'RECEIVER_UNREGISTERED' }).text, /refund failed/);
  assert.doesNotMatch(buildEmail({ ...base, changeCents: 0 }).subject, /charged|refund/);
});

test('text from shops and the AI is escaped in the HTML email', () => {
  const html = buildEmail({ kind: 'PURCHASED', vault: { ...vault, name: '<b>x</b>' }, purchase: { ...earbuds, item: '<script>alert(1)</script>' } }).html;
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<b>x</b>'));
});

test('mail goes to the vault owner, with everyone else in CC', () => {
  process.env.ALERT_RECIPIENTS = 'kajla@personal.example.com=kajla@gmail.example, jugal@personal.example.com=jugal@gmail.example';
  process.env.ALERT_CC = 'kajla@gmail.example,jugal@gmail.example,team@gmail.example';
  assert.deepEqual(recipients('Kajla@Personal.Example.com'), { to: 'kajla@gmail.example', cc: ['jugal@gmail.example', 'team@gmail.example'] });
  assert.deepEqual(recipients('jugal@personal.example.com'), { to: 'jugal@gmail.example', cc: ['kajla@gmail.example', 'team@gmail.example'] });
  // An owner without a mapped inbox: the first CC address receives it.
  assert.deepEqual(recipients('someone@personal.example.com'), { to: 'kajla@gmail.example', cc: ['jugal@gmail.example', 'team@gmail.example'] });
});

test('a rules change lists only what changed', () => {
  const policy = (query: string, budget: number, shops: string[]): Policy => ({
    vault_name: 'Mechanical Keyboard',
    vault_type: 'SHOPPING',
    allocated_budget: budget,
    currency: 'USD',
    rules: {
      max_single_transaction: budget,
      allowed_categories: ['Electronics'],
      approved_merchants: shops,
      expiry_timestamp: '2026-11-02T15:49:00.000Z',
    },
    shopping: { product_query: query },
    liquidation: { auto_refund: true },
  }) as Policy;
  const changes = policyChanges(policy('wireless headphones', 5, ['Walmart']), policy('mechanical keyboard', 6, ['Walmart']));
  assert.deepEqual(changes.map((c) => c.label), ['AI looks for', 'Amount', 'Max per payment']);
  assert.deepEqual(changes[0], { label: 'AI looks for', before: 'wireless headphones', after: 'mechanical keyboard' });
});

test('options email lists every option and says nothing is bought until the owner picks', () => {
  const email = buildEmail({ kind: 'OPTIONS_READY', vault, options: [earbuds, { ...earbuds, item: 'Bluetooth Earbuds', amountCents: 300 }] });
  assert.match(email.subject, /Pick one: 2 options ready/);
  assert.match(email.text, /Wireless Earbuds/);
  assert.match(email.text, /Bluetooth Earbuds/);
  assert.match(email.text, /nothing is bought until you pick one/);
});

test('savings emails: each payment with progress, the goal, and a failed payment', () => {
  const [payment, goal, failed] = every.slice(-3).map(buildEmail);
  assert.match(payment!.subject, /Saved \$2\.00 \(payment 2 of 3\)/);
  assert.match(payment!.text, /\$3\.34 of \$6\.00/);
  assert.match(payment!.text, /Next payment/);
  assert.match(goal!.subject, /Goal reached: \$6\.00 saved/);
  assert.match(goal!.text, /starts shopping now/);
  assert.match(failed!.subject, /Savings plan paused/);
  assert.match(failed!.text, /Instrument declined\./);
});

test('approval and options emails carry answer buttons (two-way), each in the text version too', () => {
  const approve = { label: 'Approve $2.66', url: 'https://demo.trycloudflare.com/email/act?t=a.b', style: 'primary' as const };
  const reject = { label: 'Reject', url: 'https://demo.trycloudflare.com/email/act?t=c.d', style: 'secondary' as const };
  const email = buildEmail({ kind: 'NEEDS_HUMAN', vault, purchase: earbuds, reasons: ['ABOVE_HUMAN_APPROVAL_THRESHOLD'], actions: [approve, reject] });
  for (const a of [approve, reject]) {
    assert.ok(email.html.includes(a.url.replace(/&/g, '&amp;')), `html has ${a.label}`);
    assert.ok(email.text.includes(`${a.label}: ${a.url}`), `text has ${a.label}`);
  }
  assert.ok(email.text.includes(`Open the vault: ${vault.link}`), 'the vault link stays');

  const pick = { label: 'Pick 1: $2.66 at Walmart', url: 'https://demo.trycloudflare.com/email/act?t=e.f', style: 'primary' as const };
  const options = buildEmail({ kind: 'OPTIONS_READY', vault, options: [earbuds], actions: [pick] });
  assert.ok(options.html.includes('Pick 1: $2.66 at Walmart'));

  // Without buttons (no INTERNAL_API_KEY) the email is unchanged: one "Review and approve" link.
  const plain = buildEmail({ kind: 'NEEDS_HUMAN', vault, purchase: earbuds, reasons: ['ABOVE_HUMAN_APPROVAL_THRESHOLD'] });
  assert.ok(plain.text.includes(`Review and approve: ${vault.link}`));
  assert.ok(!plain.html.includes('/email/act'));
});
