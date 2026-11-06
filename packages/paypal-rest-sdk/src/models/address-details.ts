import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

/**
 * The non-portable additional address details that are sometimes needed for compliance, risk, or
 * other scenarios where fine-grain address information might be needed. Not portable with common
 * third party and open source. Redundant with core fields.<br/>For example,
 * `address_portable.address_line_1` is usually a combination of `address_details.street_number`,
 * `street_name`, and `street_type`.
 */
export type AddressDetails = {
  /** The street number. */
  streetNumber?: string;
  /** The street name. Just `Drury` in `Drury Lane`. */
  streetName?: string;
  /** The street type. For example, avenue, boulevard, road, or expressway. */
  streetType?: string;
  /** The delivery service. Post office box, bag number, or post office name. */
  deliveryService?: string;
  /**
   * A named locations that represents the premise. Usually a building name or number or collection
   * of buildings with a common name or number. For example, <code>Craven House</code>.
   */
  buildingName?: string;
  /**
   * The first-order entity below a named building or location that represents the sub-premises.
   * Usually a single building within a collection of buildings with a common name. Can be a flat,
   * story, floor, room, or apartment.
   */
  subBuilding?: string;
};

export const addressDetailsSchema: Schema<AddressDetails> = s.object<AddressDetails>({
  streetNumber: s.optional(s.string()),
  streetName: s.optional(s.string()),
  streetType: s.optional(s.string()),
  deliveryService: s.optional(s.string()),
  buildingName: s.optional(s.string()),
  subBuilding: s.optional(s.string()),
  _keysMap: {
    streetNumber: "street_number",
    streetName: "street_name",
    streetType: "street_type",
    deliveryService: "delivery_service",
    buildingName: "building_name",
    subBuilding: "sub_building",
  },
});
