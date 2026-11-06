import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import {
  linkDescriptionWebhooksManagementSchema,
  type LinkDescriptionWebhooksManagement,
} from "./link-description-webhooks-management.js";
import { payoutBatchHeaderSchema, type PayoutBatchHeader } from "./payout-batch-header.js";
import { payoutItem1Schema, type PayoutItem1 } from "./payout-item1.js";

/** The PayPal-generated batch status. */
export type PayoutBatch = {
  /** The total number of items in the full result list. */
  totalItems?: number;
  /** The total number of pages. */
  totalPages?: number;
  /**
   * The payout header that is returned in response to a payout header request. Shows details for an
   * entire payout request.
   */
  batchHeader?: PayoutBatchHeader;
  /** An array of individual items. */
  items?: PayoutItem1[];
  /** An array of request-related [HATEOAS links](/api/rest/responses/#hateoas-links). */
  links?: LinkDescriptionWebhooksManagement[];
};

export const payoutBatchSchema: Schema<PayoutBatch> = s.object<PayoutBatch>({
  totalItems: s.optional(s.int()),
  totalPages: s.optional(s.int()),
  batchHeader: s.optional(s.lazy(() => payoutBatchHeaderSchema)),
  items: s.optional(s.array(s.lazy(() => payoutItem1Schema))),
  links: s.optional(s.array(s.lazy(() => linkDescriptionWebhooksManagementSchema))),
  _keysMap: {
    totalItems: "total_items",
    totalPages: "total_pages",
    batchHeader: "batch_header",
  },
});
