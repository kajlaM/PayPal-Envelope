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
| **PayPal Server SDK** (`@paypal/paypal-server-sdk`) | Typed client for Orders | 4 |
| **APIMatic** | Generates a typed SDK for Payouts, Subscriptions, and Invoicing from PayPal's OpenAPI specs. The Context Plugin gives your IDE AI PayPal docs. | 4 |
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
6. **Webhooks** (inside the platform app): add your public URL `https://<render-api>/webhooks/paypal`. Subscribe to these events:
   - `CHECKOUT.ORDER.APPROVED`, `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.PAYOUTSBATCH.SUCCESS`, `PAYMENT.PAYOUTSBATCH.DENIED`, `PAYMENT.PAYOUTS-ITEM.SUCCEEDED`, `PAYMENT.PAYOUTS-ITEM.FAILED`
   - `BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.CANCELLED`, `PAYMENT.SALE.COMPLETED`
   - `INVOICING.INVOICE.PAID`
   - Copy the **Webhook ID**. You need it to verify signatures.
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
│   └── sweeper/        # Cron job: expiry + liquidation
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

| Function | PayPal endpoint | Tool |
| :--- | :--- | :--- |
| `getAccessToken()` | `POST /v1/oauth2/token` (cache the token until it expires) | axios |
| `createOrder(amount, vaultId)` | `POST /v2/checkout/orders` (intent `CAPTURE`, `custom_id` = vaultId) | PayPal Server SDK |
| `captureOrder(orderId)` | `POST /v2/checkout/orders/{id}/capture` | PayPal Server SDK |
| `sendPayout(email, amount, note, senderBatchId)` | `POST /v1/payments/payouts` | APIMatic SDK |
| `getPayout(batchId)` | `GET /v1/payments/payouts/{id}` | APIMatic SDK |
| `createProduct()` / `createPlan()` | `POST /v1/catalogs/products`, `POST /v1/billing/plans` | APIMatic SDK |
| `getSubscription(id)` | `GET /v1/billing/subscriptions/{id}` | APIMatic SDK |
| `listInvoices()` / `getInvoice(id)` | `GET /v2/invoicing/invoices` | APIMatic SDK |
| `recordInvoicePayment(id)` | `POST /v2/invoicing/invoices/{id}/payments` (utility app credentials) | APIMatic SDK |
| `verifyWebhook(headers, body)` | `POST /v1/notifications/verify-webhook-signature` | axios |

How to generate the APIMatic SDK:
1. Download the specs from GitHub `paypal/paypal-rest-api-specifications` (payouts, subscriptions, invoicing).
2. Import them into **APIMatic** and generate a **TypeScript SDK** into `packages/paypal/generated`.

Rules for every POST:
- Send a unique `PayPal-Request-Id` header (idempotency), so a retry never double-pays.
- For Payouts, `sender_batch_id` = our ledger entry id.

Dev helper: add the **PayPal MCP server** to your AI coding assistant (`npx -y @paypal/mcp --tools=all` with `PAYPAL_ENVIRONMENT=SANDBOX`). You can then check sandbox orders and payouts while building. Also install the **APIMatic Context Plugin** so the assistant has PayPal API context.

---

## 5. Vault Lifecycle API (`apps/api`)

Tool: **Express** routes that call `packages/paypal` + `packages/policy`.

| Route | What it does |
| :--- | :--- |
| `POST /api/vaults` | Takes `{ text }` or `{ policy }`. Runs the Policy Compiler (Step 6) and saves the vault as `PENDING_FUNDING`. |
| `POST /api/vaults/:id/fund/order` | Calls `createOrder` for the vault budget and returns the `orderId` to the PayPal button. |
| `POST /api/vaults/:id/fund/capture` | Calls `captureOrder`, writes a `FUND` ledger entry, and sets status to `ACTIVE`. |
| `POST /api/vaults/:id/subscribe` | Utility vault only. Returns the `plan_id` for the PayPal subscription button. |
| `POST /api/vaults/:id/spend` | **Internal only, called by agents.** Runs the Policy Engine (Step 7). If approved, it reserves the funds and calls `sendPayout` to the merchant. |
| `POST /api/vaults/:id/approve/:decisionId` | A human approves a `NEEDS_HUMAN` decision from the dashboard. |
| `POST /api/vaults/:id/liquidate` | Manual teardown. It does the same thing as Step 10. |
| `GET /api/vaults`, `/ledger`, `/decisions` | Data for AG Grid. |

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

## 6. Policy Compiler: Plain English to JSON (`packages/policy/compiler`)

Tool: **Claude API** (`claude-sonnet-5-5`) with **tool use / structured output** + **Zod**.

1. Define the policy with a Zod schema (based on the example in `kubepay_ai_readme.md`):
   `allocated_budget`, `max_single_transaction`, `allowed_categories[]`, `approved_merchants[]`, `expiry_timestamp`, `max_transactions_per_day`, `human_approval_above`, `on_policy_violation`.
2. Convert the Zod schema to JSON Schema (`zod-to-json-schema`) and give it to Claude as the only tool. Claude must return arguments that match it.
3. Validate the output with Zod. If it fails, send the errors back to Claude once to retry.
4. Normalize the output in code: convert dates to UTC, match merchant names against the `merchants` table, and reject any budget above the requested amount.
5. Show the JSON to the user in the dashboard. **The user confirms before saving.**

The LLM only *writes* the policy. It never *decides* whether a payment goes through.

---

## 7. Policy Engine: The Guardrail (`packages/policy/engine`)

Tool: **plain TypeScript functions** (deterministic, unit-tested with **Vitest**).

Input: a `SpendRequest` = `{ vault_id, merchant, amount, category, product_url, verified_price, reason }`.

The engine runs these checks in order. The first hard failure means `BLOCK`.

| # | Check | Fails with |
| :--- | :--- | :--- |
| 1 | Vault is `ACTIVE` and not expired | `VAULT_INACTIVE` / `VAULT_EXPIRED` |
| 2 | `amount <= max_single_transaction` | `MAX_LIMIT_EXCEEDED` |
| 3 | `amount <= vault.balance` | `INSUFFICIENT_VAULT_BALANCE` |
| 4 | Merchant is in `approved_merchants` | `MERCHANT_NOT_APPROVED` |
| 5 | Category is in `allowed_categories` | `CATEGORY_NOT_ALLOWED` |
| 6 | Number of transactions today is under the limit | `DAILY_LIMIT_REACHED` |
| 7 | `amount == verified_price` (Kernel check, Step 8) | `PRICE_MISMATCH` |
| 8 | Utility vault: amount matches the open invoice total | `INVOICE_MISMATCH` |
| 9 | Elastic anomaly score is below the threshold (Step 11) | soft flag → `NEEDS_HUMAN` |
| 10 | `amount > human_approval_above` | `NEEDS_HUMAN` |

Output: `{ result, reasons[] }`. Every result is saved to `decisions` and indexed in Elastic. Blocks go to Zapier. All results go to the dashboard over Socket.IO.

---

## 8. AI Agents (`packages/agents`)

Tools: **Vercel AI SDK** (`generateText` with `tools`, `maxSteps`) + **Claude** (`claude-sonnet-5-5`).
Each agent runs **inside one vault** and only knows that vault's id.

### 8.1 Shopping Agent (Vault A)

| Agent tool | Calls | Purpose |
| :--- | :--- | :--- |
| `search_products(query, max_price)` | **Channel3 API** | Returns structured products with price, merchant, and URL. No scraping. |
| `verify_listing(product_url)` | **Kernel** cloud browser | `kernel.browsers.create()` → Playwright `chromium.connectOverCDP(cdp_ws_url)` → opens the page and reads the live price and seller. This stops vendor overcharging. |
| `request_purchase(...)` | `POST /api/vaults/:id/spend` | The **only** way to spend. It goes through the Policy Engine. |

Loop: search → pick the best item under the limit → verify → request purchase.
- If the purchase is blocked, the agent receives the reason codes and may try a cheaper item.

### 8.2 Bill-Pay Agent (Vault B)

1. **Setup:** using the `city-utility` app, a script creates and sends a sandbox invoice to `kubepay-platform`.
2. The agent uses the **PayPal Agent Toolkit** to read invoices:
   ```ts
   import { PayPalAgentToolkit } from '@paypal/agent-toolkit/ai-sdk';
   const toolkit = new PayPalAgentToolkit({
     clientId, clientSecret,
     configuration: { actions: { invoices: { list: true, get: true } }, context: { sandbox: true } }
   });
   ```
   Turn on only read actions. Check the package README for exact action names.
3. The agent calls `request_purchase` with the invoice id and amount → the engine checks `INVOICE_MISMATCH` → `sendPayout` to `city-utility`.
4. After the payout succeeds, the backend calls `recordInvoicePayment` (utility app) → the `INVOICING.INVOICE.PAID` webhook arrives.

### 8.3 Policy wrapper for Agent Toolkit tools

If any Agent Toolkit tool that moves money is ever enabled (for example `create_order` or `create_refund`), wrap its `execute` function. The wrapper first sends the request through the Policy Engine, and throws `POLICY_BLOCKED` if the engine does not approve.
This keeps the rule "agents never hit PayPal directly" true for every tool.

---

## 9. Webhooks (`apps/api/webhooks`)

Tool: **Express** route + **PayPal Webhooks API**.

1. `POST /webhooks/paypal` → call `verifyWebhook` (needs `PAYPAL_WEBHOOK_ID`). Reject anything that is not `SUCCESS`.
2. Insert into `paypal_events` using the event id as a unique key. If the event is a duplicate, skip it.
3. Route by event type:

| Event | Action |
| :--- | :--- |
| `PAYMENT.CAPTURE.COMPLETED` | Confirm `FUND` entry |
| `PAYMENT.SALE.COMPLETED` | Add `FUND` entry for subscription top-up |
| `PAYMENT.PAYOUTS-ITEM.SUCCEEDED` | `completeOutflow()`: `SPEND` / `LIQUIDATE` → `COMPLETED` |
| `PAYMENT.PAYOUTS-ITEM.FAILED` / `PAYOUTSBATCH.DENIED` | `failOutflow()`: money back to vault, alert |
| `BILLING.SUBSCRIPTION.CANCELLED` | Stop top-ups |
| `INVOICING.INVOICE.PAID` | Mark invoice closed |

4. Emit a Socket.IO event after every change.

For local development, expose the API with **ngrok** and use it as the webhook URL. Fire test events with the dashboard's **Webhooks Simulator**.

---

## 10. Expiry Sweeper and Auto-Liquidation (`apps/sweeper`)

Tool: **Render Cron Job** (every 1 minute) running a Node script.

1. Find vaults where `status = ACTIVE AND expires_at < now()`.
2. If a `SPEND` is still `PENDING`, `startLiquidation()` throws `PENDING_SPENDS`; skip the vault until the next run.
3. Set status to `EXPIRED`. If balance > 0, call `sendPayout(USER_SANDBOX_EMAIL, balance, "KubePay vault refund")` and write a `LIQUIDATE` entry.
4. When the payout webhook succeeds, set status to `LIQUIDATED`. Notify Zapier and the dashboard.

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
| Policy Engine rules (every reason code) | **Vitest** unit tests |
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
| `apps/sweeper` | Cron Job (`* * * * *`) | Same env vars as API |
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
- Step 7: Policy Engine + Vitest tests
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
