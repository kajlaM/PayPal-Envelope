import * as s from "../../core/validation/index.js";
import type { Schema } from "../../core/validation/schema.js";
import { invalidIntegerMaxValueSchema, type InvalidIntegerMaxValue } from "../invalid-integer-max-value.js";
import { invalidIntegerMinValueSchema, type InvalidIntegerMinValue } from "../invalid-integer-min-value.js";

export type Detail = InvalidIntegerMaxValue | InvalidIntegerMinValue;

export const detailSchema: Schema<Detail> = s.of<Detail>(
  s.union([s.lazy(() => invalidIntegerMaxValueSchema), s.lazy(() => invalidIntegerMinValueSchema)]),
);
