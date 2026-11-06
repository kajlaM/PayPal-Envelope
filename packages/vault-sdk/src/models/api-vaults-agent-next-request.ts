import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type ApiVaultsAgentNextRequest = {
  at: Date;
};

export const apiVaultsAgentNextRequestSchema: Schema<ApiVaultsAgentNextRequest> =
  s.object<ApiVaultsAgentNextRequest>({
    at: s.dateTime(),
  });
