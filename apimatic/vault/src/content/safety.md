---
title: How money moves safely
---

PayPalVault gives one AI shopping agent a small, rule-bound PayPal budget, a *vault*, instead of
access to a PayPal account. These rules are part of the API itself:

| Rule | How the API enforces it |
|---|---|
| Only PayPalVault calls this API | It is never exposed. The PayPalVault site forwards only what it needs; there are no outside agents, tools or public keys. |
| The agent can only **ask** to buy | Its only purchase operation is `requestPurchase` (`POST /api/vaults/{id}/spend`). It has no operation that pays anyone. |
| The Policy Engine decides | Every request is checked against the vault's rules: budget, shops, categories, per-payment and daily limits, live price. |
| The owner decides when the rules say so | A purchase above the approval limit waits (`202`) until the owner approves it with their password. |
| Money only moves through PayPal | Funding: Orders API. Purchases: PayPal Checkout or Payouts. Refunds: Payouts. All in the PayPal sandbox. |
| Internal operations need the internal key | `x-internal-key`, held only by PayPalVault's own site, agent and background jobs. |
