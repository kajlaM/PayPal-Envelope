import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description38 = {
  TaxIdLengthShouldBeLessThan100Characters: "Tax id length should be less than 100 characters.",
} as const;
export type Description38 = (typeof Description38)[keyof typeof Description38] | (string & {});

export const description38Schema: EnumSchema<Description38> = s.enumOf<Description38>(Description38);
