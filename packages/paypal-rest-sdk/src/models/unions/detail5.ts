import * as s from "../../core/validation/index.js";
import type { Schema } from "../../core/validation/schema.js";
import { invalidDecimalValueSchema, type InvalidDecimalValue } from "../invalid-decimal-value.js";
import { invalidIntegerValueSchema, type InvalidIntegerValue } from "../invalid-integer-value.js";
import { invalidParameterSyntax6Schema, type InvalidParameterSyntax6 } from "../invalid-parameter-syntax6.js";
import { invalidParameterSyntax7Schema, type InvalidParameterSyntax7 } from "../invalid-parameter-syntax7.js";
import { invalidPaymentMethodSchema, type InvalidPaymentMethod } from "../invalid-payment-method.js";
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
import { notSupportedSchema, type NotSupported } from "../not-supported.js";
import { valueCannotBeZeroSchema, type ValueCannotBeZero } from "../value-cannot-be-zero.js";

export type Detail5 =
  | MissingRequiredParameter
  | InvalidPaymentMethod
  | NotSupported
  | InvalidStringLength5
  | MissingRequiredParameter1
  | InvalidStringMaxLength
  | InvalidParameterSyntax6
  | ValueCannotBeZero
  | InvalidDecimalValue
  | InvalidIntegerValue
  | InvalidParameterSyntax7;

export const detail5Schema: Schema<Detail5> = s.of<Detail5>(
  s.union([
    s.lazy(() => missingRequiredParameterSchema),
    s.lazy(() => invalidPaymentMethodSchema),
    s.lazy(() => notSupportedSchema),
    s.lazy(() => invalidStringLength5Schema),
    s.lazy(() => missingRequiredParameter1Schema),
    s.lazy(() => invalidStringMaxLengthSchema),
    s.lazy(() => invalidParameterSyntax6Schema),
    s.lazy(() => valueCannotBeZeroSchema),
    s.lazy(() => invalidDecimalValueSchema),
    s.lazy(() => invalidIntegerValueSchema),
    s.lazy(() => invalidParameterSyntax7Schema),
  ]),
);
