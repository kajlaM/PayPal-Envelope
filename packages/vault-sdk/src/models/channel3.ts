import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { historySchema, type History } from "./history.js";
import { storeSchema, type Store } from "./store.js";

export type Channel3 = {
  productId?: string | null;
  image?: string | null;
  brand?: string | null;
  stores?: Store[];
  saved?: number | null;
  history?: History | null;
};

export const channel3Schema: Schema<Channel3> = s.object<Channel3>({
  productId: s.optionalNullable(s.string()),
  image: s.optionalNullable(s.string()),
  brand: s.optionalNullable(s.string()),
  stores: s.optional(s.array(s.lazy(() => storeSchema))),
  saved: s.optionalNullable(s.float64()),
  history: s.optionalNullable(s.lazy(() => historySchema)),
  _keysMap: {
    productId: "product_id",
  },
});
