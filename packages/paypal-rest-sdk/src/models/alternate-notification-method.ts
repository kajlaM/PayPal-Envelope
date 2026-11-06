import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { phonePayoutsSchema, type PhonePayouts } from "./phone-payouts.js";

/** Captures additional notification modes to reach out to the receiver regarding this payment. */
export type AlternateNotificationMethod = {
  /**
   * The phone number in its canonical international [E.164 numbering plan
   * format](https://www.itu.int/rec/T-REC-E.164/en).
   */
  phone?: PhonePayouts;
};

export const alternateNotificationMethodSchema: Schema<AlternateNotificationMethod> =
  s.object<AlternateNotificationMethod>({
    phone: s.optional(s.lazy(() => phonePayoutsSchema)),
  });
