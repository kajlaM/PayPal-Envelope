import { z } from 'zod';
import { CreateProposalSchema, PolicySchema, SpendRequestSchema } from '@paypalvault/policy';

// The request shapes of the PayPalVault API, in one place. The routes validate with these, and the
// OpenAPI description (scripts/openapi.ts) is built from the same objects, so the two never drift.

export { CreateProposalSchema, PolicySchema, SpendRequestSchema };

export const CompilePolicyBody = z.object({ text: z.string().min(5).max(1000) });

export const CreateVaultBody = z.object({
  policy: PolicySchema,
  sourceText: z.string().max(1000).optional(),
  userId: z.string().optional(),
});

export const ChangePolicyBody = z.object({
  policy: PolicySchema,
  sourceText: z.string().max(1000).optional(),
  dryRun: z.boolean().optional(),
});

export const OrderIdBody = z.object({ orderId: z.string().min(1) });

export const FundRequestBody = z.object({
  payerEmail: z.string().min(3).max(254),
  message: z.string().max(500).optional(),
  requesterName: z.string().max(100).optional(),
});

export const SubscriptionIdBody = z.object({ subscriptionId: z.string() });

export const ChooseOptionBody = z.object({ index: z.number().int().min(0).max(2) });

export const WhenBody = z.object({ at: z.coerce.date() });

export const ExpiryBody = z.object({ expiresAt: z.coerce.date() });

export const VaultDetailsQuery = z.object({ userId: z.string().min(1) });

export const ProductLookupBody = z.object({ url: z.url().max(2000) });

export const AuditSearchQuery = z.object({ q: z.string().min(2).max(300), vaultId: z.string().optional() });

export const AuditAskBody = z.object({ question: z.string().min(3).max(500), vaultId: z.string().optional() });

export const AgentRunBody = z.object({ task: z.string().max(500).optional() });
