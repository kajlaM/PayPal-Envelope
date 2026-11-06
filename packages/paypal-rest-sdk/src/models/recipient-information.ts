import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { billingInformationSchema, type BillingInformation } from "./billing-information.js";
import { contactInformationSchema, type ContactInformation } from "./contact-information.js";

/** The billing and shipping information. Includes name, email, address, phone, and language. */
export type RecipientInformation = {
  /**
   * The billing information of the invoice recipient. Includes name, address, email, phone, and
   * language.
   */
  billingInfo?: BillingInformation;
  /** The contact information of the user. Includes name and address. */
  shippingInfo?: ContactInformation;
};

export const recipientInformationSchema: Schema<RecipientInformation> = s.object<RecipientInformation>({
  billingInfo: s.optional(s.lazy(() => billingInformationSchema)),
  shippingInfo: s.optional(s.lazy(() => contactInformationSchema)),
  _keysMap: {
    billingInfo: "billing_info",
    shippingInfo: "shipping_info",
  },
});
