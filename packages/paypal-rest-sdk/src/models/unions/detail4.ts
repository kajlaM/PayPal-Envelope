import * as s from "../../core/validation/index.js";
import type { Schema } from "../../core/validation/schema.js";
import { invalidIntegerMaxValueSchema, type InvalidIntegerMaxValue } from "../invalid-integer-max-value.js";
import { invalidIntegerMinValueSchema, type InvalidIntegerMinValue } from "../invalid-integer-min-value.js";
import { invalidParameterSyntax5Schema, type InvalidParameterSyntax5 } from "../invalid-parameter-syntax5.js";

export type Detail4 = InvalidIntegerMaxValue | InvalidIntegerMinValue | InvalidParameterSyntax5;

export const detail4Schema: Schema<Detail4> = s.of<Detail4>(
  s.union([
    s.lazy(() => invalidIntegerMaxValueSchema),
    s.lazy(() => invalidIntegerMinValueSchema),
    s.lazy(() => invalidParameterSyntax5Schema),
  ]),
);
