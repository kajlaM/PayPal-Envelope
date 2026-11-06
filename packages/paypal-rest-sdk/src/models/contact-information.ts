import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { nameSchema, type Name } from "./name.js";
import {
  portablePostalAddressMediumGrainedSchema,
  type PortablePostalAddressMediumGrained,
} from "./portable-postal-address-medium-grained.js";

/** The contact information of the user. Includes name and address. */
export type ContactInformation = {
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
};

export const contactInformationSchema: Schema<ContactInformation> = s.object<ContactInformation>({
  businessName: s.optional(s.string()),
  name: s.optional(s.lazy(() => nameSchema)),
  address: s.optional(s.lazy(() => portablePostalAddressMediumGrainedSchema)),
  _keysMap: {
    businessName: "business_name",
  },
});
