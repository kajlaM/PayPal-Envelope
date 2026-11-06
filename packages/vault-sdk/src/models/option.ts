import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { channel3Schema, type Channel3 } from "./channel3.js";

export type Option = {
  title: string;
  merchant: string;
  price: number;
  verifiedPrice: number | null;
  url: string;
  category: string;
  rating?: number | null;
  deliveryDays?: number | null;
  condition?: string | null;
  channel3?: Channel3;
  pros: string[];
  cons: string[];
};

export const optionSchema: Schema<Option> = s.object<Option>({
  title: s.string(),
  merchant: s.string(),
  price: s.float64(),
  verifiedPrice: s.nullable(s.float64()),
  url: s.string(),
  category: s.string(),
  rating: s.optionalNullable(s.float64()),
  deliveryDays: s.optionalNullable(s.float64()),
  condition: s.optionalNullable(s.string()),
  channel3: s.optional(s.lazy(() => channel3Schema)),
  pros: s.array(s.string()),
  cons: s.array(s.string()),
  _keysMap: {
    verifiedPrice: "verified_price",
    deliveryDays: "delivery_days",
  },
});
