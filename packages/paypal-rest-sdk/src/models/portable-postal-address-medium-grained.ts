import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { addressDetailsSchema, type AddressDetails } from "./address-details.js";

/**
 * The portable international postal address. Maps to
 * [AddressValidationMetadata](https://github.com/googlei18n/libaddressinput/wiki/AddressValidationMetadata)
 * and HTML 5.1 [Autofilling form controls: the autocomplete
 * attribute](https://www.w3.org/TR/html51/sec-forms.html#autofilling-form-controls-the-autocomplete-attribute).
 */
export type PortablePostalAddressMediumGrained = {
  /**
   * The first line of the address. For example, number or street. For example, `173 Drury Lane`.
   * Required for data entry and compliance and risk checks. Must contain the full address.
   */
  addressLine1?: string;
  /** The second line of the address. For example, suite or apartment number. */
  addressLine2?: string;
  /**
   * The third line of the address, if needed. For example, a street complement for Brazil,
   * direction text, such as `next to Walmart`, or a landmark in an Indian address.
   */
  addressLine3?: string;
  /**
   * The neighborhood, ward, or district. Smaller than `admin_area_level_3` or `sub_locality`. Value
   * is:<ul><li>The postal sorting code for Guernsey and many French territories, such as French
   * Guiana.</li><li>The fine-grained administrative levels in China.</li></ul>
   */
  adminArea4?: string;
  /**
   * A sub-locality, suburb, neighborhood, or district. Smaller than `admin_area_level_2`. Value
   * is:<ul><li>Brazil. Suburb, bairro, or neighborhood.</li><li>India. Sub-locality or district.
   * Street name information is not always available but a sub-locality or district can be a very
   * small area.</li></ul>
   */
  adminArea3?: string;
  /** A city, town, or village. Smaller than `admin_area_level_1`. */
  adminArea2?: string;
  /**
   * The highest level sub-division in a country, which is usually a province, state, or ISO-3166-2
   * subdivision. Format for postal delivery. For example, `CA` and not `California`. Value, by
   * country, is:<ul><li>UK. A county.</li><li>US. A state.</li><li>Canada. A
   * province.</li><li>Japan. A prefecture.</li><li>Switzerland. A kanton.</li></ul>
   */
  adminArea1?: string;
  /**
   * The postal code, which is the zip code or equivalent. Typically required for countries with a
   * postal code or an equivalent. See [postal code](https://en.wikipedia.org/wiki/Postal_code).
   */
  postalCode?: string;
  /**
   * The [two-character ISO 3166-1 code](/api/rest/reference/country-codes/) that identifies the
   * country or region.<blockquote><strong>Note:</strong> The country code for Great Britain is
   * <code>GB</code> and not <code>UK</code> as used in the top-level domain names for that country.
   * Use the `C2` country code for China worldwide for comparable uncontrolled price (CUP) method,
   * bank card, and cross-border transactions.</blockquote>
   */
  countryCode?: string;
  /**
   * The non-portable additional address details that are sometimes needed for compliance, risk, or
   * other scenarios where fine-grain address information might be needed. Not portable with common
   * third party and open source. Redundant with core fields.<br/>For example,
   * `address_portable.address_line_1` is usually a combination of `address_details.street_number`,
   * `street_name`, and `street_type`.
   */
  addressDetails?: AddressDetails;
};

export const portablePostalAddressMediumGrainedSchema: Schema<PortablePostalAddressMediumGrained> =
  s.object<PortablePostalAddressMediumGrained>({
    addressLine1: s.optional(s.string()),
    addressLine2: s.optional(s.string()),
    addressLine3: s.optional(s.string()),
    adminArea4: s.optional(s.string()),
    adminArea3: s.optional(s.string()),
    adminArea2: s.optional(s.string()),
    adminArea1: s.optional(s.string()),
    postalCode: s.optional(s.string()),
    countryCode: s.optional(s.string()),
    addressDetails: s.optional(s.lazy(() => addressDetailsSchema)),
    _keysMap: {
      addressLine1: "address_line_1",
      addressLine2: "address_line_2",
      addressLine3: "address_line_3",
      adminArea4: "admin_area_4",
      adminArea3: "admin_area_3",
      adminArea2: "admin_area_2",
      adminArea1: "admin_area_1",
      postalCode: "postal_code",
      countryCode: "country_code",
      addressDetails: "address_details",
    },
  });
