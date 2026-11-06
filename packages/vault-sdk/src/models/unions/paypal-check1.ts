import * as s from "../../core/validation/index.js";
import type { Schema } from "../../core/validation/schema.js";
import { payPalCheckSchema, type PayPalCheck } from "../pay-pal-check.js";

export type PaypalCheck1 = PayPalCheck;

export const paypalCheck1Schema: Schema<PaypalCheck1> = s.of<PaypalCheck1>(
  s.union([s.lazy(() => payPalCheckSchema)]),
);
