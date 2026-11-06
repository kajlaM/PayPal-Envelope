import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { requestJsonSchema, type RequestJson } from "./request-json.js";
import { resultSchema, type Result } from "./result.js";

export type Decision = {
  id?: string;
  vaultId?: string;
  requestJson?: RequestJson;
  result?: Result;
  reasons?: string[];
  resolvedBy?: string | null;
  createdAt?: Date;
};

export const decisionSchema: Schema<Decision> = s.object<Decision>({
  id: s.optional(s.string()),
  vaultId: s.optional(s.string()),
  requestJson: s.optional(s.lazy(() => requestJsonSchema)),
  result: s.optional(s.lazy(() => resultSchema)),
  reasons: s.optional(s.array(s.string())),
  resolvedBy: s.optionalNullable(s.string()),
  createdAt: s.optional(s.dateTime()),
});
