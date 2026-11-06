import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { phoneTypeSchema, type PhoneType } from "./phone-type.js";

/** The phone details. Includes the phone number and type. */
export type PhoneDetail = {
  /**
   * The country calling code (CC), in its canonical international [E.164 numbering plan
   * format](https://www.itu.int/rec/T-REC-E.164/en). The combined length of the CC and the national
   * number must not be greater than 15 digits. The national number consists of a national
   * destination code (NDC) and subscriber number (SN).
   */
  countryCode?: string;
  /**
   * The national number, in its canonical international [E.164 numbering plan
   * format](https://www.itu.int/rec/T-REC-E.164/en). The combined length of the country calling
   * code (CC) and the national number must not be greater than 15 digits. The national number
   * consists of a national destination code (NDC) and subscriber number (SN).
   */
  nationalNumber?: string;
  /** The extension number. */
  extensionNumber?: string;
  /** The phone type. */
  phoneType: PhoneType;
};

export const phoneDetailSchema: Schema<PhoneDetail> = s.object<PhoneDetail>({
  countryCode: s.optional(s.string()),
  nationalNumber: s.optional(s.string()),
  extensionNumber: s.optional(s.string()),
  phoneType: phoneTypeSchema,
  _keysMap: {
    countryCode: "country_code",
    nationalNumber: "national_number",
    extensionNumber: "extension_number",
    phoneType: "phone_type",
  },
});
