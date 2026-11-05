// Shopping + bill-pay agents (Step 8)
import { runBillPayAgent } from './billpay.ts';
import { getVault } from './kubepay.ts';
import type { AgentStep } from './runner.ts';
import { runShoppingAgent } from './shopping.ts';

export { runBillPayAgent, runShoppingAgent };
export type { AgentRun, AgentStep } from './runner.ts';
export { extractListing } from './verify.ts';
export type { ShoppingOutcome } from './shopping.ts';

/** Runs the right agent for the vault: shopping for SHOPPING, bill-pay for UTILITY. */
export async function runVaultAgent(input: { vaultId: string; task?: string; onStep?: (s: AgentStep) => void }) {
  const vault = await getVault(input.vaultId);
  if (vault.type === 'SAVINGS') throw new Error('A savings vault has no agent: it only saves');
  return vault.type === 'UTILITY' ? runBillPayAgent(input) : runShoppingAgent(input);
}
export { c3 } from './search.ts';
export { priceHistory, priceVerdict, historyText } from './channel3.ts';
