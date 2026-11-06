import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type Weights = {
  /** @default 5 */
  price?: number;
  /** @default 0 */
  rating?: number;
  /** @default 0 */
  delivery?: number;
  /** @default 0 */
  modelMatch?: number;
};

export const weightsSchema: Schema<Weights> = s.object<Weights>({
  price: s.defaulted(s.float64(), 5),
  rating: s.defaulted(s.float64(), 0),
  delivery: s.defaulted(s.float64(), 0),
  modelMatch: s.defaulted(s.float64(), 0),
  _keysMap: {
    modelMatch: "model_match",
  },
});
