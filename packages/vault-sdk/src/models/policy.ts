import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { Currency, currencySchema } from "./currency.js";
import { liquidationSchema, type Liquidation } from "./liquidation.js";
import { rulesSchema, type Rules } from "./rules.js";
import { savingsSchema, type Savings } from "./savings.js";
import { shoppingSchema, type Shopping } from "./shopping.js";
import { vaultTypeSchema, type VaultType } from "./vault-type.js";

export type Policy = {
  vaultName: string;
  vaultType: VaultType;
  allocatedBudget: number;
  /** @default Currency.Usd */
  currency?: Currency;
  rules: Rules;
  liquidation?: Liquidation;
  shopping?: Shopping;
  savings?: Savings;
};

export const policySchema: Schema<Policy> = s.object<Policy>({
  vaultName: s.string(),
  vaultType: vaultTypeSchema,
  allocatedBudget: s.float64(),
  currency: s.defaulted(currencySchema, Currency.Usd),
  rules: rulesSchema,
  liquidation: s.optional(s.lazy(() => liquidationSchema)),
  shopping: s.optional(s.lazy(() => shoppingSchema)),
  savings: s.optional(s.lazy(() => savingsSchema)),
  _keysMap: {
    vaultName: "vault_name",
    vaultType: "vault_type",
    allocatedBudget: "allocated_budget",
  },
});
