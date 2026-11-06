import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The purpose of the transaction. */
export const Purpose = {
  Awards: "AWARDS",
  Prizes: "PRIZES",
  Donations: "DONATIONS",
  Goods: "GOODS",
  Services: "SERVICES",
  Rebates: "REBATES",
  Cashback: "CASHBACK",
  Discounts: "DISCOUNTS",
  NonGoodsOrServices: "NON_GOODS_OR_SERVICES",
} as const;
export type Purpose = (typeof Purpose)[keyof typeof Purpose] | (string & {});

export const purposeSchema: EnumSchema<Purpose> = s.enumOf<Purpose>(Purpose);
