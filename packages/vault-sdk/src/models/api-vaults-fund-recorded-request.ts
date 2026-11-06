import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type ApiVaultsFundRecordedRequest = {
  orderId: string;
};

export const apiVaultsFundRecordedRequestSchema: Schema<ApiVaultsFundRecordedRequest> =
  s.object<ApiVaultsFundRecordedRequest>({
    orderId: s.string(),
  });
