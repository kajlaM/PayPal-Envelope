import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { status1Schema, type Status1 } from "./status1.js";
import { pointSchema, type Point } from "./unions/point.js";

export type History = {
  status: Status1;
  mean: number;
  min: number;
  max: number;
  days: number;
  points?: Point[][];
};

export const historySchema: Schema<History> = s.object<History>({
  status: status1Schema,
  mean: s.float64(),
  min: s.float64(),
  max: s.float64(),
  days: s.int(),
  points: s.optional(s.array(s.array(s.lazy(() => pointSchema)))),
});
