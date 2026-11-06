import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { policySchema, type Policy } from "./policy.js";

export type ApiVaultsPolicyRequest = {
  policy: Policy;
  sourceText?: string;
  dryRun?: boolean;
};

export const apiVaultsPolicyRequestSchema: Schema<ApiVaultsPolicyRequest> = s.object<ApiVaultsPolicyRequest>({
  policy: policySchema,
  sourceText: s.optional(s.string()),
  dryRun: s.optional(s.boolean()),
});
