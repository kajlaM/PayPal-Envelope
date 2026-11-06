import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { connectionsSchema, type Connections } from "./connections.js";

/**
 * This object contains an array of connection details. It is used to load sync status for a user.
 */
export type Connections1 = {
  /** An array of connection-level details. */
  connections?: Connections[];
};

export const connections1Schema: Schema<Connections1> = s.object<Connections1>({
  connections: s.optional(s.array(s.lazy(() => connectionsSchema))),
});
