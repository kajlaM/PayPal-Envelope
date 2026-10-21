import { CheckoutPaymentIntent } from '@paypal/paypal-server-sdk';
import { sdk } from './sdk.ts';
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
  const { result } = await sdk().orders.createOrder({
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
  });
  return {
    orderId: result.id!,
    status: result.status!,
    approveUrl: result.links?.find((l) => l.rel === 'approve' || l.rel === 'payer-action')?.href,
  };
}

/** POST /v2/checkout/orders/{id}/capture. Call after the user approves in the popup. */
export async function captureOrder(orderId: string, opts: { requestId?: string; mockResponse?: string } = {}) {
  const { result } = await sdk().orders.captureOrder({
    id: orderId,
    paypalRequestId: opts.requestId ?? `capture-${orderId}`,
    paypalMockResponse: opts.mockResponse,
  });
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
  const { result } = await sdk().orders.getOrder({ id: orderId });
  return result;
}
