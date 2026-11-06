import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type ApiVaultsSavingsNextRequest = {
  at: Date;
};

export const apiVaultsSavingsNextRequestSchema: Schema<ApiVaultsSavingsNextRequest> =
  s.object<ApiVaultsSavingsNextRequest>({
    at: s.dateTime(),
  });
