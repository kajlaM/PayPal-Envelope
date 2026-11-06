import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { linkDescription1Schema, type LinkDescription1 } from "./link-description1.js";
import { phoneDetailSchema, type PhoneDetail } from "./phone-detail.js";
import {
  portablePostalAddressMediumGrainedSchema,
  type PortablePostalAddressMediumGrained,
} from "./portable-postal-address-medium-grained.js";
import { templateSchema, type Template } from "./template.js";

/**
 * An array of merchant-created templates with associated details that include the emails,
 * addresses, and phone numbers from the user's PayPal profile.
 */
export type Templates = {
  /** An array of addresses in the user's PayPal profile. */
  addresses?: PortablePostalAddressMediumGrained[];
  /**
   * The internationalized email address.<blockquote><strong>Note:</strong> Up to 64 characters are
   * allowed before and 255 characters are allowed after the <code>@</code> sign. However, the
   * generally accepted maximum length for an email address is 254 characters. The pattern verifies
   * that an unquoted <code>@</code> sign exists.</blockquote>
   */
  emails?: string;
  /** An array of phone numbers in the user's PayPal profile. */
  phones?: PhoneDetail[];
  /**
   * An array of details for each template. If `fields` is `none`, returns only the template name,
   * ID, and default status.
   */
  templates?: Template[];
  /**
   * An array of request-related [HATEOAS links](/docs/api/reference/api-responses/#hateoas-links).
   */
  links?: LinkDescription1[];
};

export const templatesSchema: Schema<Templates> = s.object<Templates>({
  addresses: s.optional(s.array(s.lazy(() => portablePostalAddressMediumGrainedSchema))),
  emails: s.optional(s.string()),
  phones: s.optional(s.array(s.lazy(() => phoneDetailSchema))),
  templates: s.optional(s.array(s.lazy(() => templateSchema))),
  links: s.optional(s.array(s.lazy(() => linkDescription1Schema))),
});
