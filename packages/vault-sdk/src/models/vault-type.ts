import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const VaultType = {
  Shopping: "SHOPPING",
  Utility: "UTILITY",
  Savings: "SAVINGS",
} as const;
export type VaultType = (typeof VaultType)[keyof typeof VaultType] | (string & {});

export const vaultTypeSchema: EnumSchema<VaultType> = s.enumOf<VaultType>(VaultType);
