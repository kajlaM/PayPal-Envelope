import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type Liquidation = {
  /** @default true */
  autoRefund?: boolean;
};

export const liquidationSchema: Schema<Liquidation> = s.object<Liquidation>({
  autoRefund: s.defaulted(s.boolean(), true),
  _keysMap: {
    autoRefund: "auto_refund",
  },
});
