import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

/**
 * The frequency at which the invoice is sent:<ul><li>Multiple recipient. Sent to multiple
 * recipients.</li><li>Batch. Sent in a batch.</li><li>Regular single. Sent one time to a single
 * recipient.</li></ul>
 */
export const InvoiceCreationFlow = {
  MultipleRecipientsGroup: "MULTIPLE_RECIPIENTS_GROUP",
  Batch: "BATCH",
  RegularSingle: "REGULAR_SINGLE",
} as const;
export type InvoiceCreationFlow =
  | (typeof InvoiceCreationFlow)[keyof typeof InvoiceCreationFlow]
  | (string & {});

export const invoiceCreationFlowSchema: EnumSchema<InvoiceCreationFlow> =
  s.enumOf<InvoiceCreationFlow>(InvoiceCreationFlow);
