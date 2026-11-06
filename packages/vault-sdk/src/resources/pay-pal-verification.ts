import { ApiError, type Declared, type Undeclared } from "../core/api-error.js";
import type { ApiPromise } from "../core/api-promise.js";
import type { RequestOptions } from "../core/api-request.js";
import { noneAuth } from "../core/auth/schemes.js";
import type { RawClient } from "../core/raw-client.js";
import type { ErrorDecoders } from "../core/response-decoder.js";
import { uuid } from "../core/uuid.js";
import * as s from "../core/validation/index.js";
import { errorSchema, type Error } from "../models/error.js";
import { vaultVerificationSchema, type VaultVerification } from "../models/vault-verification.js";
import type { Servers } from "../servers.js";

/**
 * Read-only check of every payment against PayPal's records
 */
export class PayPalVerification {
  readonly #rawClient: RawClient;
  readonly #servers: Servers;

  constructor(rawClient: RawClient, servers: Servers) {
    this.#rawClient = rawClient;
    this.#servers = servers;
  }

  /**
   * Check every payment of this vault against PayPal's own records
   *
   * @remarks
   * Read-only: PayPal is only asked, never paid, and the ledger's amounts and statuses are never
   * changed. Also runs every night.
   *
   * @returns OK
   *
   * @throws {@link PayPalVerification.VerifyVaultError} when the API answers with an error status —
   * narrow on `err.payload.kind`
   *
   * @throws {@link PayPalVaultApiError} when no usable response was produced: a connection failure,
   * a timeout, a body that would not decode, a value that would not encode, or a credential that
   * could not be obtained
   */
  verifyVault(
    request: PayPalVerification.VerifyVaultRequest,
    options?: RequestOptions,
  ): ApiPromise<VaultVerification, PayPalVerification.VerifyVaultError> {
    return this.#rawClient.execute(
      {
        method: "POST",
        urlTemplate: this.#servers.default("/api/vaults/{id}/verify"),
        auth: noneAuth,
        pathParams: [{ name: "id", value: request.id, schema: s.string() }],
        query: [],
        headers: [{ name: "Idempotency-Key", value: uuid(), schema: s.string() }],
        body: { kind: "empty" },
      },
      {
        success: { kind: "json", schema: vaultVerificationSchema },
        errorFactory: PayPalVerification.VerifyVaultError,
      },
      options,
    );
  }
}

export namespace PayPalVerification {
  export type VerifyVaultRequest = {
    /** Vault id */
    id: string;
  };

  export class VerifyVaultError extends ApiError {
    declare readonly payload:
      | Declared<"error", Error>
      | Declared<"error2", Error>
      | Declared<"error3", Error>
      | Declared<"error4", Error>
      | Declared<"error5", Error>
      | Undeclared;

    static readonly errors: ErrorDecoders<VerifyVaultError> = [
      { on: 400, kind: "error", decode: { kind: "json", schema: errorSchema } },
      { on: 404, kind: "error2", decode: { kind: "json", schema: errorSchema } },
      { on: 409, kind: "error3", decode: { kind: "json", schema: errorSchema } },
      { on: 429, kind: "error4", decode: { kind: "json", schema: errorSchema } },
      { on: 502, kind: "error5", decode: { kind: "json", schema: errorSchema } },
    ];
  }
}
