import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";
import { description110Schema, type Description110 } from "./description110.js";
import { issue133Schema, type Issue133 } from "./issue133.js";

export type AuthFlowRequired = {
  issue?: Issue133;
  description?: Description110;
};

export const authFlowRequiredSchema: Schema<AuthFlowRequired> = s.object<AuthFlowRequired>({
  issue: s.optional(s.lazy(() => issue133Schema)),
  description: s.optional(s.lazy(() => description110Schema)),
});
