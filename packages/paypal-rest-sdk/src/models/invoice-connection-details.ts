import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { connections1Schema, type Connections1 } from "./connections1.js";

/** Returns invoice connection status with timestamp per invoice. */
export type InvoiceConnectionDetails = {
  /** The ID of the invoice. This property supports Unicode. */
  id?: string;
  /** An array of connection-level details. */
  connectionStatus?: Connections1[];
};

export const invoiceConnectionDetailsSchema: Schema<InvoiceConnectionDetails> =
  s.object<InvoiceConnectionDetails>({
    id: s.optional(s.string()),
    connectionStatus: s.optional(s.array(s.lazy(() => connections1Schema))),
    _keysMap: {
      connectionStatus: "connection_status",
    },
  });
