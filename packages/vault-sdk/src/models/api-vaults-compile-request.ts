import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

export type ApiVaultsCompileRequest = {
  text: string;
};

export const apiVaultsCompileRequestSchema: Schema<ApiVaultsCompileRequest> =
  s.object<ApiVaultsCompileRequest>({
    text: s.string(),
  });
