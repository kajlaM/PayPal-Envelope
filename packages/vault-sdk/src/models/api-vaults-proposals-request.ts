import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { optionSchema, type Option } from "./option.js";

export type ApiVaultsProposalsRequest = {
  itemId?: string;
  summary?: string;
  options: Option[];
};

export const apiVaultsProposalsRequestSchema: Schema<ApiVaultsProposalsRequest> =
  s.object<ApiVaultsProposalsRequest>({
    itemId: s.optional(s.string()),
    summary: s.optional(s.string()),
    options: s.array(s.lazy(() => optionSchema)),
    _keysMap: {
      itemId: "item_id",
    },
  });
