---
title: Verified by PayPal
---

All vault money sits in one PayPal account (the platform's); the split into vaults exists only in
PayPalVault's ledger. `verifyVault` asks PayPal about every ledger entry and compares amount, status
and who was paid:

| Entry | Asked at PayPal |
|---|---|
| Vault funding | Orders API: capture status, amount, payer |
| Friend's money request | Invoicing API: paid amount |
| Purchase via Checkout | Payments API and its order: status, amount, payee (the shop) |
| Purchase via Payouts, refunds | Payouts API: item status, amount, receiver |

Each entry is labelled `VERIFIED`, `WAITING` (still processing at PayPal), `MISMATCH` (PayPal says
something different) or `UNCHECKED`. It runs every night and on demand. It **only reads** from PayPal:
it never moves money and never changes the ledger. A mismatch is shown and emailed; fixing it stays a
human decision.
