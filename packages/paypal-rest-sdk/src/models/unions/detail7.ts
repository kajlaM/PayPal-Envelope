import * as s from "../../core/validation/index.js";
import type { Schema } from "../../core/validation/schema.js";
import { invalidDecimalValueSchema, type InvalidDecimalValue } from "../invalid-decimal-value.js";
import { invalidIntegerValueSchema, type InvalidIntegerValue } from "../invalid-integer-value.js";
import { invalidParameterSyntax6Schema, type InvalidParameterSyntax6 } from "../invalid-parameter-syntax6.js";
import { invalidParameterSyntax8Schema, type InvalidParameterSyntax8 } from "../invalid-parameter-syntax8.js";
import { invalidRefundMethodSchema, type InvalidRefundMethod } from "../invalid-refund-method.js";
import { invalidStringLength5Schema, type InvalidStringLength5 } from "../invalid-string-length5.js";
import { invalidStringMaxLengthSchema, type InvalidStringMaxLength } from "../invalid-string-max-length.js";
import {
  missingRequiredParameterSchema,
  type MissingRequiredParameter,
} from "../missing-required-parameter.js";
import {
  missingRequiredParameter1Schema,
  type MissingRequiredParameter1,
} from "../missing-required-parameter1.js";
import { notSupported1Schema, type NotSupported1 } from "../not-supported1.js";
import { valueCannotBeZero1Schema, type ValueCannotBeZero1 } from "../value-cannot-be-zero1.js";

export type Detail7 =
  | MissingRequiredParameter
  | InvalidRefundMethod
  | InvalidParameterSyntax8
  | InvalidStringLength5
  | NotSupported1
  | MissingRequiredParameter1
  | InvalidParameterSyntax6
  | InvalidStringMaxLength
  | ValueCannotBeZero1
  | InvalidIntegerValue
  | InvalidDecimalValue;

export const detail7Schema: Schema<Detail7> = s.of<Detail7>(
  s.union([
    s.lazy(() => missingRequiredParameterSchema),
    s.lazy(() => invalidRefundMethodSchema),
    s.lazy(() => invalidParameterSyntax8Schema),
    s.lazy(() => invalidStringLength5Schema),
    s.lazy(() => notSupported1Schema),
    s.lazy(() => missingRequiredParameter1Schema),
    s.lazy(() => invalidParameterSyntax6Schema),
    s.lazy(() => invalidStringMaxLengthSchema),
    s.lazy(() => valueCannotBeZero1Schema),
    s.lazy(() => invalidIntegerValueSchema),
    s.lazy(() => invalidDecimalValueSchema),
  ]),
);
