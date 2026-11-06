import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { partialPaymentSchema, type PartialPayment } from "./partial-payment.js";

/**
 * The invoice configuration details. Includes partial payment, tip, and tax calculated after
 * discount.
 */
export type Configuration = {
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
  /**
   * The template ID. The template determines the layout of the invoice. Includes which fields to
   * show and hide.<blockquote><strong>Note:</strong> This is an optional field. If you wish to
   * customize the invoice layout using a specific template, provide a valid template ID here. You
   * can either use an existing template ID or create a new template via the create template API and
   * then use the newly created template's ID.</blockquote>
   *
   * @default "PayPal system template"
   */
  templateId?: string;
};

export const configurationSchema: Schema<Configuration> = s.object<Configuration>({
  taxCalculatedAfterDiscount: s.defaulted(s.boolean(), true),
  taxInclusive: s.defaulted(s.boolean(), false),
  allowTip: s.defaulted(s.boolean(), false),
  partialPayment: s.optional(s.lazy(() => partialPaymentSchema)),
  hasConditionalRule: s.defaulted(s.boolean(), false),
  templateId: s.defaulted(s.string(), "PayPal system template"),
  _keysMap: {
    taxCalculatedAfterDiscount: "tax_calculated_after_discount",
    taxInclusive: "tax_inclusive",
    allowTip: "allow_tip",
    partialPayment: "partial_payment",
    hasConditionalRule: "has_conditional_rule",
    templateId: "template_id",
  },
});
