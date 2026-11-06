import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type ApiVaultsSubscribeConfirmRequest = {
  subscriptionId: string;
};

export const apiVaultsSubscribeConfirmRequestSchema: Schema<ApiVaultsSubscribeConfirmRequest> =
  s.object<ApiVaultsSubscribeConfirmRequest>({
    subscriptionId: s.string(),
  });
