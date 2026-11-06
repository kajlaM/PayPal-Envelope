import * as s from "../../core/validation/index.js";
import type { Schema } from "../../core/validation/schema.js";
import { invalidArrayMaxItemsSchema, type InvalidArrayMaxItems } from "../invalid-array-max-items.js";
import { invalidStringMaxLengthSchema, type InvalidStringMaxLength } from "../invalid-string-max-length.js";

export type Detail1 = InvalidStringMaxLength | InvalidArrayMaxItems;

export const detail1Schema: Schema<Detail1> = s.of<Detail1>(
  s.union([s.lazy(() => invalidStringMaxLengthSchema), s.lazy(() => invalidArrayMaxItemsSchema)]),
);
