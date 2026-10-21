import { prisma } from './client.ts';
import type { LedgerEntry, Prisma, Vault } from './generated/prisma/client.ts';

// Every change to a vault balance goes through this file.
// Each function runs in one DB transaction and locks the vault row first,
// so two agent calls can never spend the same money.

type Tx = Prisma.TransactionClient;

export type LedgerErrorCode =
  | 'VAULT_NOT_FOUND'
  | 'VAULT_INACTIVE'
  | 'VAULT_EXPIRED'
  | 'INSUFFICIENT_VAULT_BALANCE'
  | 'INVALID_AMOUNT'
  | 'PENDING_SPENDS';

export class LedgerError extends Error {
  constructor(public code: LedgerErrorCode) {
    super(code);
  }
}

async function lockVault(tx: Tx, vaultId: string): Promise<Vault> {
  const rows = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM vaults WHERE id = ${vaultId} FOR UPDATE`;
  if (rows.length === 0) throw new LedgerError('VAULT_NOT_FOUND');
  return tx.vault.findUniqueOrThrow({ where: { id: vaultId } });
}

function assertAmount(amountCents: number) {
  if (!Number.isInteger(amountCents) || amountCents <= 0) throw new LedgerError('INVALID_AMOUNT');
}

/** User clicked the PayPal button: record the order before it is captured. */
export async function startFunding(vaultId: string, amountCents: number, paypalOrderId: string) {
  assertAmount(amountCents);
  return prisma.ledgerEntry.create({
    data: { vaultId, type: 'FUND', amountCents, paypalRef: paypalOrderId, note: 'Vault funding (Orders API)' },
  });
}

/** Order captured: add the money to the vault and activate it. Safe to call twice. */
export async function completeFunding(paypalOrderId: string) {
  return prisma.$transaction(async (tx) => {
    const entry = await tx.ledgerEntry.findUniqueOrThrow({ where: { paypalRef: paypalOrderId } });
    const vault = await lockVault(tx, entry.vaultId);
    const updated = await tx.ledgerEntry.updateMany({
      where: { id: entry.id, status: 'PENDING' },
      data: { status: 'COMPLETED' },
    });
    if (updated.count === 0) return vault;
    return tx.vault.update({
      where: { id: vault.id },
      data: {
        balanceCents: { increment: entry.amountCents },
        status: vault.status === 'PENDING_FUNDING' ? 'ACTIVE' : vault.status,
      },
    });
  });
}

/** Subscription payment (top-up) arrived. Safe to call twice with the same sale id. */
export async function addFunding(vaultId: string, amountCents: number, paypalSaleId: string) {
  assertAmount(amountCents);
  return prisma.$transaction(async (tx) => {
    const vault = await lockVault(tx, vaultId);
    const existing = await tx.ledgerEntry.findUnique({ where: { paypalRef: paypalSaleId } });
    if (existing) return vault;
    await tx.ledgerEntry.create({
      data: { vaultId, type: 'FUND', status: 'COMPLETED', amountCents, paypalRef: paypalSaleId, note: 'Subscription top-up' },
    });
    return tx.vault.update({
      where: { id: vaultId },
      data: {
        balanceCents: { increment: amountCents },
        status: vault.status === 'PENDING_FUNDING' ? 'ACTIVE' : vault.status,
      },
    });
  });
}

/**
 * Policy Engine approved a payment: take the money out of the vault balance now
 * and create a PENDING SPEND entry. Use the entry id as the Payouts sender_item_id.
 */
export async function reserveSpend(input: {
  vaultId: string;
  amountCents: number;
  merchantId: string;
  decisionId?: string;
  note?: string;
}): Promise<LedgerEntry> {
  assertAmount(input.amountCents);
  return prisma.$transaction(async (tx) => {
    const vault = await lockVault(tx, input.vaultId);
    if (vault.status !== 'ACTIVE') throw new LedgerError('VAULT_INACTIVE');
    if (vault.expiresAt <= new Date()) throw new LedgerError('VAULT_EXPIRED');
    if (vault.balanceCents < input.amountCents) throw new LedgerError('INSUFFICIENT_VAULT_BALANCE');

    await tx.vault.update({
      where: { id: vault.id },
      data: { balanceCents: { decrement: input.amountCents } },
    });
    return tx.ledgerEntry.create({
      data: {
        vaultId: vault.id,
        type: 'SPEND',
        amountCents: input.amountCents,
        merchantId: input.merchantId,
        decisionId: input.decisionId,
        note: input.note,
      },
    });
  });
}

/**
 * Vault expired or was torn down: move the whole balance into a PENDING LIQUIDATE entry.
 * Returns null when there is nothing to pay back.
 */
export async function startLiquidation(vaultId: string): Promise<LedgerEntry | null> {
  return prisma.$transaction(async (tx) => {
    const vault = await lockVault(tx, vaultId);
    if (vault.status === 'LIQUIDATED') return null;

    const open = await tx.ledgerEntry.count({
      where: { vaultId, type: { in: ['SPEND', 'LIQUIDATE'] }, status: 'PENDING' },
    });
    if (open > 0) throw new LedgerError('PENDING_SPENDS');

    if (vault.balanceCents === 0) {
      await tx.vault.update({ where: { id: vaultId }, data: { status: 'LIQUIDATED' } });
      return null;
    }
    await tx.vault.update({
      where: { id: vaultId },
      data: { status: 'EXPIRED', balanceCents: 0 },
    });
    return tx.ledgerEntry.create({
      data: { vaultId, type: 'LIQUIDATE', amountCents: vault.balanceCents, note: 'Leftover balance back to user (Payouts)' },
    });
  });
}

/** Payout succeeded (SPEND or LIQUIDATE). Safe to call twice. */
export async function completeOutflow(entryId: string, paypalRef?: string) {
  return prisma.$transaction(async (tx) => {
    const entry = await tx.ledgerEntry.findUniqueOrThrow({ where: { id: entryId } });
    await lockVault(tx, entry.vaultId);
    const updated = await tx.ledgerEntry.updateMany({
      where: { id: entryId, status: 'PENDING' },
      data: { status: 'COMPLETED', ...(paypalRef ? { paypalRef } : {}) },
    });
    if (updated.count > 0 && entry.type === 'LIQUIDATE') {
      await tx.vault.update({ where: { id: entry.vaultId }, data: { status: 'LIQUIDATED' } });
    }
    return updated.count > 0;
  });
}

/** Payout failed: put the held amount back into the vault. Safe to call twice. */
export async function failOutflow(entryId: string, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const entry = await tx.ledgerEntry.findUniqueOrThrow({ where: { id: entryId } });
    await lockVault(tx, entry.vaultId);
    const updated = await tx.ledgerEntry.updateMany({
      where: { id: entryId, status: 'PENDING' },
      data: { status: 'FAILED', note: reason ?? entry.note },
    });
    if (updated.count > 0) {
      await tx.vault.update({
        where: { id: entry.vaultId },
        data: { balanceCents: { increment: entry.amountCents } },
      });
    }
    return updated.count > 0;
  });
}

/** Recompute a vault balance from its ledger and compare it with the stored balance. */
export async function reconcile(vaultId: string) {
  const vault = await prisma.vault.findUniqueOrThrow({ where: { id: vaultId } });
  const entries = await prisma.ledgerEntry.findMany({ where: { vaultId } });
  let expected = 0;
  for (const e of entries) {
    if (e.type === 'FUND' && e.status === 'COMPLETED') expected += e.amountCents;
    if (e.type !== 'FUND' && e.status !== 'FAILED') expected -= e.amountCents;
  }
  return { storedCents: vault.balanceCents, expectedCents: expected, ok: expected === vault.balanceCents };
}
