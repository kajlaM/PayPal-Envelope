import {
  ExperienceContextShippingPreference, PaypalPaymentTokenCustomerType, PaypalPaymentTokenUsageType, VaultTokenRequestType,
} from '@paypal/paypal-server-sdk';
import { paypalSdk } from './sdk.ts';

// Vault API v3 through the PayPal Server SDK: saving a PayPal account so it can be charged later
// without a popup. Used for the platform account (pays shops) and for customers (fund vaults).

/** POST /v3/vault/setup-tokens: the PayPal page where the account owner approves being saved. */
export async function createPayPalSetupToken(input: {
  description: string;
  returnUrl: string;
  cancelUrl: string;
  permitMultiplePaymentTokens?: boolean;
}) {
  const result = await paypalSdk((c) => c.vault.createSetupToken({
    body: {
      paymentSource: {
        paypal: {
          usageType: PaypalPaymentTokenUsageType.Merchant,
          customerType: PaypalPaymentTokenCustomerType.Consumer,
          ...(input.permitMultiplePaymentTokens ? { permitMultiplePaymentTokens: true } : {}),
          description: input.description,
          experienceContext: {
            brandName: 'PayPalVault',
            shippingPreference: ExperienceContextShippingPreference.NoShipping,
            returnUrl: input.returnUrl,
            cancelUrl: input.cancelUrl,
          },
        },
      },
    },
  }));
  const approveUrl = result.links?.find((l) => l.rel === 'approve')?.href;
  if (!approveUrl) throw new Error('PayPal did not return an approval link');
  return { setupTokenId: result.id!, approveUrl };
}

/** GET /v3/vault/setup-tokens/{id}: "APPROVED" once the owner approved it. */
export async function getSetupTokenStatus(setupTokenId: string): Promise<string> {
  const result = await paypalSdk((c) => c.vault.getSetupToken(setupTokenId));
  return String(result.status ?? '');
}

/**
 * POST /v3/vault/payment-tokens: the approved setup token becomes a saved PayPal account.
 * `requestId` makes a retry return the same token instead of saving the account twice.
 */
export async function createPaymentToken(setupTokenId: string, requestId: string) {
  const result = await paypalSdk((c) => c.vault.createPaymentToken({
    paypalRequestId: requestId,
    body: { paymentSource: { token: { id: setupTokenId, type: VaultTokenRequestType.SetupToken } } },
  }));
  return {
    paymentTokenId: result.id!,
    customerId: result.customer?.id ?? '',
    email: result.paymentSource?.paypal?.emailAddress ?? '',
  };
}

/** DELETE /v3/vault/payment-tokens/{id}: forgets a saved PayPal account. */
export async function deletePaymentToken(paymentTokenId: string) {
  await paypalSdk(async (c) => ({ result: (await c.vault.deletePaymentToken(paymentTokenId)).result }));
}
