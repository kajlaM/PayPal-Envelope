import * as s from "../core/validation/index.js";
import type { EnumSchema } from "../core/validation/schema.js";

export const ControlMode = {
  AskMe: "ASK_ME",
  AskAbove: "ASK_ABOVE",
  Autopilot: "AUTOPILOT",
} as const;
export type ControlMode = (typeof ControlMode)[keyof typeof ControlMode] | (string & {});

export const controlModeSchema: EnumSchema<ControlMode> = s.enumOf<ControlMode>(ControlMode);
