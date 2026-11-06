import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { nameSchema, type Name } from "./name.js";
import { phoneDetailSchema, type PhoneDetail } from "./phone-detail.js";
import {
  portablePostalAddressMediumGrainedSchema,
  type PortablePostalAddressMediumGrained,
} from "./portable-postal-address-medium-grained.js";

/** The invoicer business information that appears on the invoice. */
export type InvoicerInformation = {
  /** Required. The business name of the party. */
  businessName?: string;
  /** The name of the party. */
  name?: Name;
  /**
   * The portable international postal address. Maps to
   * [AddressValidationMetadata](https://github.com/googlei18n/libaddressinput/wiki/AddressValidationMetadata)
   * and HTML 5.1 [Autofilling form controls: the autocomplete
   * attribute](https://www.w3.org/TR/html51/sec-forms.html#autofilling-form-controls-the-autocomplete-attribute).
   */
  address?: PortablePostalAddressMediumGrained;
  /**
   * The internationalized email address with more restrictive rules. This version restricts the
   * local-part to a dot-atom as defined in https://www.ietf.org/rfc/rfc5322.txt. It does not allow
   * for a quoted-string or an obs-local-part. <ul><li>Allows alphanumeric and RFC-allowed special
   * characters, !#$%&'*+-/=?^_`{|}~</li><li>Ensures that the local part does not start with dot
   * (.), have consecutive dots, or end with dot. Ensures that the domain part does not have
   * consecutive dots.</li><li>Ensures that the local part does not exceed 64
   * characters.</li></ul><blockquote><strong>Note:</strong> Up to 64 characters are allowed before
   * and 255 characters are allowed after the <code>@</code> sign. However, the generally accepted
   * maximum length for an email address is 254 characters. The pattern verifies that an unquoted
   * <code>@</code> sign exists.</blockquote>
   */
  emailAddress?: string;
  /**
   * An array of invoicer's phone numbers. The invoicer can choose to hide the phone number on the
   * invoice.
   */
  phones?: PhoneDetail[];
  /** The invoicer's website. */
  website?: string;
  /** The invoicer's tax ID. */
  taxId?: string;
  /** Any additional information. Includes business hours. */
  additionalNotes?: string;
  /**
   * The full URL to an external logo image. The logo image must not be larger than 250 pixels wide
   * by 90 pixels high.
   */
  logoUrl?: string;
};

export const invoicerInformationSchema: Schema<InvoicerInformation> = s.object<InvoicerInformation>({
  businessName: s.optional(s.string()),
  name: s.optional(s.lazy(() => nameSchema)),
  address: s.optional(s.lazy(() => portablePostalAddressMediumGrainedSchema)),
  emailAddress: s.optional(s.string()),
  phones: s.optional(s.array(s.lazy(() => phoneDetailSchema))),
  website: s.optional(s.string()),
  taxId: s.optional(s.string()),
  additionalNotes: s.optional(s.string()),
  logoUrl: s.optional(s.string()),
  _keysMap: {
    businessName: "business_name",
    emailAddress: "email_address",
    taxId: "tax_id",
    additionalNotes: "additional_notes",
    logoUrl: "logo_url",
  },
});
