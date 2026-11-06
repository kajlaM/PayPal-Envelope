import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type ApiVaultsAgentRequest = {
  task?: string;
};

export const apiVaultsAgentRequestSchema: Schema<ApiVaultsAgentRequest> = s.object<ApiVaultsAgentRequest>({
  task: s.optional(s.string()),
});
