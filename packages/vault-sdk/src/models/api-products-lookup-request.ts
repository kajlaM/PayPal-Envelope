import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type ApiProductsLookupRequest = {
  url: string;
};

export const apiProductsLookupRequestSchema: Schema<ApiProductsLookupRequest> =
  s.object<ApiProductsLookupRequest>({
    url: s.string(),
  });
