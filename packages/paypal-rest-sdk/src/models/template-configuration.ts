import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { partialPaymentSchema, type PartialPayment } from "./partial-payment.js";

/** The template configuration details. Includes tax information, tip, and partial payment. */
export type TemplateConfiguration = {
  /**
   * Indicates whether the tax is calculated before or after a discount. If `false`, the tax is
   * calculated before a discount. If `true`, the tax is calculated after a discount.
   *
   * @default true
   */
  taxCalculatedAfterDiscount?: boolean;
  /** Indicates whether the unit price includes tax. @default false */
  taxInclusive?: boolean;
  /**
   * Indicates whether the invoice enables the customer to enter a tip amount during payment. If
   * `true`, the invoice shows a tip amount field so that the customer can enter a tip amount. If
   * `false`, the invoice does not show a tip amount field.<blockquote><strong>Note:</strong> This
   * feature is not available for users in `Hong Kong`, `Taiwan`, `India`, or `Japan`.</blockquote>
   *
   * @default false
   */
  allowTip?: boolean;
  /**
   * The partial payment details. Includes the minimum amount that the invoicer expects from the
   * payer.
   */
  partialPayment?: PartialPayment;
  /**
   * Indicates whether conditional pricing rules are applied to the invoice. If `true`, pricing
   * rules (such as discounts or surcharges based on specific conditions) are applied. If `false`,
   * no conditional pricing rules are applied.
   *
   * @default false
   */
  hasConditionalRule?: boolean;
};

export const templateConfigurationSchema: Schema<TemplateConfiguration> = s.object<TemplateConfiguration>({
  taxCalculatedAfterDiscount: s.defaulted(s.boolean(), true),
  taxInclusive: s.defaulted(s.boolean(), false),
  allowTip: s.defaulted(s.boolean(), false),
  partialPayment: s.optional(s.lazy(() => partialPaymentSchema)),
  hasConditionalRule: s.defaulted(s.boolean(), false),
  _keysMap: {
    taxCalculatedAfterDiscount: "tax_calculated_after_discount",
    taxInclusive: "tax_inclusive",
    allowTip: "allow_tip",
    partialPayment: "partial_payment",
    hasConditionalRule: "has_conditional_rule",
  },
});
