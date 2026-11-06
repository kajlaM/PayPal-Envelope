import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Issue81 = {
  CannotProcessRefunds: "CANNOT_PROCESS_REFUNDS",
} as const;
export type Issue81 = (typeof Issue81)[keyof typeof Issue81] | (string & {});

export const issue81Schema: EnumSchema<Issue81> = s.enumOf<Issue81>(Issue81);
