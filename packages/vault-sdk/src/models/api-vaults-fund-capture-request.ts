import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type ApiVaultsFundCaptureRequest = {
  orderId: string;
};

export const apiVaultsFundCaptureRequestSchema: Schema<ApiVaultsFundCaptureRequest> =
  s.object<ApiVaultsFundCaptureRequest>({
    orderId: s.string(),
  });
