import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { conditionSchema, type Condition } from "./condition.js";

export type Item = {
  id: string;
  name: string;
  productQuery: string;
  maxPrice: number;
  requiredKeywords?: string[];
  preferredKeywords?: string[];
  condition?: Condition;
  minRating?: number;
  maxDeliveryDays?: number;
};

export const itemSchema: Schema<Item> = s.object<Item>({
  id: s.string(),
  name: s.string(),
  productQuery: s.string(),
  maxPrice: s.float64(),
  requiredKeywords: s.optional(s.array(s.string())),
  preferredKeywords: s.optional(s.array(s.string())),
  condition: s.optional(s.lazy(() => conditionSchema)),
  minRating: s.optional(s.float64()),
  maxDeliveryDays: s.optional(s.int()),
  _keysMap: {
    productQuery: "product_query",
    maxPrice: "max_price",
    requiredKeywords: "required_keywords",
    preferredKeywords: "preferred_keywords",
    minRating: "min_rating",
    maxDeliveryDays: "max_delivery_days",
  },
});
