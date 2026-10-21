import { utilityCredentials } from './config.ts';
import { paypalRequest } from './http.ts';
import { money, valueToCents } from './money.ts';

// Invoicing API v2, called as the city-utility merchant.
// The utility sends a bill to the KubePay platform; the bill-pay agent reads it;
// after our payout succeeds, the utility marks it paid.

export type Invoice = {
  id: string;
  status: string; // DRAFT, SENT, PAID, MARKED_AS_PAID, CANCELLED, ...
  invoiceNumber?: string;
  recipientEmail?: string;
  invoicerEmail?: string;
  amountCents: number;
  note?: string;
};

function toInvoice(raw: any): Invoice {
  return {
    id: raw.id,
    status: raw.status,
    invoiceNumber: raw.detail?.invoice_number,
    recipientEmail: raw.primary_recipients?.[0]?.billing_info?.email_address,
    // We only ever read with the utility app keys, so a found invoice was issued by that account.
    invoicerEmail: raw.invoicer?.email_address ?? process.env.CITY_UTILITY_SANDBOX_EMAIL,
    amountCents: raw.amount?.value ? valueToCents(raw.amount.value) : 0,
    note: raw.detail?.note,
  };
}

/** POST /v2/invoicing/invoices (creates a DRAFT). */
export async function createInvoice(input: { recipientEmail: string; amountCents: number; itemName: string; note?: string }) {
  const body = await paypalRequest(utilityCredentials(), 'POST', '/v2/invoicing/invoices', {
    body: {
      detail: { currency_code: 'USD', note: input.note },
      invoicer: { email_address: process.env.CITY_UTILITY_SANDBOX_EMAIL },
      primary_recipients: [{ billing_info: { email_address: input.recipientEmail } }],
      items: [{ name: input.itemName, quantity: '1', unit_amount: money(input.amountCents) }],
    },
  });
  // PayPal may return the full invoice or only a link to it.
  const id: string = body.id ?? String(body.href).split('/').pop();
  return getInvoice(id);
}

/** POST /v2/invoicing/invoices/{id}/send */
export async function sendInvoice(invoiceId: string) {
  await paypalRequest(utilityCredentials(), 'POST', `/v2/invoicing/invoices/${invoiceId}/send`, {
    body: { send_to_recipient: true, send_to_invoicer: false },
  });
}

/** GET /v2/invoicing/invoices */
export async function listInvoices(): Promise<Invoice[]> {
  const body = await paypalRequest(utilityCredentials(), 'GET', '/v2/invoicing/invoices?page_size=50&total_required=false');
  return (body.items ?? []).map(toInvoice);
}

/** GET /v2/invoicing/invoices/{id} */
export async function getInvoice(invoiceId: string): Promise<Invoice> {
  return toInvoice(await paypalRequest(utilityCredentials(), 'GET', `/v2/invoicing/invoices/${invoiceId}`));
}

/** POST /v2/invoicing/invoices/{id}/payments: marks the bill paid after our payout succeeded. */
export async function recordInvoicePayment(invoiceId: string, amountCents: number, payoutRef: string) {
  await paypalRequest(utilityCredentials(), 'POST', `/v2/invoicing/invoices/${invoiceId}/payments`, {
    requestId: `invoice-payment-${invoiceId}`,
    body: {
      method: 'PAYPAL',
      payment_date: new Date().toISOString().slice(0, 10),
      amount: money(amountCents),
      note: `Paid by KubePay (payout ${payoutRef})`,
    },
  });
}
