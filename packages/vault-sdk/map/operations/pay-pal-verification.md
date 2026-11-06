<!-- Generated file — do not edit; regenerated with the SDK. -->

# PayPalVerification — operations

Accessor: `client.payPalVerification` · Source: `src/resources/pay-pal-verification.ts` · 1 operation · Request and error types: namespace `PayPalVerification`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `pay-pal-vault-api`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### verifyVault

- **Signature**: `verifyVault(request: PayPalVerification.VerifyVaultRequest, options?: RequestOptions): ApiPromise<VaultVerification, PayPalVerification.VerifyVaultError>`
- **Wire**: `POST /api/vaults/{id}/verify`
- **Auth**: none — public; no credential is sent
- **Request body**: none — no `Content-Type` header is sent
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `VaultVerification`
- **Error**: `PayPalVaultApiError` with `kind: "api"`, an instance of `PayPalVerification.VerifyVaultError` — **typed arms**, narrowed on `err.payload.kind`
- **Error arms**: `"error"` [400] `Error` · `"error2"` [404] `Error` · `"error3"` [409] `Error` · `"error4"` [429] `Error` · `"error5"` [502] `Error` · `"undeclared"` [any other] `rawBody: ArrayBuffer`

**Fields** — `PayPalVerification.VerifyVaultRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `id` | `path` | `string` | yes |

| Type | Schema value | Source |
| --- | --- | --- |
| `VaultVerification` | `vaultVerificationSchema` | `src/models/vault-verification.ts` |
| `Error` | `errorSchema` | `src/models/error.ts` |

