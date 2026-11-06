import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description117 = {
  GlobalTemplatesCannotBeDeleted: "Global templates cannot be deleted.",
} as const;
export type Description117 = (typeof Description117)[keyof typeof Description117] | (string & {});

export const description117Schema: EnumSchema<Description117> = s.enumOf<Description117>(Description117);
