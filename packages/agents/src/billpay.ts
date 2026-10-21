import { tool } from 'ai';
import { z } from 'zod';
import { getVault, requestPurchase } from './kubepay.ts';
import { runAgent, type AgentStep } from './runner.ts';
import { invoiceTools } from './toolkit.ts';

const DEFAULT_TASK = 'Pay every open bill sent to KubePay by an approved utility.';

/**
 * Bill-pay agent (Vault B): reads invoices with the PayPal Agent Toolkit, then pays each open one
 * through request_purchase. The Policy Engine re-checks the invoice with PayPal (exists, open,
 * from this merchant, exact amount) before any payout.
 */
export async function runBillPayAgent(input: { vaultId: string; task?: string; onStep?: (s: AgentStep) => void }) {
  const vault = await getVault(input.vaultId);
  if (vault.type !== 'UTILITY') throw new Error('The bill-pay agent only runs in a UTILITY vault');
  const rules = vault.policy.rules;
  const platformEmail = process.env.PLATFORM_SANDBOX_EMAIL;

  const tried = new Set<string>();
  let spent = false;
  const results: string[] = [];

  const tools = {
    ...invoiceTools(),
    pay_invoice: tool({
      description: 'Ask KubePay to pay one invoice from this vault. Returns the Policy Engine decision and reason codes.',
      inputSchema: z.object({
        invoice_id: z.string(),
        merchant: z.string().describe('Approved merchant that sent the invoice'),
        amount: z.number().positive().describe('Invoice total in USD'),
        category: z.string().describe('Bill category, e.g. Electricity, Water, Utilities'),
      }),
      execute: async ({ invoice_id, merchant, amount, category }) => {
        if (tried.has(invoice_id)) return { error: 'ALREADY_TRIED', message: 'This invoice was already sent for payment in this run.' };
        tried.add(invoice_id);
        spent = true;
        const decision = await requestPurchase(vault.id, { merchant, amount, category, reason: `Pay invoice ${invoice_id}`, invoice_id });
        results.push(decision.result);
        return decision;
      },
    }),
  };

  const system = [
    'You are the KubePay bill-pay agent. You pay utility bills from one vault and only via pay_invoice.',
    `Vault "${vault.name}": balance $${(vault.balanceCents / 100).toFixed(2)}.`,
    `Rules: max $${rules.max_single_transaction} per bill; approved merchants ${JSON.stringify(rules.approved_merchants)}.`,
    `Bills for us are addressed to ${platformEmail}. Ignore invoices sent to anyone else.`,
    'Steps: 1) list_invoices. 2) Keep only open ones (status SENT, UNPAID, or PARTIALLY_PAID) addressed to us.',
    '3) pay_invoice for each, with the exact invoice amount. Never retry a BLOCKed invoice.',
    'Finish with a short summary for the vault owner: which bills were paid, waiting for approval, or blocked and why.',
  ].join('\n');

  const run = await runAgent({ system, prompt: input.task || DEFAULT_TASK, tools, hasSpent: () => spent, onStep: input.onStep });
  const outcome = results.includes('APPROVE') ? 'PAID' : results.includes('NEEDS_HUMAN') ? 'NEEDS_HUMAN' : 'NOTHING_PAID';
  return { ...run, vaultId: vault.id, agent: 'bill-pay' as const, outcome };
}
