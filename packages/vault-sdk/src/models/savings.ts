import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { everySchema, type Every } from "./every.js";

export type Savings = {
  amountPerPayment: number;
  every: Every;
};

export const savingsSchema: Schema<Savings> = s.object<Savings>({
  amountPerPayment: s.float64(),
  every: everySchema,
  _keysMap: {
    amountPerPayment: "amount_per_payment",
  },
});
