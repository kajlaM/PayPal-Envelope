import * as s from "../core/validation/index.js";
import type { Schema } from "../core/validation/schema.js";

/** Is the fetch type invoice number or id. */
export type FetchType = {
  /** Optional to decide the number or ID. @default false */
  fetchId?: boolean;
};

export const fetchTypeSchema: Schema<FetchType> = s.object<FetchType>({
  fetchId: s.defaulted(s.boolean(), false),
  _keysMap: {
    fetchId: "fetch_id",
  },
});
