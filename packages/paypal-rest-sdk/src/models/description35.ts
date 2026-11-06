import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const Description35 = {
  DueDateIsInvalid: "Due date is invalid.",
} as const;
export type Description35 = (typeof Description35)[keyof typeof Description35] | (string & {});

export const description35Schema: EnumSchema<Description35> = s.enumOf<Description35>(Description35);
