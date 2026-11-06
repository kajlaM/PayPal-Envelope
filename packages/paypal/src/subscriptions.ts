import { IntervalUnit, PlanRequestStatus, TenureType } from '@paypal/paypal-server-sdk';
import { platformCredentials } from './config.ts';
import { paypalRequest } from './http.ts';
import { centsToValue, CURRENCY } from './money.ts';
import { paypalSdk } from './sdk.ts';

// Subscriptions API: monthly auto top-up of the utility vault.
// One-time setup: createProduct() then createMonthlyPlan() (see scripts/setup-plan.ts).
// The user subscribes with the JS SDK button (vault=true&intent=subscription, custom_id = vaultId).

/** POST /v1/catalogs/products (not in the Server SDK). */
export async function createProduct(name: string, description: string) {
  const body = await paypalRequest(platformCredentials(), 'POST', '/v1/catalogs/products', {
    body: { name, description, type: 'SERVICE', category: 'SOFTWARE' },
  });
  return { productId: body.id as string };
}

/** POST /v1/billing/plans: a fixed monthly amount, billed until cancelled. */
export async function createMonthlyPlan(input: { productId: string; name: string; amountCents: number }) {
  const result = await paypalSdk((c) => c.subscriptions.createBillingPlan({
    body: {
      productId: input.productId,
      name: input.name,
      status: PlanRequestStatus.Active,
      billingCycles: [
        {
          frequency: { intervalUnit: IntervalUnit.Month, intervalCount: 1 },
          tenureType: TenureType.Regular,
          sequence: 1,
          totalCycles: 0,
          pricingScheme: { fixedPrice: { currencyCode: CURRENCY, value: centsToValue(input.amountCents) } },
        },
      ],
      paymentPreferences: { autoBillOutstanding: true, paymentFailureThreshold: 1 },
    },
  }));
  return { planId: result.id!, status: result.status };
}

/** GET /v1/billing/subscriptions/{id} */
export async function getSubscription(subscriptionId: string) {
  const result = await paypalSdk((c) => c.subscriptions.getSubscription({ id: subscriptionId }));
  return {
    subscriptionId: result.id!,
    status: result.status,
    planId: result.planId,
    vaultId: result.customId,
  };
}

/** POST /v1/billing/subscriptions/{id}/cancel. Use when a utility vault is torn down. */
export async function cancelSubscription(subscriptionId: string, reason: string) {
  await paypalSdk((c) => c.subscriptions.cancelSubscription({ id: subscriptionId, body: { reason } }));
}
