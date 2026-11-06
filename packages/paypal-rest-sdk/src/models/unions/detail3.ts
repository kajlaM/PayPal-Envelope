import * as s from "../../core/validation/index.js";
import type { Schema } from "../../core/validation/schema.js";
import { invalidParameterSyntaxSchema, type InvalidParameterSyntax } from "../invalid-parameter-syntax.js";
import { invalidParameterSyntax1Schema, type InvalidParameterSyntax1 } from "../invalid-parameter-syntax1.js";
import { invalidParameterSyntax2Schema, type InvalidParameterSyntax2 } from "../invalid-parameter-syntax2.js";
import { invalidParameterSyntax3Schema, type InvalidParameterSyntax3 } from "../invalid-parameter-syntax3.js";
import { invalidParameterSyntax4Schema, type InvalidParameterSyntax4 } from "../invalid-parameter-syntax4.js";
import { invalidStringLengthSchema, type InvalidStringLength } from "../invalid-string-length.js";
import { invalidStringLength1Schema, type InvalidStringLength1 } from "../invalid-string-length1.js";
import { invalidStringLength2Schema, type InvalidStringLength2 } from "../invalid-string-length2.js";
import { invalidStringLength3Schema, type InvalidStringLength3 } from "../invalid-string-length3.js";
import { invalidStringLength4Schema, type InvalidStringLength4 } from "../invalid-string-length4.js";
import { invalidStringLength5Schema, type InvalidStringLength5 } from "../invalid-string-length5.js";
import { invalidStringLength6Schema, type InvalidStringLength6 } from "../invalid-string-length6.js";
import { invalidStringLength7Schema, type InvalidStringLength7 } from "../invalid-string-length7.js";
import { invalidStringLength8Schema, type InvalidStringLength8 } from "../invalid-string-length8.js";
import { invalidStringLength9Schema, type InvalidStringLength9 } from "../invalid-string-length9.js";
import { invalidStringMaxLengthSchema, type InvalidStringMaxLength } from "../invalid-string-max-length.js";
import {
  invalidStringMaxLength1Schema,
  type InvalidStringMaxLength1,
} from "../invalid-string-max-length1.js";
import {
  invalidStringMaxLength10Schema,
  type InvalidStringMaxLength10,
} from "../invalid-string-max-length10.js";
import {
  invalidStringMaxLength11Schema,
  type InvalidStringMaxLength11,
} from "../invalid-string-max-length11.js";
import {
  invalidStringMaxLength12Schema,
  type InvalidStringMaxLength12,
} from "../invalid-string-max-length12.js";
import {
  invalidStringMaxLength13Schema,
  type InvalidStringMaxLength13,
} from "../invalid-string-max-length13.js";
import {
  invalidStringMaxLength14Schema,
  type InvalidStringMaxLength14,
} from "../invalid-string-max-length14.js";
import {
  invalidStringMaxLength15Schema,
  type InvalidStringMaxLength15,
} from "../invalid-string-max-length15.js";
import {
  invalidStringMaxLength16Schema,
  type InvalidStringMaxLength16,
} from "../invalid-string-max-length16.js";
import {
  invalidStringMaxLength17Schema,
  type InvalidStringMaxLength17,
} from "../invalid-string-max-length17.js";
import {
  invalidStringMaxLength18Schema,
  type InvalidStringMaxLength18,
} from "../invalid-string-max-length18.js";
import {
  invalidStringMaxLength2Schema,
  type InvalidStringMaxLength2,
} from "../invalid-string-max-length2.js";
import {
  invalidStringMaxLength20Schema,
  type InvalidStringMaxLength20,
} from "../invalid-string-max-length20.js";
import {
  invalidStringMaxLength22Schema,
  type InvalidStringMaxLength22,
} from "../invalid-string-max-length22.js";
import {
  invalidStringMaxLength23Schema,
  type InvalidStringMaxLength23,
} from "../invalid-string-max-length23.js";
import {
  invalidStringMaxLength24Schema,
  type InvalidStringMaxLength24,
} from "../invalid-string-max-length24.js";
import {
  invalidStringMaxLength25Schema,
  type InvalidStringMaxLength25,
} from "../invalid-string-max-length25.js";
import {
  invalidStringMaxLength3Schema,
  type InvalidStringMaxLength3,
} from "../invalid-string-max-length3.js";
import {
  invalidStringMaxLength4Schema,
  type InvalidStringMaxLength4,
} from "../invalid-string-max-length4.js";
import {
  invalidStringMaxLength5Schema,
  type InvalidStringMaxLength5,
} from "../invalid-string-max-length5.js";
import {
  invalidStringMaxLength6Schema,
  type InvalidStringMaxLength6,
} from "../invalid-string-max-length6.js";
import {
  invalidStringMaxLength7Schema,
  type InvalidStringMaxLength7,
} from "../invalid-string-max-length7.js";
import {
  invalidStringMaxLength8Schema,
  type InvalidStringMaxLength8,
} from "../invalid-string-max-length8.js";
import {
  invalidStringMaxLength9Schema,
  type InvalidStringMaxLength9,
} from "../invalid-string-max-length9.js";

export type Detail3 =
  | InvalidStringMaxLength1
  | InvalidStringLength
  | InvalidStringMaxLength2
  | InvalidParameterSyntax
  | InvalidStringMaxLength3
  | InvalidStringMaxLength4
  | InvalidStringLength1
  | InvalidStringMaxLength5
  | InvalidStringLength2
  | InvalidStringMaxLength6
  | InvalidStringLength3
  | InvalidStringLength4
  | InvalidStringLength5
  | InvalidStringMaxLength7
  | InvalidStringMaxLength8
  | InvalidStringLength6
  | InvalidStringMaxLength9
  | InvalidStringMaxLength10
  | InvalidStringMaxLength11
  | InvalidStringMaxLength12
  | InvalidParameterSyntax1
  | InvalidStringMaxLength13
  | InvalidStringMaxLength14
  | InvalidStringLength7
  | InvalidStringMaxLength15
  | InvalidStringMaxLength16
  | InvalidStringMaxLength17
  | InvalidStringMaxLength18
  | InvalidParameterSyntax2
  | InvalidStringMaxLength
  | InvalidStringLength8
  | InvalidStringMaxLength20
  | InvalidStringMaxLength22
  | InvalidParameterSyntax3
  | InvalidStringLength9
  | InvalidStringMaxLength23
  | InvalidParameterSyntax4
  | InvalidStringMaxLength24
  | InvalidStringMaxLength25;

export const detail3Schema: Schema<Detail3> = s.of<Detail3>(
  s.union([
    s.lazy(() => invalidStringMaxLength1Schema),
    s.lazy(() => invalidStringLengthSchema),
    s.lazy(() => invalidStringMaxLength2Schema),
    s.lazy(() => invalidParameterSyntaxSchema),
    s.lazy(() => invalidStringMaxLength3Schema),
    s.lazy(() => invalidStringMaxLength4Schema),
    s.lazy(() => invalidStringLength1Schema),
    s.lazy(() => invalidStringMaxLength5Schema),
    s.lazy(() => invalidStringLength2Schema),
    s.lazy(() => invalidStringMaxLength6Schema),
    s.lazy(() => invalidStringLength3Schema),
    s.lazy(() => invalidStringLength4Schema),
    s.lazy(() => invalidStringLength5Schema),
    s.lazy(() => invalidStringMaxLength7Schema),
    s.lazy(() => invalidStringMaxLength8Schema),
    s.lazy(() => invalidStringLength6Schema),
    s.lazy(() => invalidStringMaxLength9Schema),
    s.lazy(() => invalidStringMaxLength10Schema),
    s.lazy(() => invalidStringMaxLength11Schema),
    s.lazy(() => invalidStringMaxLength12Schema),
    s.lazy(() => invalidParameterSyntax1Schema),
    s.lazy(() => invalidStringMaxLength13Schema),
    s.lazy(() => invalidStringMaxLength14Schema),
    s.lazy(() => invalidStringLength7Schema),
    s.lazy(() => invalidStringMaxLength15Schema),
    s.lazy(() => invalidStringMaxLength16Schema),
    s.lazy(() => invalidStringMaxLength17Schema),
    s.lazy(() => invalidStringMaxLength18Schema),
    s.lazy(() => invalidParameterSyntax2Schema),
    s.lazy(() => invalidStringMaxLengthSchema),
    s.lazy(() => invalidStringLength8Schema),
    s.lazy(() => invalidStringMaxLength20Schema),
    s.lazy(() => invalidStringMaxLength22Schema),
    s.lazy(() => invalidParameterSyntax3Schema),
    s.lazy(() => invalidStringLength9Schema),
    s.lazy(() => invalidStringMaxLength23Schema),
    s.lazy(() => invalidParameterSyntax4Schema),
    s.lazy(() => invalidStringMaxLength24Schema),
    s.lazy(() => invalidStringMaxLength25Schema),
  ]),
);
