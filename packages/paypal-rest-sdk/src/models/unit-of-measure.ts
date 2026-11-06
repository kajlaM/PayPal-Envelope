import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/** The unit of measure for the invoiced item. */
export const UnitOfMeasure = {
  Quantity: "QUANTITY",
  Hours: "HOURS",
  Amount: "AMOUNT",
} as const;
export type UnitOfMeasure = (typeof UnitOfMeasure)[keyof typeof UnitOfMeasure] | (string & {});

export const unitOfMeasureSchema: EnumSchema<UnitOfMeasure> = s.enumOf<UnitOfMeasure>(UnitOfMeasure);
