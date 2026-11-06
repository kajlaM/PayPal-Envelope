import { CheckoutPaymentIntent } from '@paypal/paypal-server-sdk';
import { centsToValue, CURRENCY } from './money.ts';
import { paypalSdk } from './sdk.ts';
import { createPayPalSetupToken, createPaymentToken } from './vault.ts';

// Paying a merchant with PayPal Checkout (Orders API v2) instead of Payouts.
// The vault still pays by itself: the money is in the PayPalVault platform account, and the platform
// pays the merchant from its own saved PayPal account (Vault API payment token, made once with
// `npm run setup:checkout -w apps/api`). No popup, and each purchase is a real PayPal
// purchase (merchant = payee), so it gets PayPal buyer protection, a receipt and a refund button.

/** The page where the platform account approves being saved (once). Vault API, through the SDK. */
export function startPlatformCheckoutLink(urls: { returnUrl: string; cancelUrl: string }) {
  return createPayPalSetupToken({ description: 'PayPalVault platform: pay shops for vault purchases', ...urls });
}

/** The approved setup token becomes the platform's saved PayPal account. */
export function finishPlatformCheckoutLink(setupTokenId: string) {
  return createPaymentToken(setupTokenId, `platform-link-${setupTokenId}`);
}

export type CheckoutPayment = {
  orderId: string;
  orderStatus: string;
  captureId?: string;
  captureStatus?: string; // COMPLETED, PENDING, DECLINED, FAILED
};

/**
 * POST /v2/checkout/orders paid from the platform's saved PayPal account, payee = the merchant.
 * Usually captured in the same call. `ledgerEntryId` is the PayPal-Request-Id, custom_id and
 * invoice_id, so a retry returns the same order and the same purchase can never be paid twice.
 */
export async function payMerchantWithCheckout(input: {
  ledgerEntryId: string;
  paymentTokenId: string;
  merchantEmail: string;
  amountCents: number;
  itemName: string;
  description: string;
  productUrl?: string;
}): Promise<CheckoutPayment> {
  const value = centsToValue(input.amountCents);
  const result = await paypalSdk((c) => c.orders.createOrder({
    paypalRequestId: `spend-${input.ledgerEntryId}`,
    body: {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          referenceId: input.ledgerEntryId,
          customId: input.ledgerEntryId,
          invoiceId: input.ledgerEntryId,
          description: input.description.slice(0, 127),
          payee: { emailAddress: input.merchantEmail },
          amount: { currencyCode: CURRENCY, value, breakdown: { itemTotal: { currencyCode: CURRENCY, value } } },
          items: [
            {
              name: input.itemName.slice(0, 127),
              quantity: '1',
              unitAmount: { currencyCode: CURRENCY, value },
              ...(input.productUrl && input.productUrl.length <= 2048 ? { url: input.productUrl } : {}),
            },
          ],
        },
      ],
      paymentSource: { paypal: { vaultId: input.paymentTokenId } },
    },
  }));
  const capture = result.purchaseUnits?.[0]?.payments?.captures?.[0];
  return { orderId: result.id!, orderStatus: String(result.status), captureId: capture?.id, captureStatus: capture?.status };
}

/** GET /v2/payments/captures/{id}: settles a Checkout purchase that was still PENDING. */
export async function getCapture(captureId: string) {
  const result = await paypalSdk((c) => c.payments.getCapturedPayment({ captureId }));
  return { captureId: result.id!, status: String(result.status), ledgerEntryId: result.customId };
}

/**
 * GET /v2/payments/captures/{id} with what a check against PayPal needs: status (COMPLETED,
 * REFUNDED, ...), amount, custom_id (the ledger entry) and the order it belongs to (for the payee).
 */
export async function getCaptureDetails(captureId: string) {
  const result = await paypalSdk((c) => c.payments.getCapturedPayment({ captureId }));
  const up = result.links?.find((l) => l.rel === 'up')?.href ?? '';
  return {
    captureId: result.id!,
    status: String(result.status),
    amountCents: result.amount?.value ? Math.round(Number(result.amount.value) * 100) : 0,
    customId: result.customId,
    orderId: up.match(/\/orders\/([^/?]+)/)?.[1],
    updatedAt: result.updateTime,
  };
}
