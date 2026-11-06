import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type ApiVaultsFundRequestsRequest = {
  payerEmail: string;
  message?: string;
  requesterName?: string;
};

export const apiVaultsFundRequestsRequestSchema: Schema<ApiVaultsFundRequestsRequest> =
  s.object<ApiVaultsFundRequestsRequest>({
    payerEmail: s.string(),
    message: s.optional(s.string()),
    requesterName: s.optional(s.string()),
  });
