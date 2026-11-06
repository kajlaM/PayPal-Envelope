import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type ApiVaultsProposalsChooseRequest = {
  index: number;
};

export const apiVaultsProposalsChooseRequestSchema: Schema<ApiVaultsProposalsChooseRequest> =
  s.object<ApiVaultsProposalsChooseRequest>({
    index: s.int(),
  });
