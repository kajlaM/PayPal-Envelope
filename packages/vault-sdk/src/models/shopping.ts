import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { Condition, conditionSchema } from "./condition.js";
import { listSchema, type List } from "./list.js";
import { weightsSchema, type Weights } from "./weights.js";

export type Shopping = {
  productQuery: string;
  requiredKeywords?: string[];
  preferredKeywords?: string[];
  /** @default Condition.New */
  condition?: Condition;
  minRating?: number;
  maxDeliveryDays?: number;
  weights?: Weights;
  /** @default 180 */
  checkEveryMinutes?: number;
  list?: List;
};

export const shoppingSchema: Schema<Shopping> = s.object<Shopping>({
  productQuery: s.string(),
  requiredKeywords: s.optional(s.array(s.string())),
  preferredKeywords: s.optional(s.array(s.string())),
  condition: s.defaulted(conditionSchema, Condition.New),
  minRating: s.optional(s.float64()),
  maxDeliveryDays: s.optional(s.int()),
  weights: s.optional(s.lazy(() => weightsSchema)),
  checkEveryMinutes: s.defaulted(s.int(), 180),
  list: s.optional(s.lazy(() => listSchema)),
  _keysMap: {
    productQuery: "product_query",
    requiredKeywords: "required_keywords",
    preferredKeywords: "preferred_keywords",
    minRating: "min_rating",
    maxDeliveryDays: "max_delivery_days",
    checkEveryMinutes: "check_every_minutes",
  },
});
