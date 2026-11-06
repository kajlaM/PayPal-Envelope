import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type Store = {
  merchant: string;
  price: number;
  was?: number | null;
  url?: string;
};

export const storeSchema: Schema<Store> = s.object<Store>({
  merchant: s.string(),
  price: s.float64(),
  was: s.optionalNullable(s.float64()),
  url: s.optional(s.string()),
});
