import { CheckoutPaymentIntent } from '@paypal/paypal-server-sdk';
import { paypalSdk } from './sdk.ts';
import { centsToValue, CURRENCY, valueToCents } from './money.ts';

// Orders API v2: the user funds a vault through the PayPal button.

/** POST /v2/checkout/orders. The order id goes back to the JS SDK button. */
export async function createOrder(input: {
  vaultId: string;
  amountCents: number;
  description: string;
  requestId?: string;
  mockResponse?: string;
}) {
  const result = await paypalSdk((c) => c.orders.createOrder({
    paypalRequestId: input.requestId,
    paypalMockResponse: input.mockResponse,
    body: {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          customId: input.vaultId,
          description: input.description,
          amount: { currencyCode: CURRENCY, value: centsToValue(input.amountCents) },
        },
      ],
    },
  }));
  return {
    orderId: result.id!,
    status: result.status!,
    approveUrl: result.links?.find((l) => l.rel === 'approve' || l.rel === 'payer-action')?.href,
  };
}

/** POST /v2/checkout/orders/{id}/capture. Call after the user approves in the popup. */
export async function captureOrder(orderId: string, opts: { requestId?: string; mockResponse?: string } = {}) {
  const result = await paypalSdk((c) => c.orders.captureOrder({
    id: orderId,
    paypalRequestId: opts.requestId ?? `capture-${orderId}`,
    paypalMockResponse: opts.mockResponse,
  }));
  const capture = result.purchaseUnits?.[0]?.payments?.captures?.[0];
  return {
    orderId: result.id!,
    status: result.status!,
    captureId: capture?.id,
    captureStatus: capture?.status,
    amountCents: capture?.amount?.value ? valueToCents(capture.amount.value) : 0,
    vaultId: capture?.customId,
  };
}

/** GET /v2/checkout/orders/{id} */
export async function getOrder(orderId: string) {
  const result = await paypalSdk((c) => c.orders.getOrder({ id: orderId }));
  return result;
}

/**
 * POST /v2/checkout/orders paid with a customer's saved PayPal account (Vault API payment token):
 * no popup, usually captured in the same call. custom_id = vault id, like the button flow. The
 * request id makes a retry return the same order instead of paying twice, so give each payment its own.
 */
export async function chargeSavedPayPal(input: {
  paymentTokenId: string;
  vaultId: string;
  amountCents: number;
  description: string;
  requestId?: string;
}) {
  const result = await paypalSdk((c) => c.orders.createOrder({
    paypalRequestId: input.requestId ?? `fund-saved-${input.vaultId}`,
    body: {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          customId: input.vaultId,
          description: input.description.slice(0, 127),
          amount: { currencyCode: CURRENCY, value: centsToValue(input.amountCents) },
        },
      ],
      paymentSource: { paypal: { vaultId: input.paymentTokenId } },
    },
  }));
  const capture = result.purchaseUnits?.[0]?.payments?.captures?.[0];
  return { orderId: result.id!, status: result.status!, captureStatus: capture?.status as string | undefined };
}
