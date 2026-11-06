# Reference

> Source: [PayPalVaultApiClient](src/client.ts)

## Vaults

> Source: [Vaults](src/resources/vaults.ts)

<details>
<summary><code>changeExpiry(request: Vaults.ChangeExpiryRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Vaults.ChangeExpiryError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.vaults.changeExpiry({
    id: "some example string",
    body: { expiresAt: new Date(Date.UTC(2024, 0, 15, 9, 30, 0)) },
  });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Vaults.ChangeExpiryError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.vaults.changeExpiry({
  id: "some example string",
  body: { expiresAt: new Date(Date.UTC(2024, 0, 15, 9, 30, 0)) },
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |
| <code>body</code> | <code>[ApiVaultsExpiryRequest](src/models/api-vaults-expiry-request.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.vaults.changeExpiry(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Vaults.ChangeExpiryError](src/resources/vaults.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.vaults.changeExpiry(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Vaults.ChangeExpiryError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>changePolicy(request: Vaults.ChangePolicyRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Vaults.ChangePolicyError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.vaults.changePolicy({
    id: "some example string",
    body: {
      policy: {
        vaultName: "some example string",
        vaultType: VaultType.Shopping,
        allocatedBudget: 1.5,
        rules: {
          maxSingleTransaction: 1.5,
          allowedCategories: ["some example string"],
          approvedMerchants: ["some example string"],
          expiryTimestamp: new Date(Date.UTC(2024, 0, 15, 9, 30, 0)),
        },
      },
    },
  });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Vaults.ChangePolicyError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.vaults.changePolicy({
  id: "some example string",
  body: {
    policy: {
      vaultName: "some example string",
      vaultType: VaultType.Shopping,
      allocatedBudget: 1.5,
      rules: {
        maxSingleTransaction: 1.5,
        allowedCategories: ["some example string"],
        approvedMerchants: ["some example string"],
        expiryTimestamp: new Date(Date.UTC(2024, 0, 15, 9, 30, 0)),
      },
    },
  },
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |
| <code>body</code> | <code>[ApiVaultsPolicyRequest](src/models/api-vaults-policy-request.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.vaults.changePolicy(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Vaults.ChangePolicyError](src/resources/vaults.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.vaults.changePolicy(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Vaults.ChangePolicyError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>compilePolicy(request: Vaults.CompilePolicyRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Vaults.CompilePolicyError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.vaults.compilePolicy({ body: { text: "some example string" } });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Vaults.CompilePolicyError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.vaults.compilePolicy({ body: { text: "some example string" } }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>body</code> | <code>[ApiVaultsCompileRequest](src/models/api-vaults-compile-request.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.vaults.compilePolicy(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Vaults.CompilePolicyError](src/resources/vaults.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.vaults.compilePolicy(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Vaults.CompilePolicyError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>createVault(request: Vaults.CreateVaultRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Vaults.CreateVaultError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.vaults.createVault({
    body: {
      policy: {
        vaultName: "some example string",
        vaultType: VaultType.Shopping,
        allocatedBudget: 1.5,
        rules: {
          maxSingleTransaction: 1.5,
          allowedCategories: ["some example string"],
          approvedMerchants: ["some example string"],
          expiryTimestamp: new Date(Date.UTC(2024, 0, 15, 9, 30, 0)),
        },
      },
    },
  });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Vaults.CreateVaultError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.vaults.createVault({
  body: {
    policy: {
      vaultName: "some example string",
      vaultType: VaultType.Shopping,
      allocatedBudget: 1.5,
      rules: {
        maxSingleTransaction: 1.5,
        allowedCategories: ["some example string"],
        approvedMerchants: ["some example string"],
        expiryTimestamp: new Date(Date.UTC(2024, 0, 15, 9, 30, 0)),
      },
    },
  },
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>body</code> | <code>[ApiVaultsRequest](src/models/api-vaults-request.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.vaults.createVault(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Vaults.CreateVaultError](src/resources/vaults.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.vaults.createVault(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Vaults.CreateVaultError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>getVault(request: Vaults.GetVaultRequest, options?: RequestOptions): ApiPromise&lt;VaultDetails, Vaults.GetVaultError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.vaults.getVault({ id: "some example string" });
  // TODO: Handle 'response' of type VaultDetails
} catch (err) {
  // TODO: Handle 'err' of type Vaults.GetVaultError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.vaults.getVault({ id: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type VaultDetails
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.vaults.getVault(request)`

- **OnSuccess**: <code>[VaultDetails](src/models/vault-details.ts)</code>
- **OnError**: throws <code>[Vaults.GetVaultError](src/resources/vaults.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.vaults.getVault(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;VaultDetails, Vaults.GetVaultError&gt;</code>, with `result.value` of type <code>[VaultDetails](src/models/vault-details.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>liquidateVault(request: Vaults.LiquidateVaultRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Vaults.LiquidateVaultError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.vaults.liquidateVault({ id: "some example string" });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Vaults.LiquidateVaultError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.vaults.liquidateVault({ id: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.vaults.liquidateVault(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Vaults.LiquidateVaultError](src/resources/vaults.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.vaults.liquidateVault(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Vaults.LiquidateVaultError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>listVaultDetails(request: Vaults.ListVaultDetailsRequest, options?: RequestOptions): ApiPromise&lt;VaultDetails[], Vaults.ListVaultDetailsError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.vaults.listVaultDetails({ userId: "some example string" });
  // TODO: Handle 'response' of type VaultDetails[]
} catch (err) {
  // TODO: Handle 'err' of type Vaults.ListVaultDetailsError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.vaults.listVaultDetails({ userId: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type VaultDetails[]
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>userId</code> | <code>string</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.vaults.listVaultDetails(request)`

- **OnSuccess**: <code>[VaultDetails](src/models/vault-details.ts)[]</code>
- **OnError**: throws <code>[Vaults.ListVaultDetailsError](src/resources/vaults.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.vaults.listVaultDetails(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;VaultDetails[], Vaults.ListVaultDetailsError&gt;</code>, with `result.value` of type <code>[VaultDetails](src/models/vault-details.ts)[]</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>listVaults(options?: RequestOptions): ApiPromise&lt;VaultSummary[], Vaults.ListVaultsError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.vaults.listVaults();
  // TODO: Handle 'response' of type VaultSummary[]
} catch (err) {
  // TODO: Handle 'err' of type Vaults.ListVaultsError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.vaults.listVaults().asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type VaultSummary[]
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.vaults.listVaults()`

- **OnSuccess**: <code>[VaultSummary](src/models/vault-summary.ts)[]</code>
- **OnError**: throws <code>[Vaults.ListVaultsError](src/resources/vaults.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.vaults.listVaults().asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;VaultSummary[], Vaults.ListVaultsError&gt;</code>, with `result.value` of type <code>[VaultSummary](src/models/vault-summary.ts)[]</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>syncVault(request: Vaults.SyncVaultRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Vaults.SyncVaultError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.vaults.syncVault({ id: "some example string" });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Vaults.SyncVaultError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.vaults.syncVault({ id: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.vaults.syncVault(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Vaults.SyncVaultError](src/resources/vaults.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.vaults.syncVault(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Vaults.SyncVaultError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## Funding

> Source: [Funding](src/resources/funding.ts)

<details>
<summary><code>cancelFundRequest(request: Funding.CancelFundRequestRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Funding.CancelFundRequestError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.funding.cancelFundRequest({
    id: "some example string",
    requestId: "some example string",
  });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Funding.CancelFundRequestError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.funding.cancelFundRequest({
  id: "some example string",
  requestId: "some example string",
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |
| <code>requestId</code> | <code>string</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.funding.cancelFundRequest(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Funding.CancelFundRequestError](src/resources/funding.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.funding.cancelFundRequest(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Funding.CancelFundRequestError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>captureFunding(request: Funding.CaptureFundingRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Funding.CaptureFundingError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.funding.captureFunding({
    id: "some example string",
    body: { orderId: "some example string" },
  });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Funding.CaptureFundingError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.funding.captureFunding({
  id: "some example string",
  body: { orderId: "some example string" },
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |
| <code>body</code> | <code>[ApiVaultsFundCaptureRequest](src/models/api-vaults-fund-capture-request.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.funding.captureFunding(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Funding.CaptureFundingError](src/resources/funding.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.funding.captureFunding(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Funding.CaptureFundingError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>confirmSubscription(request: Funding.ConfirmSubscriptionRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Funding.ConfirmSubscriptionError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.funding.confirmSubscription({
    id: "some example string",
    body: { subscriptionId: "some example string" },
  });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Funding.ConfirmSubscriptionError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.funding.confirmSubscription({
  id: "some example string",
  body: { subscriptionId: "some example string" },
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |
| <code>body</code> | <code>[ApiVaultsSubscribeConfirmRequest](src/models/api-vaults-subscribe-confirm-request.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.funding.confirmSubscription(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Funding.ConfirmSubscriptionError](src/resources/funding.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.funding.confirmSubscription(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Funding.ConfirmSubscriptionError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>createFundRequest(request: Funding.CreateFundRequestRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Funding.CreateFundRequestError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.funding.createFundRequest({
    id: "some example string",
    body: { payerEmail: "some example string" },
  });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Funding.CreateFundRequestError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.funding.createFundRequest({
  id: "some example string",
  body: { payerEmail: "some example string" },
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |
| <code>body</code> | <code>[ApiVaultsFundRequestsRequest](src/models/api-vaults-fund-requests-request.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.funding.createFundRequest(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Funding.CreateFundRequestError](src/resources/funding.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.funding.createFundRequest(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Funding.CreateFundRequestError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>createFundingOrder(request: Funding.CreateFundingOrderRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Funding.CreateFundingOrderError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.funding.createFundingOrder({ id: "some example string" });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Funding.CreateFundingOrderError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.funding.createFundingOrder({ id: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.funding.createFundingOrder(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Funding.CreateFundingOrderError](src/resources/funding.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.funding.createFundingOrder(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Funding.CreateFundingOrderError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>createSubscription(request: Funding.CreateSubscriptionRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Funding.CreateSubscriptionError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.funding.createSubscription({ id: "some example string" });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Funding.CreateSubscriptionError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.funding.createSubscription({ id: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.funding.createSubscription(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Funding.CreateSubscriptionError](src/resources/funding.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.funding.createSubscription(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Funding.CreateSubscriptionError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>listFundRequests(request: Funding.ListFundRequestsRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;[], Funding.ListFundRequestsError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.funding.listFundRequests({ payerEmail: "some example string" });
  // TODO: Handle 'response' of type Record<string, unknown>[]
} catch (err) {
  // TODO: Handle 'err' of type Funding.ListFundRequestsError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.funding.listFundRequests({ payerEmail: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>[]
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>payerEmail</code> | <code>string</code> | - |
| <code>status?</code> | <code>[Status3](src/models/status3.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.funding.listFundRequests(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;[]</code>
- **OnError**: throws <code>[Funding.ListFundRequestsError](src/resources/funding.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.funding.listFundRequests(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;[], Funding.ListFundRequestsError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;[]</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>recordFunding(request: Funding.RecordFundingRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Funding.RecordFundingError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Internal: needs the internal key (only PayPalVault's own site, agent and jobs have it).

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.funding.recordFunding({
    id: "some example string",
    body: { orderId: "some example string" },
  });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Funding.RecordFundingError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.funding.recordFunding({
  id: "some example string",
  body: { orderId: "some example string" },
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |
| <code>body</code> | <code>[ApiVaultsFundRecordedRequest](src/models/api-vaults-fund-recorded-request.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.funding.recordFunding(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Funding.RecordFundingError](src/resources/funding.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.funding.recordFunding(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Funding.RecordFundingError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>syncFundRequest(request: Funding.SyncFundRequestRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Funding.SyncFundRequestError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.funding.syncFundRequest({ id: "some example string" });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Funding.SyncFundRequestError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.funding.syncFundRequest({ id: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.funding.syncFundRequest(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Funding.SyncFundRequestError](src/resources/funding.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.funding.syncFundRequest(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Funding.SyncFundRequestError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>syncFundRequests(request: Funding.SyncFundRequestsRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Funding.SyncFundRequestsError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.funding.syncFundRequests({ id: "some example string" });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Funding.SyncFundRequestsError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.funding.syncFundRequests({ id: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.funding.syncFundRequests(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Funding.SyncFundRequestsError](src/resources/funding.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.funding.syncFundRequests(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Funding.SyncFundRequestsError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## Purchases

> Source: [Purchases](src/resources/purchases.ts)

<details>
<summary><code>approvePurchase(request: Purchases.ApprovePurchaseRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Purchases.ApprovePurchaseError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

The site asks for the owner's password before calling this.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.purchases.approvePurchase({
    id: "some example string",
    decisionId: "some example string",
  });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Purchases.ApprovePurchaseError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.purchases.approvePurchase({
  id: "some example string",
  decisionId: "some example string",
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |
| <code>decisionId</code> | <code>string</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.purchases.approvePurchase(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Purchases.ApprovePurchaseError](src/resources/purchases.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.purchases.approvePurchase(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Purchases.ApprovePurchaseError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>chooseOption(request: Purchases.ChooseOptionRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Purchases.ChooseOptionError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.purchases.chooseOption({
    id: "some example string",
    proposalId: "some example string",
    body: { index: 1 },
  });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Purchases.ChooseOptionError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.purchases.chooseOption({
  id: "some example string",
  proposalId: "some example string",
  body: { index: 1 },
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |
| <code>proposalId</code> | <code>string</code> | - |
| <code>body</code> | <code>[ApiVaultsProposalsChooseRequest](src/models/api-vaults-proposals-choose-request.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.purchases.chooseOption(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Purchases.ChooseOptionError](src/resources/purchases.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.purchases.chooseOption(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Purchases.ChooseOptionError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>proposeOptions(request: Purchases.ProposeOptionsRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Purchases.ProposeOptionsError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Internal: needs the internal key (only PayPalVault's own site, agent and jobs have it).

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.purchases.proposeOptions({
    id: "some example string",
    body: {
      options: [
        {
          title: "some example string",
          merchant: "some example string",
          price: 1.5,
          verifiedPrice: 1.5,
          url: "https://example.com",
          category: "some example string",
          pros: ["some example string"],
          cons: ["some example string"],
        },
      ],
    },
  });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Purchases.ProposeOptionsError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.purchases.proposeOptions({
  id: "some example string",
  body: {
    options: [
      {
        title: "some example string",
        merchant: "some example string",
        price: 1.5,
        verifiedPrice: 1.5,
        url: "https://example.com",
        category: "some example string",
        pros: ["some example string"],
        cons: ["some example string"],
      },
    ],
  },
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |
| <code>body</code> | <code>[ApiVaultsProposalsRequest](src/models/api-vaults-proposals-request.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.purchases.proposeOptions(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Purchases.ProposeOptionsError](src/resources/purchases.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.purchases.proposeOptions(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Purchases.ProposeOptionsError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>rejectOptions(request: Purchases.RejectOptionsRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Purchases.RejectOptionsError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.purchases.rejectOptions({
    id: "some example string",
    proposalId: "some example string",
  });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Purchases.RejectOptionsError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.purchases.rejectOptions({
  id: "some example string",
  proposalId: "some example string",
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |
| <code>proposalId</code> | <code>string</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.purchases.rejectOptions(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Purchases.RejectOptionsError](src/resources/purchases.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.purchases.rejectOptions(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Purchases.RejectOptionsError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>rejectPurchase(request: Purchases.RejectPurchaseRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Purchases.RejectPurchaseError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.purchases.rejectPurchase({
    id: "some example string",
    decisionId: "some example string",
  });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Purchases.RejectPurchaseError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.purchases.rejectPurchase({
  id: "some example string",
  decisionId: "some example string",
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |
| <code>decisionId</code> | <code>string</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.purchases.rejectPurchase(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Purchases.RejectPurchaseError](src/resources/purchases.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.purchases.rejectPurchase(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Purchases.RejectPurchaseError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>requestPurchase(request: Purchases.RequestPurchaseRequest, options?: RequestOptions): ApiPromise&lt;SpendResult, Purchases.RequestPurchaseError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

The only way money leaves a vault for a shop. The Policy Engine checks the vault rules (budget, shops, categories, limits, live price) first. 200 = approved and paid with PayPal; 202 = waits for the owner's approval; 403 = blocked. Internal: needs the internal key (only PayPalVault's own site, agent and jobs have it).

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.purchases.requestPurchase({
    id: "some example string",
    body: {
      merchant: "some example string",
      amount: 1.5,
      category: "some example string",
      reason: "some example string",
    },
  });
  // TODO: Handle 'response' of type SpendResult
} catch (err) {
  // TODO: Handle 'err' of type Purchases.RequestPurchaseError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.purchases.requestPurchase({
  id: "some example string",
  body: {
    merchant: "some example string",
    amount: 1.5,
    category: "some example string",
    reason: "some example string",
  },
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type SpendResult
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |
| <code>body</code> | <code>[ApiVaultsSpendRequest](src/models/api-vaults-spend-request.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.purchases.requestPurchase(request)`

- **OnSuccess**: <code>[SpendResult](src/models/spend-result.ts)</code>
- **OnError**: throws <code>[Purchases.RequestPurchaseError](src/resources/purchases.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.purchases.requestPurchase(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;SpendResult, Purchases.RequestPurchaseError&gt;</code>, with `result.value` of type <code>[SpendResult](src/models/spend-result.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## Agent

> Source: [Agent](src/resources/agent.ts)

<details>
<summary><code>runAgent(request: Agent.RunAgentRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Agent.RunAgentError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.agent.runAgent({ id: "some example string", body: {} });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Agent.RunAgentError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.agent.runAgent({ id: "some example string", body: {} }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |
| <code>body</code> | <code>[ApiVaultsAgentRequest](src/models/api-vaults-agent-request.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.agent.runAgent(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Agent.RunAgentError](src/resources/agent.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.agent.runAgent(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Agent.RunAgentError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>scheduleAgent(request: Agent.ScheduleAgentRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Agent.ScheduleAgentError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.agent.scheduleAgent({
    id: "some example string",
    body: { at: new Date(Date.UTC(2024, 0, 15, 9, 30, 0)) },
  });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Agent.ScheduleAgentError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.agent.scheduleAgent({
  id: "some example string",
  body: { at: new Date(Date.UTC(2024, 0, 15, 9, 30, 0)) },
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |
| <code>body</code> | <code>[ApiVaultsAgentNextRequest](src/models/api-vaults-agent-next-request.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.agent.scheduleAgent(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Agent.ScheduleAgentError](src/resources/agent.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.agent.scheduleAgent(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Agent.ScheduleAgentError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>stopAgent(request: Agent.StopAgentRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Agent.StopAgentError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.agent.stopAgent({ id: "some example string" });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Agent.StopAgentError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.agent.stopAgent({ id: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.agent.stopAgent(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Agent.StopAgentError](src/resources/agent.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.agent.stopAgent(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Agent.StopAgentError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## SavingsApi

> Source: [SavingsApi](src/resources/savings-api.ts)

<details>
<summary><code>chargeSavingsNow(request: SavingsApi.ChargeSavingsNowRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, SavingsApi.ChargeSavingsNowError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Internal: needs the internal key (only PayPalVault's own site, agent and jobs have it).

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.savingsApi.chargeSavingsNow({ id: "some example string" });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type SavingsApi.ChargeSavingsNowError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.savingsApi.chargeSavingsNow({ id: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.savingsApi.chargeSavingsNow(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[SavingsApi.ChargeSavingsNowError](src/resources/savings-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.savingsApi.chargeSavingsNow(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, SavingsApi.ChargeSavingsNowError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>moveSavingsPayment(request: SavingsApi.MoveSavingsPaymentRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, SavingsApi.MoveSavingsPaymentError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.savingsApi.moveSavingsPayment({
    id: "some example string",
    body: { at: new Date(Date.UTC(2024, 0, 15, 9, 30, 0)) },
  });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type SavingsApi.MoveSavingsPaymentError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.savingsApi.moveSavingsPayment({
  id: "some example string",
  body: { at: new Date(Date.UTC(2024, 0, 15, 9, 30, 0)) },
}).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |
| <code>body</code> | <code>[ApiVaultsSavingsNextRequest](src/models/api-vaults-savings-next-request.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.savingsApi.moveSavingsPayment(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[SavingsApi.MoveSavingsPaymentError](src/resources/savings-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.savingsApi.moveSavingsPayment(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, SavingsApi.MoveSavingsPaymentError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>pauseSavings(request: SavingsApi.PauseSavingsRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, SavingsApi.PauseSavingsError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.savingsApi.pauseSavings({ id: "some example string" });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type SavingsApi.PauseSavingsError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.savingsApi.pauseSavings({ id: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.savingsApi.pauseSavings(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[SavingsApi.PauseSavingsError](src/resources/savings-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.savingsApi.pauseSavings(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, SavingsApi.PauseSavingsError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>resumeSavings(request: SavingsApi.ResumeSavingsRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, SavingsApi.ResumeSavingsError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.savingsApi.resumeSavings({ id: "some example string" });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type SavingsApi.ResumeSavingsError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.savingsApi.resumeSavings({ id: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.savingsApi.resumeSavings(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[SavingsApi.ResumeSavingsError](src/resources/savings-api.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.savingsApi.resumeSavings(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, SavingsApi.ResumeSavingsError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## PayPalVerification

> Source: [PayPalVerification](src/resources/pay-pal-verification.ts)

<details>
<summary><code>verifyVault(request: PayPalVerification.VerifyVaultRequest, options?: RequestOptions): ApiPromise&lt;VaultVerification, PayPalVerification.VerifyVaultError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Read-only: PayPal is only asked, never paid, and the ledger's amounts and statuses are never changed. Also runs every night.

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.payPalVerification.verifyVault({ id: "some example string" });
  // TODO: Handle 'response' of type VaultVerification
} catch (err) {
  // TODO: Handle 'err' of type PayPalVerification.VerifyVaultError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.payPalVerification.verifyVault({ id: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type VaultVerification
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>id</code> | <code>string</code> | Vault id |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.payPalVerification.verifyVault(request)`

- **OnSuccess**: <code>[VaultVerification](src/models/vault-verification.ts)</code>
- **OnError**: throws <code>[PayPalVerification.VerifyVaultError](src/resources/pay-pal-verification.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.payPalVerification.verifyVault(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;VaultVerification, PayPalVerification.VerifyVaultError&gt;</code>, with `result.value` of type <code>[VaultVerification](src/models/vault-verification.ts)</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## Products

> Source: [Products](src/resources/products.ts)

<details>
<summary><code>lookupProduct(request: Products.LookupProductRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Products.LookupProductError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.products.lookupProduct({ body: { url: "https://example.com" } });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Products.LookupProductError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.products.lookupProduct({ body: { url: "https://example.com" } }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>body</code> | <code>[ApiProductsLookupRequest](src/models/api-products-lookup-request.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.products.lookupProduct(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Products.LookupProductError](src/resources/products.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.products.lookupProduct(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Products.LookupProductError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## Audit

> Source: [Audit](src/resources/audit.ts)

<details>
<summary><code>askAudit(request: Audit.AskAuditRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Audit.AskAuditError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.audit.askAudit({ body: { question: "some example string" } });
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Audit.AskAuditError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.audit.askAudit({ body: { question: "some example string" } }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>body</code> | <code>[ApiAuditAskRequest](src/models/api-audit-ask-request.ts)</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.audit.askAudit(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Audit.AskAuditError](src/resources/audit.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.audit.askAudit(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Audit.AskAuditError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>reindexAudit(options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, Audit.ReindexAuditError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Internal: needs the internal key (only PayPalVault's own site, agent and jobs have it).

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.audit.reindexAudit();
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type Audit.ReindexAuditError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.audit.reindexAudit().asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.audit.reindexAudit()`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[Audit.ReindexAuditError](src/resources/audit.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.audit.reindexAudit().asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, Audit.ReindexAuditError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>searchAudit(request: Audit.SearchAuditRequest, options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;[], Audit.SearchAuditError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.audit.searchAudit({ q: "some example string" });
  // TODO: Handle 'response' of type Record<string, unknown>[]
} catch (err) {
  // TODO: Handle 'err' of type Audit.SearchAuditError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.audit.searchAudit({ q: "some example string" }).asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>[]
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>q</code> | <code>string</code> | - |
| <code>vaultId?</code> | <code>string</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.audit.searchAudit(request)`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;[]</code>
- **OnError**: throws <code>[Audit.SearchAuditError](src/resources/audit.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.audit.searchAudit(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;[], Audit.SearchAuditError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;[]</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

## System

> Source: [System](src/resources/system.ts)

<details>
<summary><code>health(options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, System.HealthError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.system.health();
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type System.HealthError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.system.health().asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.system.health()`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[System.HealthError](src/resources/system.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.system.health().asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, System.HealthError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>listDecisions(request?: System.ListDecisionsRequest, options?: RequestOptions): ApiPromise&lt;Decision[], System.ListDecisionsError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.system.listDecisions();
  // TODO: Handle 'response' of type Decision[]
} catch (err) {
  // TODO: Handle 'err' of type System.ListDecisionsError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.system.listDecisions().asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Decision[]
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>vaultId?</code> | <code>string</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.system.listDecisions(request)`

- **OnSuccess**: <code>[Decision](src/models/decision.ts)[]</code>
- **OnError**: throws <code>[System.ListDecisionsError](src/resources/system.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.system.listDecisions(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Decision[], System.ListDecisionsError&gt;</code>, with `result.value` of type <code>[Decision](src/models/decision.ts)[]</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>listLedger(request?: System.ListLedgerRequest, options?: RequestOptions): ApiPromise&lt;LedgerEntry[], System.ListLedgerError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.system.listLedger();
  // TODO: Handle 'response' of type LedgerEntry[]
} catch (err) {
  // TODO: Handle 'err' of type System.ListLedgerError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.system.listLedger().asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type LedgerEntry[]
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Parameters

<dl>
<dd>

| Name | Type | Description |
| --- | --- | --- |
| <code>vaultId?</code> | <code>string</code> | - |

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.system.listLedger(request)`

- **OnSuccess**: <code>[LedgerEntry](src/models/ledger-entry.ts)[]</code>
- **OnError**: throws <code>[System.ListLedgerError](src/resources/system.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.system.listLedger(request).asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;LedgerEntry[], System.ListLedgerError&gt;</code>, with `result.value` of type <code>[LedgerEntry](src/models/ledger-entry.ts)[]</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>listMerchants(options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;[], System.ListMerchantsError&gt;</code></summary>

<dl>
<dd>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.system.listMerchants();
  // TODO: Handle 'response' of type Record<string, unknown>[]
} catch (err) {
  // TODO: Handle 'err' of type System.ListMerchantsError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.system.listMerchants().asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>[]
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.system.listMerchants()`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;[]</code>
- **OnError**: throws <code>[System.ListMerchantsError](src/resources/system.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.system.listMerchants().asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;[], System.ListMerchantsError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;[]</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

<details>
<summary><code>runBackgroundJobs(options?: RequestOptions): ApiPromise&lt;Record&lt;string, unknown&gt;, System.RunBackgroundJobsError&gt;</code></summary>

<dl>
<dd>

### Description

<dl>
<dd>

Internal: needs the internal key (only PayPalVault's own site, agent and jobs have it).

</dd>
</dl>

### Direct Usage

<dl>
<dd>

```ts
try {
  const response = await client.system.runBackgroundJobs();
  // TODO: Handle 'response' of type Record<string, unknown>
} catch (err) {
  // TODO: Handle 'err' of type System.RunBackgroundJobsError, discriminated with 'err.payload.kind'
}
```

</dd>
</dl>

### Usage as ApiResult

<dl>
<dd>

```ts
const result = await client.system.runBackgroundJobs().asApiResult();
// TODO: Use 'result.status' and 'result.headers' to read the raw response status and headers
if (result.ok) {
  // TODO: Use 'result.value' of type Record<string, unknown>
} else {
  // TODO: Handle 'result', discriminated with 'result.payload.kind'
}
```

</dd>
</dl>

### Response

<dl>
<dd>

**Direct**: `await client.system.runBackgroundJobs()`

- **OnSuccess**: <code>Record&lt;string, unknown&gt;</code>
- **OnError**: throws <code>[System.RunBackgroundJobsError](src/resources/system.ts)</code>, with `err.payload` discriminated on `kind`

**As ApiResult**: `await client.system.runBackgroundJobs().asApiResult()`

- **OnSuccess**: <code>[ApiResult](src/core/api-promise.ts)&lt;Record&lt;string, unknown&gt;, System.RunBackgroundJobsError&gt;</code>, with `result.value` of type <code>Record&lt;string, unknown&gt;</code>
- **OnError**: `result.payload` discriminated on `kind`, with `result.message`

**Thrown**: <code>[PayPalVaultApiError](src/core/errors.ts)</code> on any operational failure — a caller abort and a programmer error stay outside the family and reach you raw

</dd>
</dl>

</dd>
</dl>

</details>

