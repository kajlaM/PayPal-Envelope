import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { detail4Schema, type Detail4 } from "./unions/detail4.js";

export type InvoicesGenerateQrCode400 = {
  details?: Detail4[];
};

export const invoicesGenerateQrCode400Schema: Schema<InvoicesGenerateQrCode400> =
  s.object<InvoicesGenerateQrCode400>({
    details: s.optional(s.array(s.lazy(() => detail4Schema))),
  });
