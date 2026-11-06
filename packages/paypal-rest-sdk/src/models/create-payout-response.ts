import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import {
  linkDescriptionWebhooksManagementSchema,
  type LinkDescriptionWebhooksManagement,
} from "./link-description-webhooks-management.js";
import { payoutHeaderSchema, type PayoutHeader } from "./payout-header.js";

/** The create payout response. */
export type CreatePayoutResponse = {
  /**
   * The payout header that is returned in response to a payout header request. Shows details for an
   * entire payout request.
   */
  batchHeader?: PayoutHeader;
  /** An array of request-related [HATEOAS links](/api/rest/responses/#hateoas-links). */
  links?: LinkDescriptionWebhooksManagement[];
};

export const createPayoutResponseSchema: Schema<CreatePayoutResponse> = s.object<CreatePayoutResponse>({
  batchHeader: s.optional(s.lazy(() => payoutHeaderSchema)),
  links: s.optional(s.array(s.lazy(() => linkDescriptionWebhooksManagementSchema))),
  _keysMap: {
    batchHeader: "batch_header",
  },
});
