import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type ApiVaultsExpiryRequest = {
  expiresAt: Date;
};

export const apiVaultsExpiryRequestSchema: Schema<ApiVaultsExpiryRequest> = s.object<ApiVaultsExpiryRequest>({
  expiresAt: s.dateTime(),
});
