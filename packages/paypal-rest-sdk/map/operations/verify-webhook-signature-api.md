<!-- Generated file — do not edit; regenerated with the SDK. -->

# VerifyWebhookSignatureApi — operations

Accessor: `client.verifyWebhookSignatureApi` · Source: `src/resources/verify-webhook-signature-api.ts` · 1 operation · Request types: namespace `VerifyWebhookSignatureApi`

**Type sources**: every type an operation names, with the file that declares it and the schema value exported beside it. Import every name from `invoices`; the `Source` path is where to **read** the shape, never what to import. `ApiError`, the runtime error family and the file vocabulary are excluded — see sdk-map.md.

### verifyWebhookSignaturePost

- **Signature**: `verifyWebhookSignaturePost(request?: VerifyWebhookSignatureApi.VerifyWebhookSignaturePostRequest, options?: RequestOptions): ApiPromise<VerifyWebhookSignatureResponse, ApiError>`
- **Wire**: `POST /v1/notifications/verify-webhook-signature`
- **Auth**: `oauth2`
- **Request body**: `application/json` — the `body` field. **Optional**: omit it and the request carries no body and no `Content-Type` header at all
- **SDK-sent**: `header Idempotency-Key` (minted per call)
- **Returns**: `VerifyWebhookSignatureResponse`
- **Error**: `InvoicesError` with `kind: "api"` — untyped, `payload.kind` always `"undeclared"`

**Fields** — `VerifyWebhookSignatureApi.VerifyWebhookSignaturePostRequest` (1):

| Field | Channel | Type | Req |
| --- | --- | --- | --- |
| `body` | `body` | `VerifyWebhookSignature` | no |

| Type | Schema value | Source |
| --- | --- | --- |
| `VerifyWebhookSignature` | `verifyWebhookSignatureSchema` | `src/models/verify-webhook-signature.ts` |
| `VerifyWebhookSignatureResponse` | `verifyWebhookSignatureResponseSchema` | `src/models/verify-webhook-signature-response.ts` |

