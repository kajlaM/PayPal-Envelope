import { platformCredentials } from './config.ts';
import { paypalRequest } from './http.ts';
import { centsToValue, CURRENCY } from './money.ts';

// Paying a merchant with PayPal Checkout (Orders API v2) instead of Payouts.
// The vault still pays by itself: the money is in the KubePay platform account, and the platform
// pays the merchant from its own saved PayPal account (Vault API payment token, made once with
// `npm run setup:checkout -w apps/api`). No popup, and each purchase is a real PayPal
// purchase (merchant = payee), so it gets PayPal buyer protection, a receipt and a refund button.

/** POST /v3/vault/setup-tokens: the page where the platform account approves being saved (once). */
export async function startPlatformCheckoutLink(urls: { returnUrl: string; cancelUrl: string }) {
  const body = await paypalRequest(platformCredentials(), 'POST', '/v3/vault/setup-tokens', {
    body: {
      payment_source: {
        paypal: {
          usage_type: 'MERCHANT',
          customer_type: 'CONSUMER',
          description: 'KubePay platform: pay shops for vault purchases',
          experience_context: {
            brand_name: 'KubePay',
            shipping_preference: 'NO_SHIPPING',
            return_url: urls.returnUrl,
            cancel_url: urls.cancelUrl,
          },
        },
      },
    },
  });
  const approveUrl: string | undefined = body.links?.find((l: any) => l.rel === 'approve')?.href;
  if (!approveUrl) throw new Error('PayPal did not return an approval link');
  return { setupTokenId: body.id as string, approveUrl };
}

/** GET /v3/vault/setup-tokens/{id}: "APPROVED" once the account approved it. */
export async function getSetupTokenStatus(setupTokenId: string): Promise<string> {
  const body = await paypalRequest(platformCredentials(), 'GET', `/v3/vault/setup-tokens/${setupTokenId}`);
  return body.status as string;
}

/** POST /v3/vault/payment-tokens: the approved setup token becomes a saved PayPal account. */
export async function finishPlatformCheckoutLink(setupTokenId: string) {
  const token = await paypalRequest(platformCredentials(), 'POST', '/v3/vault/payment-tokens', {
    requestId: `platform-link-${setupTokenId}`,
    body: { payment_source: { token: { id: setupTokenId, type: 'SETUP_TOKEN' } } },
  });
  return {
    paymentTokenId: token.id as string,
    customerId: (token.customer?.id as string | undefined) ?? '',
    email: (token.payment_source?.paypal?.email_address as string | undefined) ?? '',
  };
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
  const body = await paypalRequest(platformCredentials(), 'POST', '/v2/checkout/orders', {
    requestId: `spend-${input.ledgerEntryId}`,
    body: {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: input.ledgerEntryId,
          custom_id: input.ledgerEntryId,
          invoice_id: input.ledgerEntryId,
          description: input.description.slice(0, 127),
          payee: { email_address: input.merchantEmail },
          amount: { currency_code: CURRENCY, value, breakdown: { item_total: { currency_code: CURRENCY, value } } },
          items: [
            {
              name: input.itemName.slice(0, 127),
              quantity: '1',
              unit_amount: { currency_code: CURRENCY, value },
              ...(input.productUrl && input.productUrl.length <= 2048 ? { url: input.productUrl } : {}),
            },
          ],
        },
      ],
      payment_source: { paypal: { vault_id: input.paymentTokenId } },
    },
  });
  const capture = body.purchase_units?.[0]?.payments?.captures?.[0];
  return { orderId: body.id, orderStatus: body.status, captureId: capture?.id, captureStatus: capture?.status };
}

/** GET /v2/payments/captures/{id}: settles a Checkout purchase that was still PENDING. */
export async function getCapture(captureId: string) {
  const body = await paypalRequest(platformCredentials(), 'GET', `/v2/payments/captures/${captureId}`);
  return { captureId: body.id as string, status: body.status as string, ledgerEntryId: body.custom_id as string | undefined };
}
