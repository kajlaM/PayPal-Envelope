import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { channel3Schema, type Channel3 } from "./channel3.js";

export type RequestJson = {
  merchant: string;
  amount: number;
  category: string;
  reason: string;
  productUrl?: string;
  verifiedPrice?: number;
  invoiceId?: string;
  itemId?: string;
  channel3?: Channel3;
};

export const requestJsonSchema: Schema<RequestJson> = s.object<RequestJson>({
  merchant: s.string(),
  amount: s.float64(),
  category: s.string(),
  reason: s.string(),
  productUrl: s.optional(s.string()),
  verifiedPrice: s.optional(s.float64()),
  invoiceId: s.optional(s.string()),
  itemId: s.optional(s.string()),
  channel3: s.optional(s.lazy(() => channel3Schema)),
  _keysMap: {
    productUrl: "product_url",
    verifiedPrice: "verified_price",
    invoiceId: "invoice_id",
    itemId: "item_id",
  },
});
