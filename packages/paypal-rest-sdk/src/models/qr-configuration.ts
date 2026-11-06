import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

/** The configuration for a QR code. */
export type QrConfiguration = {
  /** The width, in pixels, of the QR code image. Value is from `150` to `500`. @default 500 */
  width?: number;
  /** The height, in pixels, of the QR code image. Value is from `150` to `500`. @default 500 */
  height?: number;
  /**
   * The type of URL for which to generate a QR code. Valid values are `pay` and `details`.
   *
   * @default "pay"
   */
  action?: string;
};

export const qrConfigurationSchema: Schema<QrConfiguration> = s.object<QrConfiguration>({
  width: s.defaulted(s.int(), 500),
  height: s.defaulted(s.int(), 500),
  action: s.defaulted(s.string(), "pay"),
});
