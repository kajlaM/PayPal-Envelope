export { PayPalVaultApiClient } from "./client.js";
export type { ClientOptions } from "./client-options.js";

export type { TokenProvider } from "./core/auth/credentials.js";

export { Vaults } from "./resources/vaults.js";
export { Funding } from "./resources/funding.js";
export { Purchases } from "./resources/purchases.js";
export { Agent } from "./resources/agent.js";
export { SavingsApi } from "./resources/savings-api.js";
export { PayPalVerification } from "./resources/pay-pal-verification.js";
export { Products } from "./resources/products.js";
export { Audit } from "./resources/audit.js";
export { System } from "./resources/system.js";

export { apiAuditAskRequestSchema, type ApiAuditAskRequest } from "./models/api-audit-ask-request.js";
export {
  apiProductsLookupRequestSchema,
  type ApiProductsLookupRequest,
} from "./models/api-products-lookup-request.js";
export {
  apiVaultsAgentNextRequestSchema,
  type ApiVaultsAgentNextRequest,
} from "./models/api-vaults-agent-next-request.js";
export {
  apiVaultsAgentRequestSchema,
  type ApiVaultsAgentRequest,
} from "./models/api-vaults-agent-request.js";
export {
  apiVaultsCompileRequestSchema,
  type ApiVaultsCompileRequest,
} from "./models/api-vaults-compile-request.js";
export {
  apiVaultsExpiryRequestSchema,
  type ApiVaultsExpiryRequest,
} from "./models/api-vaults-expiry-request.js";
export {
  apiVaultsFundCaptureRequestSchema,
  type ApiVaultsFundCaptureRequest,
} from "./models/api-vaults-fund-capture-request.js";
export {
  apiVaultsFundRecordedRequestSchema,
  type ApiVaultsFundRecordedRequest,
} from "./models/api-vaults-fund-recorded-request.js";
export {
  apiVaultsFundRequestsRequestSchema,
  type ApiVaultsFundRequestsRequest,
} from "./models/api-vaults-fund-requests-request.js";
export {
  apiVaultsPolicyRequestSchema,
  type ApiVaultsPolicyRequest,
} from "./models/api-vaults-policy-request.js";
export {
  apiVaultsProposalsChooseRequestSchema,
  type ApiVaultsProposalsChooseRequest,
} from "./models/api-vaults-proposals-choose-request.js";
export {
  apiVaultsProposalsRequestSchema,
  type ApiVaultsProposalsRequest,
} from "./models/api-vaults-proposals-request.js";
export { apiVaultsRequestSchema, type ApiVaultsRequest } from "./models/api-vaults-request.js";
export {
  apiVaultsSavingsNextRequestSchema,
  type ApiVaultsSavingsNextRequest,
} from "./models/api-vaults-savings-next-request.js";
export {
  apiVaultsSpendRequestSchema,
  type ApiVaultsSpendRequest,
} from "./models/api-vaults-spend-request.js";
export {
  apiVaultsSubscribeConfirmRequestSchema,
  type ApiVaultsSubscribeConfirmRequest,
} from "./models/api-vaults-subscribe-confirm-request.js";
export {
  apiVaultsSyncResponseSchema,
  type ApiVaultsSyncResponse,
} from "./models/api-vaults-sync-response.js";
export { channel3Schema, type Channel3 } from "./models/channel3.js";
export { channel31Schema, type Channel31 } from "./models/channel31.js";
export { Condition, conditionSchema } from "./models/condition.js";
export { ControlMode, controlModeSchema } from "./models/control-mode.js";
export { countsSchema, type Counts } from "./models/counts.js";
export { Currency, currencySchema } from "./models/currency.js";
export { decisionSchema, type Decision } from "./models/decision.js";
export { errorSchema, type Error } from "./models/error.js";
export { errorErrorSchema, type ErrorError } from "./models/error-error.js";
export { Every, everySchema } from "./models/every.js";
export { historySchema, type History } from "./models/history.js";
export { itemSchema, type Item } from "./models/item.js";
export { ledgerEntrySchema, type LedgerEntry } from "./models/ledger-entry.js";
export { liquidationSchema, type Liquidation } from "./models/liquidation.js";
export { listSchema, type List } from "./models/list.js";
export { mismatchSchema, type Mismatch } from "./models/mismatch.js";
export { OnPolicyViolation, onPolicyViolationSchema } from "./models/on-policy-violation.js";
export { optionSchema, type Option } from "./models/option.js";
export { PayPalCheck, payPalCheckSchema } from "./models/pay-pal-check.js";
export { PaypalCheck1, paypalCheck1Schema } from "./models/paypal-check1.js";
export { pointSchema, type Point } from "./models/unions/point.js";
export { policySchema, type Policy } from "./models/policy.js";
export { Rebalance, rebalanceSchema } from "./models/rebalance.js";
export { requestJsonSchema, type RequestJson } from "./models/request-json.js";
export { Result, resultSchema } from "./models/result.js";
export { rulesSchema, type Rules } from "./models/rules.js";
export { savingsSchema, type Savings } from "./models/savings.js";
export { shoppingSchema, type Shopping } from "./models/shopping.js";
export { spendResultSchema, type SpendResult } from "./models/spend-result.js";
export { spendResultErrorSchema, type SpendResultError } from "./models/spend-result-error.js";
export { Status, statusSchema } from "./models/status.js";
export { Status1, status1Schema } from "./models/status1.js";
export { Status2, status2Schema } from "./models/status2.js";
export { storeSchema, type Store } from "./models/store.js";
export { totalsSchema, type Totals } from "./models/totals.js";
export { Type, typeSchema } from "./models/type.js";
export { Type1, type1Schema } from "./models/type1.js";
export { vaultDetailsSchema, type VaultDetails } from "./models/vault-details.js";
export { vaultSummarySchema, type VaultSummary } from "./models/vault-summary.js";
export { VaultType, vaultTypeSchema } from "./models/vault-type.js";
export { vaultVerificationSchema, type VaultVerification } from "./models/vault-verification.js";
export { verificationSchema, type Verification } from "./models/verification.js";
export { weightsSchema, type Weights } from "./models/weights.js";
export { Status3, status3Schema } from "./models/status3.js";

export {
  CoreError as PayPalVaultApiError,
  ResponseError,
  DecodeError,
  EncodeError,
  ConnectionError,
  TimeoutError,
  AuthError,
  PaginationError,
  ConfigurationError,
} from "./core/errors.js";
export { ApiError } from "./core/api-error.js";
export { SchemaError } from "./core/validation/schema-error.js";
export {
  defaultLoggingOptions,
  type LoggingOptions,
  type RequestLoggingOptions,
  type Logger,
  type LogDetails,
  type HttpRequestDetails,
  type RequestHeadersDetails,
  type RequestBodyDetails,
  type HttpResponseDetails,
  type ResponseHeadersDetails,
  type HttpRetryingDetails,
  type HttpFailedDetails,
  type LogLevel,
} from "./core/logging.js";
export type { ApiPromise, ApiResult } from "./core/api-promise.js";
export type { Pageable, PageableApiResult } from "./core/pagination/pageable.js";
export type { HttpMethod, RequestOptions } from "./core/api-request.js";
export type { RetryOptions, RequestRetryOptions, RetryAttempt, RetryReason } from "./core/retry.js";
export type { BinaryContent, BinaryData, BinaryErrorContent, FileData, FileInput } from "./core/binary.js";
export type { ErrorKind } from "./core/errors.js";
export type { Declared, Undeclared } from "./core/api-error.js";
export type { Schema, EnumSchema, Encoded } from "./core/validation/schema.js";
