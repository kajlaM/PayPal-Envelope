import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type ApiVaultsSyncResponse = {
  entryId?: string;
  status?: string;
};

export const apiVaultsSyncResponseSchema: Schema<ApiVaultsSyncResponse> = s.object<ApiVaultsSyncResponse>({
  entryId: s.optional(s.string()),
  status: s.optional(s.string()),
});
