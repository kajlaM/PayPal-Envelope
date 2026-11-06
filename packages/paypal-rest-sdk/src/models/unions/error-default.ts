import * as s from "../../core/validation/index.js";
import type { Schema } from "../../core/validation/schema.js";
import { badRequestErrorSchema, type BadRequestError } from "../bad-request-error.js";
import { internalServerErrorSchema, type InternalServerError } from "../internal-server-error.js";
import { notAuthorizedErrorSchema, type NotAuthorizedError } from "../not-authorized-error.js";
import { notFoundErrorSchema, type NotFoundError } from "../not-found-error.js";
import { resourceConflictErrorSchema, type ResourceConflictError } from "../resource-conflict-error.js";
import { serviceUnavailableErrorSchema, type ServiceUnavailableError } from "../service-unavailable-error.js";
import { unauthorizedErrorSchema, type UnauthorizedError } from "../unauthorized-error.js";
import {
  unprocessableEntityErrorSchema,
  type UnprocessableEntityError,
} from "../unprocessable-entity-error.js";
import {
  unsupportedMediaTypeErrorSchema,
  type UnsupportedMediaTypeError,
} from "../unsupported-media-type-error.js";

/** The default error response. */
export type ErrorDefault =
  | BadRequestError
  | UnauthorizedError
  | NotAuthorizedError
  | NotFoundError
  | ResourceConflictError
  | UnsupportedMediaTypeError
  | UnprocessableEntityError
  | InternalServerError
  | ServiceUnavailableError;

export const errorDefaultSchema: Schema<ErrorDefault> = s.of<ErrorDefault>(
  s.union([
    s.lazy(() => badRequestErrorSchema),
    s.lazy(() => unauthorizedErrorSchema),
    s.lazy(() => notAuthorizedErrorSchema),
    s.lazy(() => notFoundErrorSchema),
    s.lazy(() => resourceConflictErrorSchema),
    s.lazy(() => unsupportedMediaTypeErrorSchema),
    s.lazy(() => unprocessableEntityErrorSchema),
    s.lazy(() => internalServerErrorSchema),
    s.lazy(() => serviceUnavailableErrorSchema),
  ]),
);
