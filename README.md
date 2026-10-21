# KubePay AI: Implementation Guide

This guide covers how to build KubePay AI from start to finish, step by step. For each part it lists the tool to use and where it fits.
All money is **fake**. Every payment runs in the **PayPal Sandbox**, using sandbox accounts from [developer.paypal.com](https://developer.paypal.com).

---

## 0. How Money Moves (Sandbox Model)

Read this first. Every later step builds on it.

| Sandbox account | Type | Plays the role of |
| :--- | :--- | :--- |
| `kubepay-platform@...` | Business | KubePay itself. It holds all vault money and owns the REST app. |
| `user@...` | Personal | The end user who funds vaults and receives refunds. |
| `audio-store@...` | Business | Merchant for the shopping vault. |
| `city-utility@...` | Business | Merchant for the utility bill vault. It sends invoices. |

```
User (personal)  ──Orders API (pay)──►  KubePay Platform (business)  ──Payouts API──►  Merchant (business)
       ▲                                         │
       └──────────Payouts API (unused balance)───┘
User ──Subscriptions API (monthly auto top-up)──► KubePay Platform
```

- **Vault** = a row in our database with a budget, a balance, and a policy. The real money sits in the platform account. Our **ledger** tracks how much belongs to each vault.
- **Fund a vault** → the user pays the platform through the **Orders API** (PayPal button).
- **Agent spends** → the Policy Engine approves the payment, then the platform pays the merchant with the **Payouts API**.
- **Vault expires** → the platform returns the leftover balance to the user with the **Payouts API**.
- Real store names such as "BestBuy" map to our sandbox merchant accounts through a `merchants` table, because real stores cannot receive sandbox money.

**Core rule:** an AI agent never calls PayPal directly. Every money-moving call goes through the Policy Engine first.

---

## 1. Tool Map (What Is Used Where)

| Tool | Used for | Step |
| :--- | :--- | :--- |
| **PayPal Developer Dashboard** | Sandbox accounts, REST app, feature toggles, webhooks, webhook simulator | 2 |
| **PayPal Orders API v2** | User funds a vault | 5 |
| **PayPal JS SDK (Buttons)** | PayPal button the user clicks to fund a vault or subscribe | 5, 13 |
| **PayPal Payouts API** | Paying merchants and returning leftover vault money | 5, 10 |
| **PayPal Subscriptions API** (+ Catalog Products) | Monthly auto top-up of the utility vault | 5 |
| **PayPal Invoicing API v2** | Utility merchant sends bills; the bill-pay agent reads them | 8 |
| **PayPal Webhooks API** | Confirms captures, payouts, and subscription payments | 9 |
| **PayPal Agent Toolkit** (`@paypal/agent-toolkit`) | Ready-made PayPal tools for agents (invoices, orders, transactions), wrapped by the policy gate | 8 |
| **PayPal MCP Server** (`@paypal/mcp`) | Dev-time only: lets your AI coding assistant query the sandbox | 1 |
| **PayPal Server SDK** (`@paypal/paypal-server-sdk`) | Typed client for Orders and Subscriptions | 4 |
| **APIMatic** | Generated the PayPal Server SDK we use; Context Plugin gives your IDE AI PayPal docs | 4 |
| **Claude API** (`claude-sonnet-5-5`, `claude-haiku-5-5`) | Converts plain English into policy JSON, runs agent reasoning, powers the audit copilot | 6, 8, 11 |
| **Vercel AI SDK** (`ai`, `@ai-sdk/anthropic`) | Agent loop and tool calling | 8 |
| **Zod** | Schema validation for policies and tool inputs | 6, 7 |
| **Channel3 API** | Product search for the shopping agent | 8 |
| **Kernel** (`@onkernel/sdk` + Playwright) | Cloud browser that opens the product page and verifies the live price and merchant | 8 |
| **PostgreSQL** (Render Postgres) + **Prisma** | Vaults, policies, ledger, merchants, decisions | 3 |
| **Elasticsearch** (Elastic Cloud) | Audit log search, vector similarity for spotting unusual spending, copilot retrieval | 11 |
| **Socket.IO** | Live updates pushed to the dashboard | 13 |
| **Zapier** (Webhooks by Zapier → Slack/Gmail) | Alerts on blocked payments and liquidations | 12 |
| **React + Vite** | Dashboard app | 13 |
| **AG Grid** | Vaults grid, ledger grid, live policy decision log | 13 |
| **Bryntum Scheduler** | Timeline of vault lifetimes and expiry | 13 |
| **Postman** | API collections for PayPal sandbox and KubePay endpoints | 14 |
| **Render** | Hosting for the API (Web Service), the dashboard (Static Site), the expiry sweeper (Cron Job), and Postgres | 15 |

---

## 2. Set Up the PayPal Sandbox

Tool: **PayPal Developer Dashboard** (developer.paypal.com → log in → Sandbox)

1. **Create a shared developer account** for the team instead of using anyone's personal PayPal account.
2. **Testing Tools → Sandbox Accounts:** create the 4 accounts from Step 0. Give the `user` account a large sandbox balance, for example $5,000.
3. **Apps & Credentials → Create App** (Sandbox, merchant type), linked to `kubepay-platform`. Copy the **Client ID** and **Secret**.
4. In the app's **Features** section, turn on: **Payouts**, **Subscriptions**, **Invoicing**, and **Save payment methods**.
5. Create a **second app** linked to `city-utility`. The utility merchant uses it to send invoices (Step 8).
6. **Webhooks:** no clicking needed. `npm run setup:webhooks` registers them on both apps by API once you have a public URL (Step 9).
7. **Negative testing:** turn it on for the platform account. Failures can then be simulated with the `PayPal-Mock-Response` header (Step 14).

Sandbox base URL: `https://api-m.sandbox.paypal.com`. Review mock transactions at `https://www.sandbox.paypal.com` by logging in as any sandbox account.

---

## 3. Repo, Database, and Ledger

### 3.1 Repo structure (npm workspaces, TypeScript)

```
kubepay-ai/
├── apps/
│   ├── api/            # Express server: REST + webhooks + Socket.IO
│   ├── web/            # React + Vite dashboard
│   └── sweeper/        # Cron job: calls the API tick (expiry + refunds + agent watch)
├── packages/
│   ├── paypal/         # PayPal service layer (Step 4)
│   ├── policy/         # Policy compiler + engine (Steps 6–7)
│   ├── agents/         # Shopping + bill-pay agents (Step 8)
│   └── db/             # Prisma schema + client
├── postman/            # Postman collections
└── .env
```

### 3.2 `.env`

```env
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
PAYPAL_WEBHOOK_ID=...
UTILITY_CLIENT_ID=...
UTILITY_CLIENT_SECRET=...
USER_SANDBOX_EMAIL=user@...
ANTHROPIC_API_KEY=...
CHANNEL3_API_KEY=...
KERNEL_API_KEY=...
ELASTIC_CLOUD_ID=...
ELASTIC_API_KEY=...
ZAPIER_HOOK_URL=...
DATABASE_URL=postgres://...
```

### 3.3 Database tables (Prisma)

| Table | Key columns |
| :--- | :--- |
| `vaults` | id, name, type (`SHOPPING` / `UTILITY`), budget, balance, status (`PENDING_FUNDING` / `ACTIVE` / `EXPIRED` / `LIQUIDATED`), expires_at |
| `policies` | vault_id, policy_json, version, created_from_text |
| `users` | id, name, paypal_email (each vault belongs to a user, like UPI Lite) |
| `ledger_entries` | vault_id, type (`FUND` / `SPEND` / `LIQUIDATE`), status (`PENDING` / `COMPLETED` / `FAILED`), amount_cents, paypal_ref |
| `merchants` | name, category, sandbox_email, approved |
| `decisions` | vault_id, request_json, result (`APPROVE` / `BLOCK` / `NEEDS_HUMAN`), reasons[], created_at |
| `paypal_events` | webhook event id (unique), type, payload, processed |

Rules:
- Store money as **integer cents**.
- Vault `balance` changes only through ledger entries, inside a DB transaction that uses `SELECT ... FOR UPDATE` on the vault row. This prevents double spending when two agent calls arrive at once.

---

## 4. PayPal Service Layer (`packages/paypal`)

One module wraps every PayPal call. Nothing else in the code talks to PayPal.

Two tools are used:
- **PayPal Server SDK** (`@paypal/paypal-server-sdk`, generated by **APIMatic**) for Orders and Subscriptions.
- A small typed REST client (`src/http.ts`, built-in `fetch`) for the APIs the SDK does not cover: Payouts, Invoicing, Catalog Products, Webhooks.

| File | Function | PayPal endpoint | Tool |
| :--- | :--- | :--- | :--- |
| `http.ts` | `getAccessToken()` | `POST /v1/oauth2/token` (cached until it expires) | fetch |
| `orders.ts` | `createOrder({ vaultId, amountCents })` | `POST /v2/checkout/orders` (intent `CAPTURE`, `custom_id` = vaultId) | Server SDK |
| `orders.ts` | `captureOrder(orderId)` | `POST /v2/checkout/orders/{id}/capture` | Server SDK |
| `payouts.ts` | `sendPayout({ ledgerEntryId, receiverEmail, amountCents })` | `POST /v1/payments/payouts` | fetch |
| `payouts.ts` | `getPayout(batchId)` | `GET /v1/payments/payouts/{id}` | fetch |
| `subscriptions.ts` | `createProduct()` | `POST /v1/catalogs/products` | fetch |
| `subscriptions.ts` | `createMonthlyPlan()` / `getSubscription()` / `cancelSubscription()` | `/v1/billing/plans`, `/v1/billing/subscriptions` | Server SDK |
| `invoicing.ts` | `createInvoice()` / `sendInvoice()` / `listInvoices()` / `getInvoice()` | `/v2/invoicing/invoices` (utility app credentials) | fetch |
| `invoicing.ts` | `recordInvoicePayment()` | `POST /v2/invoicing/invoices/{id}/payments` (utility app credentials) | fetch |
| `webhooks.ts` | `verifyWebhook(headers, rawBody, app)`, `upsertWebhook(app, url)`, `listWebhooks`, `deleteWebhook` | `POST /v1/notifications/verify-webhook-signature`, `/v1/notifications/webhooks` | fetch |

Rules for every POST:
- Send a unique `PayPal-Request-Id` header (idempotency), so a retry never double-pays.
- For Payouts, `sender_batch_id` and `sender_item_id` = our ledger entry id.
- Every function takes an optional `mockResponse` for negative testing.

Commands:
- `npm run smoke -w @kubepay/paypal` checks every API against the sandbox.
- `npm run setup:plan -w @kubepay/paypal` creates the utility top-up plan once. Copy the printed id into `.env` as `PAYPAL_UTILITY_PLAN_ID`.

Dev helper: add the **PayPal MCP server** to your AI coding assistant (`npx -y @paypal/mcp --tools=all` with `PAYPAL_ENVIRONMENT=SANDBOX`). You can then check sandbox orders and payouts while building. Also install the **APIMatic Context Plugin** so the assistant has PayPal API context.

---

## 5. Vault Lifecycle API (`apps/api`)

Tool: **Express** routes that call `packages/paypal` + `packages/policy`. Run it with `npm run api:dev` (port 4000). Socket.IO sends `vault:updated`, `decision:created` and `ledger:updated` events.

| Route | What it does |
| :--- | :--- |
| `POST /api/vaults/compile` | Plain English -> policy preview + warnings (Step 6). Nothing saved. |
| `POST /api/vaults` | Takes the confirmed `{ policy, sourceText }` and saves the vault as `PENDING_FUNDING`. |
| `POST /api/vaults/:id/fund/order` | Calls `createOrder` for the vault budget and returns the `orderId` to the PayPal button. |
| `POST /api/vaults/:id/fund/capture` | Calls `captureOrder`, writes a `FUND` ledger entry, and sets status to `ACTIVE`. |
| `POST /api/vaults/:id/subscribe` | Utility vault only. Returns `planId` + `customId` for the PayPal subscription button. |
| `POST /api/vaults/:id/subscribe/confirm` | Checks the new subscription with PayPal and saves its id on the vault. |
| `POST /api/vaults/:id/spend` | **Agents only** (needs the `x-internal-key` header = `INTERNAL_API_KEY`). Runs the Policy Engine. If approved, it holds the money and calls `sendPayout` to the merchant. |
| `POST /api/vaults/:id/decisions/:decisionId/approve` / `reject` | A human approves or rejects a `NEEDS_HUMAN` decision from the dashboard. Approve re-checks the rules first. |
| `POST /api/vaults/:id/sync` | Asks PayPal for the status of pending payouts and settles the ledger. Works without webhooks. |
| `POST /api/vaults/:id/liquidate` | Manual teardown: returns the leftover balance to the user with Payouts. Step 10 does the same on expiry. |
| `GET /api/vaults`, `/api/vaults/:id`, `/api/ledger`, `/api/decisions`, `/api/merchants` | Data for AG Grid. |

**Funding flow:**
1. The dashboard shows a **PayPal JS SDK button**.
2. `createOrder` calls the backend → the user logs in as the sandbox `user` and approves.
3. `onApprove` calls the backend capture → the vault becomes **ACTIVE**.

**Subscription flow (utility vault):**
1. Create one Catalog Product plus a monthly Plan with Step 4 functions (one-time setup script).
2. The JS SDK button is loaded with `vault=true&intent=subscription`.
3. Each `PAYMENT.SALE.COMPLETED` webhook adds a `FUND` ledger entry to that vault.

**Spend flow:**
1. Policy check runs.
2. `reserveSpend()` creates a `SPEND` entry as `PENDING` (balance goes down right away).
3. `sendPayout` to the merchant's sandbox email.
4. Webhook `PAYOUTS-ITEM.SUCCEEDED` → `completeOutflow()` marks it `COMPLETED`. On failure → `failOutflow()` marks it `FAILED` and the balance comes back.

---

## 6. Policy Compiler: Plain English to JSON (`packages/policy/src/compiler.ts`)

Tool: **Claude** (`claude-sonnet-5-5`, first choice) with **Gemini** as automatic backup, through the **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic` + `@ai-sdk/google`, `generateObject`) + **Zod**. If Claude has no credits or a model is busy, the next model in `src/model.ts` is tried. The response says which model answered.
`.env`: `GOOGLE_GENERATIVE_AI_API_KEY`, and `GEMINI_MODEL` = a comma-separated list. If one model is busy or out of free quota, the next is tried. To switch to Claude, change `src/model.ts` only.

1. `PolicySchema` (`src/schema.ts`) is the final policy. `PolicyDraftSchema` (`src/compiler.ts`) is a simpler shape the LLM fills.
2. The prompt gives Gemini the current time, the user's time zone, and the registered merchants, so "before Sunday" becomes an exact timestamp.
3. `normalizeDraft()` fixes the draft in code:
   - It rejects non-USD amounts and budgets of $0 or over $10,000.
   - It clamps the per-payment limit to the budget.
   - It keeps only registered merchants, falling back to merchants of the right category.
   - It defaults the expiry to 7 days, with a maximum of 90.
   - Every change is returned as a warning.
4. API:
   - `POST /api/vaults/compile { text }` returns `{ policy, warnings }`. Nothing is saved yet.
   - The dashboard shows the result, and the user confirms or edits it.
   - `POST /api/vaults { policy, sourceText }` then saves the vault.
5. Test: `npm test -w @kubepay/policy` runs unit tests with no LLM. `npm run compile -w @kubepay/policy -- "your sentence"` runs it against Gemini.

The LLM only *writes* the policy. It never *decides* whether a payment goes through.

---

## 7. Policy Engine: The Guardrail (`packages/policy/src/engine.ts`)

Tool: **plain TypeScript functions** (deterministic, no AI), tested with **node:test** (`npm test -w packages/policy`).

Input: a `SpendRequest` = `{ merchant, amount, category, reason, product_url?, verified_price?, invoice_id? }`. Before calling the engine, `apps/api/src/services/policy-context.ts` collects the facts it needs: today's spends, the registered merchant, and, for utility vaults, the PayPal invoice.

**Hard rules → `BLOCK`** (all failures are listed, not just the first):

| Check | Fails with |
| :--- | :--- |
| Vault is `ACTIVE` and not expired | `VAULT_INACTIVE` / `VAULT_EXPIRED` |
| `amount <= max_single_transaction` | `MAX_LIMIT_EXCEEDED` |
| `amount <= vault balance` | `INSUFFICIENT_VAULT_BALANCE` |
| Merchant is in `approved_merchants` and registered in `merchants` | `MERCHANT_NOT_APPROVED` / `MERCHANT_NOT_REGISTERED` |
| Category is allowed (category tree: `Headphones` → `Audio` → `Electronics`) | `CATEGORY_NOT_ALLOWED` |
| Transactions today are under `max_transactions_per_day` | `DAILY_LIMIT_REACHED` |
| `amount == verified_price` (Kernel check, Step 8) | `PRICE_MISMATCH` |
| Utility vault: `invoice_id` is given, exists, and was issued by this merchant | `INVOICE_REQUIRED` / `INVOICE_NOT_FOUND` / `INVOICE_MERCHANT_MISMATCH` |
| Utility vault: invoice is still open and not already paid | `INVOICE_NOT_OPEN` |
| Utility vault: amount equals the invoice total | `INVOICE_MISMATCH` |

**Soft rules → `NEEDS_HUMAN`** (only if no hard rule failed):

| Check | Flag |
| :--- | :--- |
| `amount > human_approval_above` | `ABOVE_HUMAN_APPROVAL_THRESHOLD` |
| Shopping vault without `verified_price` | `PRICE_NOT_VERIFIED` |
| Same merchant and amount within 10 minutes | `POSSIBLE_DUPLICATE` |
| Elastic anomaly score ≥ 0.8 (Step 11) | `UNUSUAL_SPEND` |

When a human approves (`POST /api/vaults/:id/decisions/:decisionId/approve`), the engine runs again ignoring soft flags, so a hard rule can still block it.

Output: `{ result, reasons[] }`. Every result is saved to `decisions` and sent to the dashboard over Socket.IO (later also indexed in Elastic, with blocks sent to Zapier). When a bill payout succeeds, `apps/api/src/services/settle.ts` marks the PayPal invoice as paid.

---

## 8. AI Agents (`packages/agents`)

Tools: **Vercel AI SDK** (`generateText` with `tools`, `stopWhen: stepCountIs(12)`) + **Claude** (`claude-sonnet-5-5`), with **Gemini** as backup (same model list as Step 6). The agent only switches models if it has not tried to spend yet, so a retry never pays twice.
Each agent runs **inside one vault** and only knows that vault's id. It can spend only through `POST /api/vaults/:id/spend` (Policy Engine, Step 7).

How to run:
- Dashboard / API: `POST /api/vaults/:id/agent` `{ task? }` runs it now. It picks the shopping agent for SHOPPING vaults and the bill-pay agent for UTILITY vaults. Every tool call is pushed live as a Socket.IO `agent:step` event.
- Terminal: `npm run run -w packages/agents -- <vaultId> ["task"]` (the API must be running).

### 8.1 Shopping Agent (`shopping.ts`, Vault A)

**User preferences** live in the policy under `shopping` (the compiler fills them from plain English, e.g. "Sony headphones, new only, 4+ stars, within 5 days, rating matters more than price, check every 15 minutes"):

| Field | Kind | Meaning |
| :--- | :--- | :--- |
| `product_query` | search | What to look for |
| `required_keywords` | hard rule | All must be in the title, else `WRONG_MODEL` |
| `condition` (`NEW` / `ANY`) | hard rule | `NEW` drops used/refurbished (`USED`) |
| `min_rating` | hard rule | Below it → `LOW_RATING` (unknown rating passes, scores in the middle) |
| `max_delivery_days` | hard rule | Slower → `SLOW_DELIVERY` (unknown passes) |
| `preferred_keywords` | soft | Nice-to-have brands/features |
| `weights` `{price, rating, delivery, model_match}` (0–5) | ranking | Default is price only = **cheapest first** |
| `check_every_minutes` | watch mode | How often to look again if nothing matches (default 180) |

Products are also dropped if over budget (`min(max_single_transaction, balance)` → `OVER_BUDGET`), from a merchant not in the policy, or in a category the policy does not allow. Filtering and ranking are plain code (`rank.ts`), not AI.

| Agent tool | Calls | Purpose |
| :--- | :--- | :--- |
| `find_candidates(query?)` | **Channel3 API** (`POST /v1/search`, `x-api-key`), limited to the approved merchants' websites (`merchants.domain` → Channel3 `website_ids`) | Returns the ranked candidates and how many were dropped per reason. Channel3 gives price, rating, condition, and category path (no delivery time). |
| `skip_candidates([{url, reason}])` | – | The AI skips items that are clearly the wrong thing (a case or cable when the user wants earbuds). |
| `buy_next()` | **Kernel** cloud browser, then `POST /api/vaults/:id/spend` | Code takes the **next candidate in ranked order**, opens its page (`kernel.browsers.create()` → Playwright `connectOverCDP`) to read the live price, and asks the Policy Engine to buy it. Merchant, amount (listed price), `verified_price`, and category come from data, never from the AI. |

Loop: find → skip wrong items → buy_next until `APPROVE`, `NEEDS_HUMAN`, or no candidates left. One item per run.
- Live price ≠ listed price → engine blocks it (`PRICE_MISMATCH`) → buy_next tries the next one.
- Page could not be read → no `verified_price` → engine asks a human (`PRICE_NOT_VERIFIED`).

**Watch mode:** each run ends with an outcome: `BOUGHT`, `NEEDS_HUMAN`, or `NO_MATCH`.
- `NO_MATCH` (or an error) → `vaults.nextAgentRunAt` = now + `check_every_minutes` (never after expiry). The API checks due vaults every minute in its background tick (Step 10).
- Funding a shopping vault starts watching at once. A human rejecting the agent's pick starts it again. `POST /api/vaults/:id/agent/stop` stops it.
- If the vault expires with nothing bought, the sweeper refunds it (Step 10).

**Demo store** (`/demo-store`, used when `CHANNEL3_API_KEY` is empty or `DEMO_STORE=on`): one item per rule (price trap, used, 2.8 stars, 12-day delivery, unapproved merchant) plus a Sony at $59.99. `POST /demo-store/price-drop {"sku":"bb-sony","price":39.99}` drops its price so judges see watch mode buy it; `POST /demo-store/reset` restores it. `KERNEL_API_KEY` empty → the page is read with a plain HTTP fetch.

### 8.2 Bill-Pay Agent (`billpay.ts`, Vault B)

1. **Setup:** using the `city-utility` app, create and send a sandbox invoice to the platform account (`createInvoice` + `sendInvoice` from Step 4).
2. The agent reads invoices with the **PayPal Agent Toolkit** (`@paypal/agent-toolkit/ai-sdk`), logged in as the `city-utility` app, with only read actions on:
   ```ts
   new PayPalAgentToolkit({ clientId, clientSecret,
     configuration: { actions: { invoices: { list: true, get: true } }, context: { sandbox: true } } });
   ```
   The toolkit is built for AI SDK v4, so `toolkit.ts` adapts each tool to v5 (`parameters` → `inputSchema`) and trims PayPal's long replies.
3. The agent keeps open invoices (SENT / UNPAID / PARTIALLY_PAID) addressed to the platform, and calls `pay_invoice(invoice_id, merchant, amount, category)` → spend API → the engine re-checks the invoice with PayPal → `sendPayout` to `city-utility`.
4. After the payout succeeds, the backend calls `recordInvoicePayment` (Step 7), so PayPal shows the bill as paid → the `INVOICING.INVOICE.PAID` webhook arrives (Step 9).

### 8.3 No money-moving toolkit tools

Only read actions of the Agent Toolkit are turned on. Any action that moves money (`create_order`, `create_refund`, ...) stays off; money moves only through the spend API, so the rule "agents never hit PayPal payouts directly" holds for every tool.

---

## 9. Webhooks (`apps/api/src/webhooks.ts`)

Tool: **Express** route + **PayPal Webhooks API**. Webhooks are the fast path; the `sync` route (Step 5) stays as the fallback, and every handler is safe to run twice.

**Setup (once per public URL):**
1. Expose the API: **ngrok** or `npx cloudflared tunnel --url http://localhost:4000` locally, or the Render URL after Step 15.
2. `npm run setup:webhooks -w packages/paypal -- https://<public-api-url>` registers (or updates) one webhook per app and prints `PAYPAL_WEBHOOK_ID` and `UTILITY_WEBHOOK_ID` for `.env`:
   - platform app → `POST /webhooks/paypal` (funding, payouts, subscriptions)
   - city-utility app → `POST /webhooks/paypal/utility` (its invoices)

**Each delivery:**
1. Read the raw body (mounted before `express.json`) → `verifyWebhook(headers, rawBody, app)` with that app's credentials and webhook id. Anything not `SUCCESS` → `400`. Webhook id missing → `503`.
2. Store in `paypal_events` by event id. Already `processed` → return `duplicate`. If a handler throws, the event stays unprocessed and PayPal retries it.
3. Route by event type, then emit Socket.IO events:

| Event | Action |
| :--- | :--- |
| `CHECKOUT.ORDER.APPROVED` | Capture the order and credit the vault right away (`finishFunding`), no need to wait for the browser |
| `PAYMENT.CAPTURE.COMPLETED` | Confirm the `FUND` entry (`completeFunding`) and start the shopping agent's watch |
| `PAYMENT.CAPTURE.DENIED` | `failFunding()`: `FUND` entry → `FAILED` |
| `PAYMENT.PAYOUTS-ITEM.SUCCEEDED` | `onPayoutSucceeded()`: `SPEND` / `LIQUIDATE` → `COMPLETED`; a bill payment also marks the PayPal invoice paid |
| `PAYMENT.PAYOUTS-ITEM.FAILED` / `BLOCKED` / `RETURNED` / `REFUNDED` / `DENIED` / `CANCELED`, `PAYMENT.PAYOUTSBATCH.DENIED` | `onPayoutFailed()`: entry → `FAILED`, money back in the vault |
| `PAYMENT.PAYOUTSBATCH.SUCCESS` | Backstop: sync that vault's pending payouts |
| `BILLING.SUBSCRIPTION.ACTIVATED` | Link the subscription to the utility vault in its `custom_id` |
| `PAYMENT.SALE.COMPLETED` | `addFunding()`: monthly top-up into the utility vault |
| `BILLING.SUBSCRIPTION.CANCELLED` | Unlink it: no more top-ups |
| `INVOICING.INVOICE.PAID` / `CANCELLED` | Tell the dashboard the bill's final status |

Payouts are matched by `sender_item_id` / `sender_batch_id`, which are the ledger entry id (Step 4). Events that are not KubePay's (unknown order, payout, or subscription) are stored and ignored.

To test without real traffic, use the dashboard's **Webhooks Simulator**. Its sample events have made-up ids, so they are stored and ignored; real sandbox payments (fund a vault, run an agent) fire the real events.

---

## 10. Expiry Sweeper and Auto-Liquidation (`apps/api/src/services/sweeper.ts`)

Tool: the API's **1-minute background tick** (`scheduler.ts`), or a **Render Cron Job** running `apps/sweeper` (`* * * * *`, `npm run start -w apps/sweeper`). The cron script only calls `POST /api/jobs/tick` with `x-internal-key`, so the work stays in the API and its Socket.IO events reach the dashboard. Using the cron? Set `BACKGROUND_JOBS=off` on the API (running both is safe, just wasteful).

Each tick:
1. **Payouts:** re-send payouts that never got a batch id back (network error mid-call; safe, because the ledger entry id is the `PayPal-Request-Id`), then sync pending payouts (webhook backup).
2. **Never funded** (`PENDING_FUNDING`, past expiry): open `FUND` entries → `FAILED`, vault → `EXPIRED`. A late approval is then never captured.
3. **Expired with money** (`ACTIVE`, or `EXPIRED` after a failed refund): stop the shopping agent, then `startLiquidation()` → `payOutLiquidation()` to the vault owner's PayPal email, with a `LIQUIDATE` entry.
   - A payment still in flight → `PENDING_SPENDS` → try again next tick.
   - Zero balance → vault closed as `LIQUIDATED` straight away.
   - Refund failed 3 times → left for a human (`POST /api/vaults/:id/liquidate`).
   - `liquidation.auto_refund = false` → vault only marked `EXPIRED`.
4. When the refund payout succeeds (webhook or sync), the vault becomes `LIQUIDATED`.
5. **Watch mode:** run shopping agents whose `nextAgentRunAt` has come (Step 8).

Zapier alerts for expiry and refunds are added in Step 12.

---

## 11. Audit Search and Copilot (Elastic)

Tools: **Elastic Cloud** + `@elastic/elasticsearch` + **Claude**.

1. **Index** `kubepay-decisions`. Fields: vault_id, merchant, amount, category, result, reasons, a `reason_text` stored as `semantic_text` (Elastic inference does the embedding), and timestamp.
2. Write every decision and ledger event to this index (Step 7, Step 9).
3. **Anomaly check (Policy Engine check 9):** run a kNN search with the new request against the vault's past approved spends. A low similarity, or an amount far above the median, raises a `NEEDS_HUMAN` flag.
4. **Audit Copilot:** a dashboard chat box.
   - The user asks a question, for example *"Why was my headphone purchase blocked?"*
   - A hybrid search (BM25 + semantic) pulls the top decisions.
   - Claude answers from those results only, citing decision ids.

---

## 12. Notifications (Zapier)

Tool: **Zapier** → trigger **Webhooks by Zapier: Catch Hook** → actions **Slack: Send Channel Message** and **Gmail: Send Email**.

The backend POSTs to `ZAPIER_HOOK_URL` on `BLOCK`, `NEEDS_HUMAN`, `LIQUIDATED`, and payout failures. Send `{ event, vault, amount, reasons, dashboard_link }`.

---

## 13. Dashboard (`apps/web`)

Tools: **React + Vite**, **AG Grid**, **Bryntum Scheduler**, **PayPal JS SDK**, **Socket.IO client**.

| Screen / Component | Tool | Shows |
| :--- | :--- | :--- |
| Deploy Vault form | React + Claude (via API) | Text box → generated policy JSON preview → Confirm |
| Fund / Subscribe button | **PayPal JS SDK** (`@paypal/react-paypal-js`) | Sandbox checkout popup |
| Vaults grid | **AG Grid** | Name, type, budget, balance bar, status, expiry countdown |
| Live decision log | **AG Grid** (rows added through Socket.IO) | Approved/blocked rows colored green/red, reason codes |
| Ledger grid | **AG Grid** | Every FUND / SPEND / LIQUIDATE with its PayPal reference |
| Pending approvals | AG Grid + buttons | `NEEDS_HUMAN` items with Approve/Reject buttons |
| Vault timeline | **Bryntum Scheduler** | Each vault as a bar from creation to expiry, with spend events marked |
| Audit Copilot | Chat panel | Step 11 answers |

---

## 14. Testing

| What | Tool |
| :--- | :--- |
| Policy Engine rules (every reason code) | **node:test** unit tests (`npm test -w packages/policy`) |
| PayPal sandbox calls (token, order, capture, payout, invoice) | **Postman** collection in `postman/`, with a sandbox environment |
| KubePay API end-to-end (create → fund → spend → liquidate) | **Postman** collection runner |
| Payment failures (declined capture, failed payout) | `PayPal-Mock-Response` header, e.g. `{"mock_application_codes":"INSTRUMENT_DECLINED"}` |
| Webhook handling | PayPal Dashboard **Webhooks Simulator** + replaying the same event (should be ignored) |
| Double spend | Fire 2 `spend` calls in parallel; only one should pass when the balance covers just one |
| Money shown matches sandbox | Log in to `sandbox.paypal.com` as each account and compare balances with the ledger |

---

## 15. Deploy (Render)

| Service | Render type | Notes |
| :--- | :--- | :--- |
| `apps/api` | Web Service | Public URL used as PayPal webhook URL |
| `apps/web` | Static Site | Set `VITE_API_URL` and `VITE_PAYPAL_CLIENT_ID` |
| `apps/sweeper` | Cron Job (`* * * * *`) | Only `KUBEPAY_API_URL` (the API's Render URL) and `INTERNAL_API_KEY` (optional: the API already runs the tick itself) |
| Database | Render Postgres | Run `prisma migrate deploy` on build |

After deploying, update the webhook URL in the PayPal app to the Render API URL.

---

## 16. Demo Run (matches the pitch)

1. **Deploy Vault:** type *"Create a vault with $50 to buy noise-canceling headphones before Sunday, max spend $45."* → the policy JSON appears → Confirm → pay with the PayPal sandbox button → vault is ACTIVE.
2. **Guardrail test:** the agent tries a $48 item → `MAX_LIMIT_EXCEEDED` → red row in AG Grid + Slack alert.
3. **Valid purchase:** Channel3 finds a $39.99 item → Kernel verifies the price → payout to `audio-store` → green row, balance $10.01.
4. **Bill pay:** `city-utility` sends an invoice → the bill-pay agent pays it → invoice marked paid.
5. **Liquidation:** expire the vault (or click Liquidate) → $10.01 is paid out back to `user` → status LIQUIDATED, Bryntum bar closes.
6. **Proof:** open `sandbox.paypal.com` as `user` and show the refund.
7. **Copilot:** ask *"Why was the first purchase blocked?"*

---

## 17. Team Split (3 Members)

Do this **together first**: agree on the DB schema (Step 3.3), the `SpendRequest` / policy JSON shapes (Steps 6–7), and the API routes (Step 5). After that, each person can work alone.

### Member 1: Payments & Backend
- Step 2: PayPal sandbox accounts, apps, features, webhooks
- Step 3: repo, Prisma schema, ledger logic, row locking
- Step 4: PayPal service layer, APIMatic SDK generation
- Step 5: vault lifecycle API (fund, subscribe, spend, liquidate)
- Step 9: webhooks
- Step 10: expiry sweeper
- Step 15: Render deployment

### Member 2: AI & Agents
- Step 6: Policy Compiler (Claude + Zod)
- Step 7: Policy Engine + node:test tests
- Step 8: shopping agent (Channel3, Kernel) and bill-pay agent (PayPal Agent Toolkit, invoices)
- Step 8.3: policy wrapper for toolkit tools
- Step 11: Elastic index, anomaly check, Audit Copilot

### Member 3: Frontend, Integrations & Demo
- Step 13: React dashboard, AG Grid grids, Bryntum timeline, PayPal JS SDK buttons, Socket.IO live feed
- Step 12: Zapier alerts
- Step 14: Postman collections, negative testing, end-to-end checks
- Step 16: demo script, video, and Devpost submission

**Handoffs:**
- Member 1 gives Member 2 the `/spend` route and Member 3 the GET routes plus socket events.
- Member 2 gives Member 1 the `evaluate(request)` function and Member 3 the `/api/vaults` compile response.
- Member 3 reports bugs found during testing to whoever owns that step.
