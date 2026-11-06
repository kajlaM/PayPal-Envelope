import { Router } from 'express';
import { changeVaultPolicy, LedgerError, prisma, startFunding, startLiquidation } from '@paypalvault/db';
import { createOrder, getSubscription } from '@paypalvault/paypal';
import {
  compilePolicy, CreateProposalSchema, evaluate, itemProgress, listItems, PolicyCompileError, PolicySchema, ProposalOptionSchema,
  addInterval, SAVINGS_MAX_DAYS, savingsSchedule, SpendRequestSchema, toCents, type Policy, type SpendRequest,
} from '@paypalvault/policy';
import {
  AgentRunBody, ChangePolicyBody, ChooseOptionBody, CompilePolicyBody, CreateVaultBody, ExpiryBody, FundRequestBody, OrderIdBody,
  SubscriptionIdBody, VaultDetailsQuery, WhenBody,
} from '../api-schemas.ts';
import { emit } from '../events.ts';
import { HttpError, requireInternalKey } from '../http.ts';
import { continueShoppingList, runAgentForVault, runUsesOldPolicy, startWatching, stopWatching } from '../services/agent-runs.ts';
import { syncPendingCheckouts } from '../services/checkout.ts';
import { finishFunding } from '../services/funding.ts';
import { cancelFundRequest, createFundRequest, syncFundRequests } from '../services/fund-requests.ts';
import { decideAndSpend, executeSpend } from '../services/spend.ts';
import { payOutLiquidation, syncPendingPayouts } from '../services/payouts.ts';
import { buildEngineContext, itemSpentCents } from '../services/policy-context.ts';
import { chargeSavingsPayment, pauseSavings, rescheduleSavings, resumeSavings, savingsSummary } from '../services/savings.ts';
import { verifyVault } from '../services/verify.ts';

export const vaultsRouter = Router();

async function loadVault(id: string) {
  const vault = await prisma.vault.findUnique({
    where: { id },
    include: { policies: { orderBy: { version: 'desc' }, take: 1 }, user: true },
  });
  if (!vault) throw new HttpError(404, 'VAULT_NOT_FOUND');
  const policy = PolicySchema.parse(vault.policies[0]?.policyJson);
  return { vault, policy };
}

// ---------- Read ----------

/** A vault's "Verified by PayPal" summary from its entries' last checks (null: never checked). */
function verificationOf(rows: { paypalCheck: string | null; _count: { _all: number }; _max: { paypalCheckedAt: Date | null } }[]) {
  const count = (check: string | null) => rows.find((r) => r.paypalCheck === check)?._count._all ?? 0;
  const checkedAt = rows.reduce<Date | null>((at, r) => (r._max.paypalCheckedAt && (!at || r._max.paypalCheckedAt > at) ? r._max.paypalCheckedAt : at), null);
  if (!checkedAt) return null;
  return {
    verified: count('VERIFIED'), waiting: count('WAITING'), mismatch: count('MISMATCH'),
    unchecked: count('UNCHECKED'), notYet: count(null), checkedAt,
  };
}

/**
 * What Channel3's data saved, per vault: vs the most expensive approved store selling the same
 * model, and vs the product's 90-day average price. Only purchases made with Channel3 data count.
 */
function channel3Savings(purchases: { vaultId: string; amountCents: number; decision: { requestJson: unknown } | null }[]) {
  const out = new Map<string, { storesCents: number; averageCents: number; purchases: number }>();
  for (const p of purchases) {
    const c3 = SpendRequestSchema.safeParse(p.decision?.requestJson).data?.channel3;
    if (!c3) continue;
    const row = out.get(p.vaultId) ?? { storesCents: 0, averageCents: 0, purchases: 0 };
    row.purchases += 1;
    row.storesCents += Math.round((c3.saved ?? 0) * 100);
    if (c3.history) row.averageCents += Math.max(0, Math.round(c3.history.mean * 100) - p.amountCents);
    out.set(p.vaultId, row);
  }
  return out;
}

vaultsRouter.get('/', async (_req, res) => {
  const [vaults, sums, open, purchases, checks] = await Promise.all([
    prisma.vault.findMany({
      orderBy: { createdAt: 'desc' },
      include: { policies: { orderBy: { version: 'desc' }, take: 1 }, fundRequests: { where: { status: 'OPEN' } } },
    }),
    // Money in / out per vault, for summaries (vault history). Failed entries never moved money.
    prisma.ledgerEntry.groupBy({ by: ['vaultId', 'type'], where: { status: { not: 'FAILED' } }, _sum: { amountCents: true } }),
    // Ask me vaults: options waiting for the owner to pick one.
    prisma.proposal.groupBy({ by: ['vaultId'], where: { status: 'OPEN' }, _count: { _all: true } }),
    // Purchases with the request behind them (its Channel3 data says what the purchase saved).
    prisma.ledgerEntry.findMany({
      where: { type: 'SPEND', status: { not: 'FAILED' }, decisionId: { not: null } },
      select: { vaultId: true, amountCents: true, decision: { select: { requestJson: true } } },
    }),
    // "Verified by PayPal": each vault's entries by their last PayPal check.
    prisma.ledgerEntry.groupBy({ by: ['vaultId', 'paypalCheck'], _count: { _all: true }, _max: { paypalCheckedAt: true } }),
  ]);
  const total = (vaultId: string, type: 'FUND' | 'SPEND' | 'LIQUIDATE') =>
    sums.find((row) => row.vaultId === vaultId && row.type === type)?._sum.amountCents ?? 0;
  const saved = channel3Savings(purchases);
  res.json(vaults.map(({ policies, ...v }) => ({
    ...v,
    policy: policies[0]?.policyJson,
    policyVersion: policies[0]?.version,
    totals: { paidInCents: total(v.id, 'FUND'), spentCents: total(v.id, 'SPEND'), refundedCents: total(v.id, 'LIQUIDATE') },
    openProposals: open.find((row) => row.vaultId === v.id)?._count._all ?? 0,
    channel3: saved.get(v.id) ?? null,
    verification: verificationOf(checks.filter((row) => row.vaultId === v.id)),
  })));
});

/**
 * Full details (ledger, decisions, rule history, proposals, items, savings, friend requests) of
 * every vault matching `where`, in a fixed number of queries. The database is a network hop away
 * (~250 ms a query), so loading 27 vaults one by one took ~17 s; this takes about one vault's time.
 */
async function vaultDetails(where: { id: string } | { userId: string }) {
  const vaults = await prisma.vault.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { policies: { orderBy: { version: 'desc' }, take: 1 }, user: true },
  });
  if (vaults.length === 0) return [];
  const inVaults = { vaultId: { in: vaults.map((v) => v.id) } };
  const [ledger, decisions, policyHistory, proposals, spent, fundRequests] = await Promise.all([
    prisma.ledgerEntry.findMany({ where: inVaults, orderBy: { createdAt: 'desc' }, include: { merchant: true } }),
    prisma.decision.findMany({ where: inVaults, orderBy: { createdAt: 'desc' } }),
    prisma.policy.findMany({
      where: inVaults,
      orderBy: { version: 'desc' },
      select: { vaultId: true, version: true, createdAt: true, sourceText: true, policyJson: true },
    }),
    prisma.proposal.findMany({ where: inVaults, orderBy: { createdAt: 'desc' } }),
    // Shopping lists: money spent per item (payments that did not fail).
    prisma.ledgerEntry.groupBy({
      by: ['vaultId', 'itemId'],
      where: { ...inVaults, type: 'SPEND', status: { not: 'FAILED' }, itemId: { not: null } },
      _sum: { amountCents: true },
    }),
    prisma.fundRequest.findMany({ where: inVaults, orderBy: { createdAt: 'desc' } }),
  ]);
  const of = <T extends { vaultId: string }>(rows: T[], vaultId: string) => rows.filter((r) => r.vaultId === vaultId);

  return Promise.all(vaults.map(async (vault) => {
    const policy = PolicySchema.parse(vault.policies[0]?.policyJson);
    const vLedger = of(ledger, vault.id);
    const vDecisions = of(decisions, vault.id);
    const vProposals = of(proposals, vault.id).slice(0, 20);
    const spentByItem = Object.fromEntries(of(spent, vault.id).map((r) => [r.itemId!, r._sum.amountCents ?? 0]));
    const paymentsMade = vLedger.filter((e) => e.type === 'FUND' && e.status === 'COMPLETED').length;
    const savings = await savingsSummary(vault, paymentsMade); // no query: paymentsMade is given
    // Shopping lists: each item's limit right now, what it cost, and whether it waits for the owner.
    const names = new Map(listItems(policy).map((i) => [i.id, i.name]));
    const waiting = (itemId: string) =>
      vProposals.some((p) => p.status === 'OPEN' && p.itemId === itemId) ? 'OPTIONS'
        : vDecisions.some((d) => d.result === 'NEEDS_HUMAN' && !d.resolvedBy && (d.requestJson as SpendRequest)?.item_id === itemId) ? 'APPROVAL'
          : null;
    const items = itemProgress(policy, vault.balanceCents, spentByItem).map((i) => ({ ...i, waiting: i.bought ? null : waiting(i.id) }));
    const { policies, ...rest } = vault;
    return {
      ...rest, policy, ledger: vLedger, decisions: vDecisions, items, savings,
      policyHistory: of(policyHistory, vault.id).map(({ vaultId, ...p }) => p),
      fundRequests: of(fundRequests, vault.id).slice(0, 10),
      proposals: vProposals.map((p) => ({ ...p, itemName: p.itemId ? names.get(p.itemId) ?? p.itemId : null })),
    };
  }));
}

// "Verify now": checks this vault's payments against PayPal's own records. Read-only: PayPal is
// only asked, never paid, and the ledger's amounts and statuses are never changed.
const lastVerify = new Map<string, number>();
vaultsRouter.post('/:id/verify', async (req, res) => {
  const id = req.params.id;
  if (!(await prisma.vault.findUnique({ where: { id }, select: { id: true } }))) throw new HttpError(404, 'VAULT_NOT_FOUND');
  if (Date.now() - (lastVerify.get(id) ?? 0) < 15_000) throw new HttpError(429, 'VERIFY_TOO_SOON', { message: 'Checked a moment ago. Try again in a few seconds.' });
  lastVerify.set(id, Date.now());
  res.json(await verifyVault(id));
});

// Every vault of one customer, with full details (the calendar shows them all at once).
vaultsRouter.get('/details', async (req, res) => {
  const { userId } = VaultDetailsQuery.parse(req.query);
  res.json(await vaultDetails({ userId }));
});

vaultsRouter.get('/:id', async (req, res) => {
  const [vault] = await vaultDetails({ id: req.params.id });
  if (!vault) throw new HttpError(404, 'VAULT_NOT_FOUND');
  res.json(vault);
});

// ---------- Create ----------

// Step 1 of creating a vault: plain English -> policy preview. Nothing is saved.
vaultsRouter.post('/compile', async (req, res) => {
  const { text } = CompilePolicyBody.parse(req.body);
  const merchants = await prisma.merchant.findMany({ where: { approved: true }, select: { name: true, category: true } });
  try {
    res.json(await compilePolicy(text, merchants));
  } catch (err) {
    if (err instanceof PolicyCompileError) throw new HttpError(422, 'POLICY_NOT_UNDERSTOOD', { message: err.message });
    throw err;
  }
});

// Step 2: the user confirmed the (possibly edited) policy -> save the vault.

vaultsRouter.post('/', async (req, res) => {
  const body = CreateVaultBody.parse(req.body);
  const policy: Policy = body.policy;

  if (new Date(policy.rules.expiry_timestamp) <= new Date()) throw new HttpError(400, 'EXPIRY_IN_PAST');
  if (policy.rules.max_single_transaction > policy.allocated_budget) throw new HttpError(400, 'MAX_TX_ABOVE_BUDGET');
  // Paying in over time: the vault must last until the last planned payment.
  if (policy.savings) {
    const { lastPaymentAt } = savingsSchedule(toCents(policy.allocated_budget), policy.savings, new Date());
    if (new Date(policy.rules.expiry_timestamp) <= lastPaymentAt) {
      throw new HttpError(400, 'EXPIRY_BEFORE_LAST_PAYMENT', { message: 'The vault must last until the last savings payment.' });
    }
  }

  const user = body.userId
    ? await prisma.user.findUniqueOrThrow({ where: { id: body.userId } })
    : await prisma.user.findFirstOrThrow({ orderBy: { createdAt: 'asc' } }); // demo user

  const vault = await prisma.vault.create({
    data: {
      userId: user.id,
      name: policy.vault_name,
      type: policy.vault_type,
      budgetCents: toCents(policy.allocated_budget),
      expiresAt: new Date(policy.rules.expiry_timestamp),
      ...(policy.savings ? { savingsPerPaymentCents: toCents(policy.savings.amount_per_payment), savingsEvery: policy.savings.every } : {}),
      policies: { create: { version: 1, policyJson: policy, sourceText: body.sourceText } },
    },
  });
  emit('vault:updated', { vaultId: vault.id });
  res.status(201).json(vault);
});

// ---------- Change policy ----------

// The user changed what an active vault is for, and maybe its amount. Saved as the next policy
// version (earlier versions stay as history). A lower amount refunds the difference right away;
// a higher amount must be paid in first (FUND entry for the difference). `dryRun` only checks the
// change and says how much money moves.

const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;

vaultsRouter.post('/:id/policy', async (req, res) => {
  const body = ChangePolicyBody.parse(req.body);
  const { vault, policy: current } = await loadVault(req.params.id);
  const next: Policy = { ...body.policy, savings: current.savings }; // the payment plan is fixed once saving started

  if (vault.status !== 'ACTIVE') throw new HttpError(409, 'VAULT_NOT_ACTIVE', { message: 'Only an active vault can be changed.' });
  if (next.vault_type !== current.vault_type) {
    const kind = current.vault_type === 'UTILITY' ? 'bill-payment' : 'shopping';
    throw new HttpError(400, 'VAULT_TYPE_CHANGED', { message: `This is a ${kind} vault. Describe a ${kind} task, or create a new vault.` });
  }
  if (new Date(next.rules.expiry_timestamp) <= new Date()) throw new HttpError(400, 'EXPIRY_IN_PAST', { message: 'The new end date is in the past.' });
  if (next.rules.max_single_transaction > next.allocated_budget) throw new HttpError(400, 'MAX_TX_ABOVE_BUDGET');

  const budgetCents = toCents(next.allocated_budget);
  const spentCents = vault.budgetCents - vault.balanceCents; // includes payments still in flight
  if (budgetCents < spentCents) {
    throw new HttpError(409, 'AMOUNT_BELOW_SPENT', { message: `This vault already spent ${dollars(spentCents)}, so its amount can't go below that.` });
  }
  const changeCents = budgetCents - vault.budgetCents;
  if (body.dryRun) return res.json({ changeCents, budgetCents, spentCents });

  const saved = await changeVaultPolicy(vault.id, {
    policyJson: next,
    sourceText: body.sourceText,
    name: next.vault_name,
    expiresAt: new Date(next.rules.expiry_timestamp),
    budgetCents,
  }).catch((err) => {
    if (err instanceof LedgerError && err.code === 'PENDING_SPENDS') {
      throw new HttpError(409, 'PAYMENT_IN_FLIGHT', { message: 'A payment from this vault is still in progress. Try again in a minute.' });
    }
    if (err instanceof LedgerError && err.code === 'TOP_UP_NOT_PAID') {
      throw new HttpError(402, 'TOP_UP_NOT_PAID', { message: `Pay the extra ${dollars(changeCents)} into the vault first.` });
    }
    throw err;
  });

  // Purchases waiting for approval, and options waiting for a pick, were found under the old rules.
  const cancelled = await prisma.decision.updateMany({
    where: { vaultId: vault.id, result: 'NEEDS_HUMAN', resolvedBy: null },
    data: { resolvedBy: 'CANCELLED_POLICY_CHANGED' },
  });
  await prisma.proposal.updateMany({ where: { vaultId: vault.id, status: 'OPEN' }, data: { status: 'CANCELLED', resolvedAt: new Date() } });

  let refundError: string | undefined;
  if (saved.refund) {
    // A rejected payout puts the money (and the amount) back into the vault (failOutflow).
    await payOutLiquidation(saved.refund.id).catch((err) => {
      refundError = err instanceof Error ? err.message : String(err);
    });
  }

  await startWatching(vault.id); // shopping vaults: the agent looks again, with the new rules
  emit('vault:updated', { vaultId: vault.id });
  emit('ledger:updated', { vaultId: vault.id });
  emit('policy:changed', { vaultId: vault.id, version: saved.policy.version, changeCents, cancelledApprovals: cancelled.count, refundError });
  res.json({
    vault: await prisma.vault.findUniqueOrThrow({ where: { id: vault.id } }),
    version: saved.policy.version,
    changeCents,
    refund: saved.refund,
    refundError,
    cancelledApprovals: cancelled.count,
  });
});

// ---------- Fund (Orders API + JS SDK button) ----------

vaultsRouter.post('/:id/fund/order', async (req, res) => {
  const { vault } = await loadVault(req.params.id);
  if (vault.status !== 'PENDING_FUNDING') throw new HttpError(409, 'VAULT_ALREADY_FUNDED');
  if (vault.savingsPerPaymentCents !== null) {
    throw new HttpError(409, 'SAVINGS_NEED_LINKED_PAYPAL', { message: 'Savings vaults are paid from a linked PayPal account (create them on the PayPal site).' });
  }
  const asked = await prisma.fundRequest.findFirst({ where: { vaultId: vault.id, status: 'OPEN' } });
  if (asked) throw new HttpError(409, 'FRIEND_REQUEST_OPEN', { message: `${asked.payerEmail} was asked to fund this vault. Cancel that request first.` });

  const order = await createOrder({
    vaultId: vault.id,
    amountCents: vault.budgetCents,
    description: `Fund PayPalVault vault: ${vault.name}`,
    requestId: `fund-${vault.id}`,
  });
  // Same request id returns the same order, so only record it once.
  const known = await prisma.ledgerEntry.findUnique({ where: { paypalRef: order.orderId } });
  if (!known) await startFunding(vault.id, vault.budgetCents, order.orderId);
  res.json(order);
});

// A client that credits the vault itself (the PayPal site pays from a saved PayPal account and writes
// the FUND entry directly) reports it here, so live updates and alert emails still happen.
vaultsRouter.post('/:id/fund/recorded', requireInternalKey, async (req, res) => {
  const { orderId } = OrderIdBody.parse(req.body);
  const entry = await prisma.ledgerEntry.findUnique({ where: { paypalRef: orderId } });
  if (!entry || entry.vaultId !== req.params.id || entry.type !== 'FUND') throw new HttpError(404, 'ORDER_NOT_FOUND');
  emit('vault:updated', { vaultId: entry.vaultId });
  emit('ledger:updated', { vaultId: entry.vaultId, entryId: entry.id });
  res.json({ ok: true });
});

vaultsRouter.post('/:id/fund/capture', async (req, res) => {
  const { orderId } = OrderIdBody.parse(req.body);
  const entry = await prisma.ledgerEntry.findUnique({ where: { paypalRef: orderId } });
  if (!entry || entry.vaultId !== req.params.id || entry.type !== 'FUND') throw new HttpError(404, 'ORDER_NOT_FOR_THIS_VAULT');
  const { vault } = await finishFunding(orderId);
  res.json(vault);
});

// ---------- Ask a friend (PayPal money request; the friend's payment goes straight into the vault) ----------

vaultsRouter.post('/:id/fund/requests', async (req, res) => {
  const body = FundRequestBody.parse(req.body);
  res.status(201).json(await createFundRequest(req.params.id, body));
});

// Asks PayPal whether the friend paid (webhooks and the background tick do this too).
vaultsRouter.post('/:id/fund/requests/sync', async (req, res) => {
  await syncFundRequests(req.params.id);
  const [vault, fundRequests] = await Promise.all([
    prisma.vault.findUniqueOrThrow({ where: { id: req.params.id } }),
    prisma.fundRequest.findMany({ where: { vaultId: req.params.id }, orderBy: { createdAt: 'desc' }, take: 10 }),
  ]);
  res.json({ vault, fundRequests });
});

vaultsRouter.post('/:id/fund/requests/:requestId/cancel', async (req, res) => {
  const request = await prisma.fundRequest.findUnique({ where: { id: req.params.requestId } });
  if (!request || request.vaultId !== req.params.id) throw new HttpError(404, 'REQUEST_NOT_FOUND');
  res.json(await cancelFundRequest(request, 'The vault owner cancelled this request.'));
});

// ---------- Subscribe (utility vault monthly top-up) ----------

vaultsRouter.post('/:id/subscribe', async (req, res) => {
  const { vault } = await loadVault(req.params.id);
  if (vault.type !== 'UTILITY') throw new HttpError(409, 'ONLY_UTILITY_VAULTS_SUBSCRIBE');
  const planId = process.env.PAYPAL_UTILITY_PLAN_ID;
  if (!planId) throw new HttpError(500, 'PAYPAL_UTILITY_PLAN_ID_MISSING');
  // The JS SDK button calls actions.subscription.create({ plan_id: planId, custom_id: vault.id }).
  res.json({ planId, customId: vault.id });
});

vaultsRouter.post('/:id/subscribe/confirm', async (req, res) => {
  const { subscriptionId } = SubscriptionIdBody.parse(req.body);
  const sub = await getSubscription(subscriptionId);
  if (sub.vaultId !== req.params.id || sub.planId !== process.env.PAYPAL_UTILITY_PLAN_ID) {
    throw new HttpError(409, 'SUBSCRIPTION_NOT_FOR_THIS_VAULT');
  }
  const vault = await prisma.vault.update({ where: { id: req.params.id }, data: { paypalSubscriptionId: sub.subscriptionId } });
  emit('vault:updated', { vaultId: vault.id });
  // Money arrives with each PAYMENT.SALE.COMPLETED webhook (Step 9).
  res.json({ vault, subscriptionStatus: sub.status });
});

// ---------- Spend (agents only) ----------

vaultsRouter.post<{ id: string }>('/:id/spend', requireInternalKey, async (req, res) => {
  const request = SpendRequestSchema.parse(req.body);
  const { vault, policy } = await loadVault(req.params.id);
  // The user changed the rules while this agent run was searching: it was looking for the old thing.
  const stale = runUsesOldPolicy(vault.id, vault.policies[0]?.version ?? 0);
  const result = await decideAndSpend(vault, policy, request, stale ? { verdict: { result: 'BLOCK', reasons: ['POLICY_CHANGED'] } } : {});
  const status = { APPROVE: 200, BLOCK: 403, NEEDS_HUMAN: 202 }[result.decision.result];
  res.status(status).json(result);
});

// ---------- Run the vault's AI agent (Step 8) ----------

// Runs the shopping or bill-pay agent inside this vault now. Each tool call is streamed to the
// dashboard as an agent:step event; the agent spends only through POST /:id/spend above.
// A shopping run that finds nothing (NO_MATCH) is retried automatically until expiry (watch mode).
vaultsRouter.post('/:id/agent', async (req, res) => {
  const { task } = AgentRunBody.parse(req.body ?? {});
  const { vault } = await loadVault(req.params.id);
  if (vault.type === 'SAVINGS') throw new HttpError(409, 'NO_AGENT', { message: 'A savings vault has no agent: it only saves.' });
  if (vault.status !== 'ACTIVE') throw new HttpError(409, 'VAULT_NOT_ACTIVE');
  res.json(await runAgentForVault(vault.id, task));
});

vaultsRouter.post('/:id/agent/stop', async (req, res) => {
  await stopWatching(req.params.id);
  res.json({ ok: true });
});

// ---------- Human approval of NEEDS_HUMAN decisions ----------

vaultsRouter.post('/:id/decisions/:decisionId/approve', async (req, res) => {
  const decision = await prisma.decision.findUniqueOrThrow({ where: { id: req.params.decisionId } });
  if (decision.vaultId !== req.params.id || decision.result !== 'NEEDS_HUMAN' || decision.resolvedBy) {
    throw new HttpError(409, 'DECISION_NOT_PENDING');
  }
  // Re-check the hard rules (the vault may have changed since). The human overrides only the soft flags.
  const { vault, policy } = await loadVault(req.params.id);
  const request = SpendRequestSchema.parse(decision.requestJson);
  const recheck = evaluate(vault, policy, request, await buildEngineContext(vault, request), { ignoreSoft: true });
  if (recheck.result === 'BLOCK') throw new HttpError(409, 'NOW_BLOCKED', { reasons: recheck.reasons });

  // Only one approval wins if the button is clicked twice.
  const claimed = await prisma.decision.updateMany({
    where: { id: decision.id, resolvedBy: null },
    data: { resolvedBy: 'APPROVED_BY_HUMAN' },
  });
  if (claimed.count === 0) throw new HttpError(409, 'DECISION_NOT_PENDING');
  emit('decision:created', { vaultId: decision.vaultId, decisionId: decision.id, result: 'APPROVED_BY_HUMAN' });
  const result = await executeSpend(decision.id);
  await continueShoppingList(decision.vaultId); // shopping lists: on to the next item
  res.json(result);
});

vaultsRouter.post('/:id/decisions/:decisionId/reject', async (req, res) => {
  const decision = await prisma.decision.findUniqueOrThrow({ where: { id: req.params.decisionId } });
  if (decision.vaultId !== req.params.id || decision.result !== 'NEEDS_HUMAN' || decision.resolvedBy) {
    throw new HttpError(409, 'DECISION_NOT_PENDING');
  }
  const updated = await prisma.decision.update({ where: { id: decision.id }, data: { resolvedBy: 'REJECTED_BY_HUMAN' } });
  await startWatching(decision.vaultId); // shopping vaults: look for something else
  emit('decision:created', { vaultId: decision.vaultId, decisionId: decision.id, result: 'BLOCK' });
  res.json(updated);
});

// ---------- Ask me: the agent's top options, the owner picks one ----------

// The shopping agent (Ask me vaults) saves its top options here instead of buying. Newer options
// replace older ones that are still open (for the same list item).
vaultsRouter.post<{ id: string }>('/:id/proposals', requireInternalKey, async (req, res) => {
  const body = CreateProposalSchema.parse(req.body);
  const { vault } = await loadVault(req.params.id);
  if (vault.status !== 'ACTIVE') throw new HttpError(409, 'VAULT_NOT_ACTIVE');
  await prisma.proposal.updateMany({
    where: { vaultId: vault.id, status: 'OPEN', itemId: body.item_id ?? null },
    data: { status: 'CANCELLED', resolvedAt: new Date() },
  });
  const proposal = await prisma.proposal.create({
    data: { vaultId: vault.id, itemId: body.item_id, summary: body.summary, options: body.options },
  });
  emit('proposal:created', { vaultId: vault.id, proposalId: proposal.id });
  emit('vault:updated', { vaultId: vault.id });
  res.status(201).json(proposal);
});

// The owner picked option `index`. It goes through the Policy Engine like any purchase: the pick
// stands in for the control setting, every other rule still applies. A blocked pick reopens the
// options so another one can be picked.
vaultsRouter.post('/:id/proposals/:proposalId/choose', async (req, res) => {
  const { index } = ChooseOptionBody.parse(req.body);
  const { vault, policy } = await loadVault(req.params.id);
  const proposal = await prisma.proposal.findUnique({ where: { id: req.params.proposalId } });
  if (!proposal || proposal.vaultId !== vault.id || proposal.status !== 'OPEN') throw new HttpError(409, 'PROPOSAL_NOT_OPEN');
  const option = ProposalOptionSchema.array().parse(proposal.options)[index];
  if (!option) throw new HttpError(400, 'NO_SUCH_OPTION');

  // Only one pick wins if the button is clicked twice.
  const claimed = await prisma.proposal.updateMany({
    where: { id: proposal.id, status: 'OPEN' },
    data: { status: 'CHOSEN', chosenIndex: index, resolvedAt: new Date() },
  });
  if (claimed.count === 0) throw new HttpError(409, 'PROPOSAL_NOT_OPEN');
  const reopen = () =>
    prisma.proposal.update({ where: { id: proposal.id }, data: { status: 'OPEN', chosenIndex: null, resolvedAt: null } });

  const request: SpendRequest = {
    merchant: option.merchant,
    amount: option.verified_price ?? option.price,
    category: option.category,
    reason: option.title,
    product_url: option.url,
    verified_price: option.verified_price ?? undefined,
    ...(proposal.itemId ? { item_id: proposal.itemId } : {}),
    ...(option.channel3 ? { channel3: option.channel3 } : {}),
  };
  const result = await decideAndSpend(vault, policy, request, { ownerChose: true }).catch(async (err) => {
    await reopen().catch(() => undefined);
    throw err;
  });
  const updated = result.decision.result === 'BLOCK'
    ? await reopen()
    : await prisma.proposal.update({ where: { id: proposal.id }, data: { decisionId: result.decision.id } });
  if (result.decision.result === 'APPROVE') await continueShoppingList(vault.id); // on to the next item
  emit('vault:updated', { vaultId: vault.id });
  const status = { APPROVE: 200, BLOCK: 403, NEEDS_HUMAN: 202 }[result.decision.result];
  res.status(status).json({ proposal: updated, ...result });
});

// None of the options are right: the agent looks again (skipping these products).
vaultsRouter.post('/:id/proposals/:proposalId/reject', async (req, res) => {
  const claimed = await prisma.proposal.updateMany({
    where: { id: req.params.proposalId, vaultId: req.params.id, status: 'OPEN' },
    data: { status: 'REJECTED', resolvedAt: new Date() },
  });
  if (claimed.count === 0) throw new HttpError(409, 'PROPOSAL_NOT_OPEN');
  await startWatching(req.params.id);
  emit('vault:updated', { vaultId: req.params.id });
  res.json({ ok: true });
});

// ---------- Paying in over time (savings) ----------

// Takes the next payment from the owner's saved PayPal account now: the first one (the site calls
// this right after creating the vault) or an early one ("pay now"). Scheduled ones run in the tick.
vaultsRouter.post<{ id: string }>('/:id/savings/charge', requireInternalKey, async (req, res) => {
  res.json(await chargeSavingsPayment(req.params.id));
});

// Move the agent's next check (vault timeline drag). Nothing moves money, so no extra checks needed
// beyond: the vault is active, the agent is watching it, and the time is before the vault ends.
vaultsRouter.post('/:id/agent/next', async (req, res) => {
  const { at } = WhenBody.parse(req.body);
  const { vault } = await loadVault(req.params.id);
  if (vault.status !== 'ACTIVE') throw new HttpError(409, 'VAULT_NOT_ACTIVE', { message: 'The agent only works while the vault is active.' });
  if (!vault.nextAgentRunAt) throw new HttpError(409, 'NOT_WATCHING', { message: 'The agent is not watching this vault. Tap Run now first.' });
  if (!(at.getTime() > Date.now() + 60_000)) throw new HttpError(400, 'DATE_IN_PAST', { message: 'Pick a time from now on.' });
  if (at >= vault.expiresAt) throw new HttpError(400, 'AFTER_VAULT_ENDS', { message: 'That is after the vault ends.' });
  const updated = await prisma.vault.update({ where: { id: vault.id }, data: { nextAgentRunAt: at } });
  emit('vault:updated', { vaultId: vault.id, nextAgentRunAt: at });
  res.json({ nextAgentRunAt: updated.nextAgentRunAt });
});

// Move the next savings payment (vault calendar drag).
vaultsRouter.post('/:id/savings/next', async (req, res) => {
  const { at } = WhenBody.parse(req.body);
  res.json(await rescheduleSavings(req.params.id, at));
});

// Move the vault's end date (vault calendar drag). Only the end date changes: it is saved as the next
// policy version (same rules otherwise), money and purchases waiting for approval are untouched.
const MAX_VAULT_DAYS = 90;
vaultsRouter.post('/:id/expiry', async (req, res) => {
  const { expiresAt } = ExpiryBody.parse(req.body);
  const { vault, policy } = await loadVault(req.params.id);
  const now = new Date();
  if (vault.status !== 'ACTIVE' && vault.status !== 'SAVING') {
    throw new HttpError(409, 'VAULT_NOT_OPEN', { message: 'Only an open vault can get a new end date.' });
  }
  if (!(expiresAt.getTime() > now.getTime() + 3_600_000)) throw new HttpError(400, 'EXPIRY_IN_PAST', { message: 'The new end date must be at least an hour from now.' });
  const saving = vault.savingsEvery !== null && vault.savingsPerPaymentCents !== null;
  const maxDays = saving ? SAVINGS_MAX_DAYS : MAX_VAULT_DAYS;
  if (expiresAt.getTime() - now.getTime() > maxDays * 86_400_000) {
    throw new HttpError(400, 'EXPIRY_TOO_FAR', { message: `A vault can end at most ${maxDays} days from now.` });
  }
  if (vault.status === 'SAVING' && saving && vault.nextChargeAt) {
    const remaining = Math.ceil((vault.budgetCents - vault.balanceCents) / vault.savingsPerPaymentCents!);
    const lastAt = addInterval(vault.nextChargeAt, vault.savingsEvery!, Math.max(0, remaining - 1));
    if (expiresAt <= lastAt) {
      throw new HttpError(409, 'EXPIRY_BEFORE_LAST_PAYMENT', { message: `The vault must last until the last savings payment (${lastAt.toDateString()}).` });
    }
  }
  const next: Policy = { ...policy, rules: { ...policy.rules, expiry_timestamp: expiresAt.toISOString() } };
  const latest = await prisma.policy.findFirst({ where: { vaultId: vault.id }, orderBy: { version: 'desc' } });
  const [saved, updated] = await prisma.$transaction([
    prisma.policy.create({
      data: { vaultId: vault.id, version: (latest?.version ?? 0) + 1, policyJson: next, sourceText: latest?.sourceText ?? undefined },
    }),
    prisma.vault.update({ where: { id: vault.id }, data: { expiresAt } }),
  ]);
  emit('vault:updated', { vaultId: vault.id });
  emit('policy:changed', { vaultId: vault.id, version: saved.version, changeCents: 0, cancelledApprovals: 0 });
  res.json({ vault: updated, version: saved.version });
});

vaultsRouter.post('/:id/savings/pause', async (req, res) => {
  await pauseSavings(req.params.id);
  res.json({ ok: true });
});

vaultsRouter.post('/:id/savings/resume', async (req, res) => {
  await resumeSavings(req.params.id);
  res.json({ ok: true });
});

// ---------- Liquidate + sync ----------

vaultsRouter.post('/:id/liquidate', async (req, res) => {
  await syncPendingPayouts(req.params.id); // settle finished spends first
  const entry = await startLiquidation(req.params.id);
  const payout = entry ? await payOutLiquidation(entry.id) : null;
  const vault = await prisma.vault.findUniqueOrThrow({ where: { id: req.params.id } });
  emit('vault:updated', { vaultId: vault.id });
  res.json({ vault, ledgerEntry: entry, payout });
});

vaultsRouter.post('/:id/sync', async (req, res) => {
  await syncPendingCheckouts(req.params.id);
  res.json(await syncPendingPayouts(req.params.id));
});
