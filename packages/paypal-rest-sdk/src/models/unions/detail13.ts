import * as s from "../../core/validation/index.js";
import type { Schema } from "../../core/validation/schema.js";
import {
  invalidParameterSyntax10Schema,
  type InvalidParameterSyntax10,
} from "../invalid-parameter-syntax10.js";
import { invalidStringLength12Schema, type InvalidStringLength12 } from "../invalid-string-length12.js";
import { invalidStringLength23Schema, type InvalidStringLength23 } from "../invalid-string-length23.js";
import { invalidStringLength5Schema, type InvalidStringLength5 } from "../invalid-string-length5.js";
import {
  invalidStringMaxLength56Schema,
  type InvalidStringMaxLength56,
} from "../invalid-string-max-length56.js";
import {
  templateNameAlreadyExistsSchema,
  type TemplateNameAlreadyExists,
} from "../template-name-already-exists.js";

export type Detail13 =
  | TemplateNameAlreadyExists
  | InvalidStringLength23
  | InvalidStringLength5
  | InvalidStringLength12
  | InvalidStringMaxLength56
  | InvalidParameterSyntax10;

export const detail13Schema: Schema<Detail13> = s.of<Detail13>(
  s.union([
    s.lazy(() => templateNameAlreadyExistsSchema),
    s.lazy(() => invalidStringLength23Schema),
    s.lazy(() => invalidStringLength5Schema),
    s.lazy(() => invalidStringLength12Schema),
    s.lazy(() => invalidStringMaxLength56Schema),
    s.lazy(() => invalidParameterSyntax10Schema),
  ]),
);
