---
title: Purchases and the Policy Engine
---

1. PayPalVault's agent finds a product (Channel3 product data: stores compared, 90-day price).
2. It calls `requestPurchase` with the shop, amount, category and product link.
3. The Policy Engine answers:
   - **200 APPROVE**: within every rule. The platform pays the shop with PayPal Checkout (or Payouts).
   - **202 NEEDS_HUMAN**: the rules ask the owner first. Nothing is paid until the owner approves.
   - **403 BLOCK**: against a rule (with the reason codes).
4. In an "Ask me" vault the agent calls `proposeOptions` instead; the owner picks one, and the pick
   goes through the Policy Engine like any other purchase.
