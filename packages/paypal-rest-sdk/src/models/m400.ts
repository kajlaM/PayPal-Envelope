import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { detailSchema, type Detail } from "./unions/detail.js";

export type M400 = {
  details?: Detail[];
};

export const m400Schema: Schema<M400> = s.object<M400>({
  details: s.optional(s.array(s.lazy(() => detailSchema))),
});
