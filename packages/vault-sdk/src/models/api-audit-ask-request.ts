import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type ApiAuditAskRequest = {
  question: string;
  vaultId?: string;
};

export const apiAuditAskRequestSchema: Schema<ApiAuditAskRequest> = s.object<ApiAuditAskRequest>({
  question: s.string(),
  vaultId: s.optional(s.string()),
});
