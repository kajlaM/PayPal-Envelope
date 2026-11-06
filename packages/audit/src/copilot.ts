import { generateText } from 'ai';
import { policyModels } from '@paypalvault/policy';
import { searchAudit, type AuditHit } from './store.ts';

// Audit Copilot: answers questions about spending using only the audit records it finds.

export type CopilotAnswer = { answer: string; sources: AuditHit[]; model: string | null };

export async function askAudit(question: string, opts: { vaultId?: string } = {}): Promise<CopilotAnswer> {
  const sources = await searchAudit(question, { vaultId: opts.vaultId, size: 8 });
  if (sources.length === 0) return { answer: 'I found no audit records about that.', sources, model: null };

  const records = sources.map((s) => `[${s.id}] ${s.timestamp}: ${s.summary}`).join('\n');
  const system = [
    'You are the PayPalVault Audit Copilot. Answer the vault owner in 2-4 short, plain sentences.',
    'Use ONLY the audit records below. If they do not answer the question, say so.',
    'Cite the records you used by their id in square brackets, e.g. [decision-abc].',
    `Audit records (most relevant first):\n${records}`,
  ].join('\n');

  let lastError: unknown;
  for (const model of policyModels()) {
    try {
      const { text } = await generateText({ model, system, prompt: question, temperature: 0, maxRetries: 1 });
      return { answer: text.trim(), sources, model: model.modelId };
    } catch (err) {
      lastError = err;
      console.warn(`[copilot] ${model.modelId} failed: ${(err as Error).message.slice(0, 120)}`);
    }
  }
  // No AI available: still show what the search found.
  return {
    answer: `AI is unavailable right now (${(lastError as Error)?.message?.slice(0, 80) ?? 'no model'}). Most relevant records: ${sources
      .slice(0, 3)
      .map((s) => `[${s.id}] ${s.summary}`)
      .join(' ')}`,
    sources,
    model: null,
  };
}
