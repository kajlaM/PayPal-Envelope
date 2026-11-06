import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { itemSchema, type Item } from "./item.js";
import { rebalanceSchema, type Rebalance } from "./rebalance.js";

export type List = {
  items: Item[];
  rebalance?: Rebalance;
};

export const listSchema: Schema<List> = s.object<List>({
  items: s.array(s.lazy(() => itemSchema)),
  rebalance: s.optional(s.lazy(() => rebalanceSchema)),
});
