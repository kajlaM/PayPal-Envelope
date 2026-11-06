import * as s from "../../core/validation/index.js";
import type { Schema } from "../../core/validation/schema.js";
import { invalidArrayMaxItemsSchema, type InvalidArrayMaxItems } from "../invalid-array-max-items.js";
import {
  invalidStringMaxLength28Schema,
  type InvalidStringMaxLength28,
} from "../invalid-string-max-length28.js";

export type Detail9 = InvalidStringMaxLength28 | InvalidArrayMaxItems;

export const detail9Schema: Schema<Detail9> = s.of<Detail9>(
  s.union([s.lazy(() => invalidStringMaxLength28Schema), s.lazy(() => invalidArrayMaxItemsSchema)]),
);
