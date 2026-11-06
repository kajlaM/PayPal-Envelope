import * as s from "../../core/validation/index.js";
import type { Schema } from "../../core/validation/schema.js";
import { invalidParameterSyntax5Schema, type InvalidParameterSyntax5 } from "../invalid-parameter-syntax5.js";
import { invalidStringLength23Schema, type InvalidStringLength23 } from "../invalid-string-length23.js";
import { invalidStringLength28Schema, type InvalidStringLength28 } from "../invalid-string-length28.js";
import { invalidStringLength5Schema, type InvalidStringLength5 } from "../invalid-string-length5.js";
import {
  invalidStringMaxLength56Schema,
  type InvalidStringMaxLength56,
} from "../invalid-string-max-length56.js";
import {
  templateNameAlreadyExistsSchema,
  type TemplateNameAlreadyExists,
} from "../template-name-already-exists.js";

export type Detail15 =
  | TemplateNameAlreadyExists
  | InvalidStringLength23
  | InvalidStringLength5
  | InvalidStringLength28
  | InvalidStringMaxLength56
  | InvalidParameterSyntax5;

export const detail15Schema: Schema<Detail15> = s.of<Detail15>(
  s.union([
    s.lazy(() => templateNameAlreadyExistsSchema),
    s.lazy(() => invalidStringLength23Schema),
    s.lazy(() => invalidStringLength5Schema),
    s.lazy(() => invalidStringLength28Schema),
    s.lazy(() => invalidStringMaxLength56Schema),
    s.lazy(() => invalidParameterSyntax5Schema),
  ]),
);
