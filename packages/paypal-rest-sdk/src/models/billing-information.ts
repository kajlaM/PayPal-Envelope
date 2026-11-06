import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { nameSchema, type Name } from "./name.js";
import { phoneDetailSchema, type PhoneDetail } from "./phone-detail.js";
import {
  portablePostalAddressMediumGrainedSchema,
  type PortablePostalAddressMediumGrained,
} from "./portable-postal-address-medium-grained.js";

/**
 * The billing information of the invoice recipient. Includes name, address, email, phone, and
 * language.
 */
export type BillingInformation = {
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
  /** The invoice recipient's phone numbers. Extension number is not supported. */
  phones?: PhoneDetail[];
  /** Any additional information about the recipient. */
  additionalInfo?: string;
  /**
   * The [language tag](https://tools.ietf.org/html/bcp47#section-2) for the language in which to
   * localize the error-related strings, such as messages, issues, and suggested actions. The tag is
   * made up of the [ISO 639-2 language
   * code](https://www.loc.gov/standards/iso639-2/php/code_list.php), the optional [ISO-15924 script
   * tag](https://www.unicode.org/iso15924/codelists.html), and the [ISO-3166 alpha-2 country
   * code](/api/rest/reference/country-codes/) or [M49 region
   * code](https://unstats.un.org/unsd/methodology/m49/).
   */
  language?: string;
};

export const billingInformationSchema: Schema<BillingInformation> = s.object<BillingInformation>({
  businessName: s.optional(s.string()),
  name: s.optional(s.lazy(() => nameSchema)),
  address: s.optional(s.lazy(() => portablePostalAddressMediumGrainedSchema)),
  emailAddress: s.optional(s.string()),
  phones: s.optional(s.array(s.lazy(() => phoneDetailSchema))),
  additionalInfo: s.optional(s.string()),
  language: s.optional(s.string()),
  _keysMap: {
    businessName: "business_name",
    emailAddress: "email_address",
    additionalInfo: "additional_info",
  },
});
