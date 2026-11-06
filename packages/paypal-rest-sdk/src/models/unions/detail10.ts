import * as s from "../../core/validation/index.js";
import type { Schema } from "../../core/validation/schema.js";
import { invalidArrayMaxItems2Schema, type InvalidArrayMaxItems2 } from "../invalid-array-max-items2.js";
import { invalidIntegerMaxValueSchema, type InvalidIntegerMaxValue } from "../invalid-integer-max-value.js";
import { invalidIntegerMinValueSchema, type InvalidIntegerMinValue } from "../invalid-integer-min-value.js";
import {
  invalidParameterSyntax10Schema,
  type InvalidParameterSyntax10,
} from "../invalid-parameter-syntax10.js";
import { invalidStringLength12Schema, type InvalidStringLength12 } from "../invalid-string-length12.js";
import {
  invalidStringMaxLength28Schema,
  type InvalidStringMaxLength28,
} from "../invalid-string-max-length28.js";

export type Detail10 =
  | InvalidIntegerMaxValue
  | InvalidIntegerMinValue
  | InvalidStringMaxLength28
  | InvalidArrayMaxItems2
  | InvalidStringLength12
  | InvalidParameterSyntax10;

export const detail10Schema: Schema<Detail10> = s.of<Detail10>(
  s.union([
    s.lazy(() => invalidIntegerMaxValueSchema),
    s.lazy(() => invalidIntegerMinValueSchema),
    s.lazy(() => invalidStringMaxLength28Schema),
    s.lazy(() => invalidArrayMaxItems2Schema),
    s.lazy(() => invalidStringLength12Schema),
    s.lazy(() => invalidParameterSyntax10Schema),
  ]),
);
