import * as s from "../../core/validation/index.js";
import type { Schema } from "../../core/validation/schema.js";

export type Point = string | number;

export const pointSchema: Schema<Point> = s.of<Point>(s.union([s.string(), s.float64()]));
