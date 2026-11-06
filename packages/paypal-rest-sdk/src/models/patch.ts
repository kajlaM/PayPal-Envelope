import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { opSchema, type Op } from "./op.js";

/** The JSON patch object to apply partial updates to resources. */
export type Patch = {
  /** The operation. */
  op?: Op;
  /**
   * The <a href="https://tools.ietf.org/html/rfc6901">JSON Pointer</a> to the target document
   * location at which to complete the operation.
   */
  path?: string;
  /** The value to apply. The <code>remove</code> operation does not require a value. */
  value?: Record<string, unknown>;
  /**
   * The <a href="https://tools.ietf.org/html/rfc6901">JSON Pointer</a> to the target document
   * location from which to move the value. Required for the <code>move</code> operation.
   */
  from?: string;
};

export const patchSchema: Schema<Patch> = s.object<Patch>({
  op: s.optional(s.lazy(() => opSchema)),
  path: s.optional(s.string()),
  value: s.optional(s.record(s.string(), s.unknown())),
  from: s.optional(s.string()),
});
