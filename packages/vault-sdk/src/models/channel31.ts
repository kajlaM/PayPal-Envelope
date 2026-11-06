import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type Channel31 = {
  storesCents?: number;
  averageCents?: number;
  purchases?: number;
};

export const channel31Schema: Schema<Channel31> = s.object<Channel31>({
  storesCents: s.optional(s.int()),
  averageCents: s.optional(s.int()),
  purchases: s.optional(s.int()),
});
