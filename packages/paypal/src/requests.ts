import { platformCredentials } from './config.ts';
import { paypalRequest } from './http.ts';
import { money, valueToCents } from './money.ts';

// "Ask a friend" (Invoicing API v2, called as the KubePay platform account).
// The platform sends a PayPal money request to the friend's PayPal email. The friend pays it on
// PayPal, the money lands in the platform account, and the ledger credits the vault named in
// `detail.reference`. So the money never passes through the vault owner's own PayPal.

export type MoneyRequest = {
  invoiceId: string;
  status: string; // DRAFT, SENT, PAID, MARKED_AS_PAID, CANCELLED, ...
  amountCents: number;
  paidCents: number;
  payUrl?: string; // the PayPal page where the friend pays
  vaultId?: string;
};

const PAID = ['PAID', 'MARKED_AS_PAID'];
export const isRequestPaid = (r: Pick<MoneyRequest, 'status'>) => PAID.includes(r.status);
export const isRequestClosed = (r: Pick<MoneyRequest, 'status'>) => ['CANCELLED', 'REFUNDED', 'MARKED_AS_REFUNDED'].includes(r.status);

function toRequest(raw: any): MoneyRequest {
  return {
    invoiceId: raw.id,
    status: raw.status,
    amountCents: raw.amount?.value ? valueToCents(raw.amount.value) : 0,
    paidCents: raw.payments?.paid_amount?.value ? valueToCents(raw.payments.paid_amount.value) : 0,
    payUrl: raw.detail?.metadata?.recipient_view_url,
    vaultId: raw.detail?.reference,
  };
}

/** POST /v2/invoicing/invoices + /send: a money request for the whole amount (no partial payments). */
export async function requestMoney(input: {
  vaultId: string;
  payerEmail: string;
  amountCents: number;
  itemName: string;
  note?: string;
  requestId?: string;
}): Promise<MoneyRequest> {
  const platformEmail = process.env.PLATFORM_SANDBOX_EMAIL?.trim();
  const draft = await paypalRequest(platformCredentials(), 'POST', '/v2/invoicing/invoices', {
    requestId: input.requestId,
    body: {
      detail: {
        currency_code: 'USD',
        reference: input.vaultId,
        note: input.note?.slice(0, 4000),
        memo: `KubePay vault ${input.vaultId}`,
      },
      ...(platformEmail ? { invoicer: { email_address: platformEmail } } : {}),
      primary_recipients: [{ billing_info: { email_address: input.payerEmail } }],
      items: [{ name: input.itemName.slice(0, 200), quantity: '1', unit_amount: money(input.amountCents) }],
      configuration: { allow_tip: false, partial_payment: { allow_partial_payment: false } },
    },
  });
  const invoiceId: string = draft.id ?? String(draft.href).split('/').pop();
  await paypalRequest(platformCredentials(), 'POST', `/v2/invoicing/invoices/${invoiceId}/send`, {
    requestId: `send-${invoiceId}`,
    body: { send_to_recipient: true, send_to_invoicer: false },
  });
  return getMoneyRequest(invoiceId);
}

/** GET /v2/invoicing/invoices/{id} */
export async function getMoneyRequest(invoiceId: string): Promise<MoneyRequest> {
  return toRequest(await paypalRequest(platformCredentials(), 'GET', `/v2/invoicing/invoices/${invoiceId}`));
}

/** POST /v2/invoicing/invoices/{id}/cancel: the friend can no longer pay it. */
export async function cancelMoneyRequest(invoiceId: string, note = 'This request was cancelled.') {
  await paypalRequest(platformCredentials(), 'POST', `/v2/invoicing/invoices/${invoiceId}/cancel`, {
    requestId: `cancel-${invoiceId}`,
    body: { subject: 'Money request cancelled', note, send_to_invoicer: false, send_to_recipient: true },
  });
}
