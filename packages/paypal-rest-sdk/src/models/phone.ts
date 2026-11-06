import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

/**
 * The phone number, in its canonical international [E.164 numbering plan
 * format](https://www.itu.int/rec/T-REC-E.164/en).
 */
export type Phone = {
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
};

export const phoneSchema: Schema<Phone> = s.object<Phone>({
  countryCode: s.optional(s.string()),
  nationalNumber: s.optional(s.string()),
  extensionNumber: s.optional(s.string()),
  _keysMap: {
    countryCode: "country_code",
    nationalNumber: "national_number",
    extensionNumber: "extension_number",
  },
});
