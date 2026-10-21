import { platformCredentials } from './config.ts';
import { paypalRequest } from './http.ts';
import { centsToValue, CURRENCY, valueToCents } from './money.ts';

// Payouts API: platform pays merchants (SPEND) and returns leftover money to the user (LIQUIDATE).

export type PayoutItemStatus =
  | 'SUCCESS' | 'FAILED' | 'PENDING' | 'UNCLAIMED' | 'RETURNED' | 'ONHOLD' | 'BLOCKED' | 'REFUNDED' | 'REVERSED';

/**
 * POST /v1/payments/payouts with one item.
 * Pass the ledger entry id as `ledgerEntryId`: it becomes sender_batch_id and sender_item_id,
 * so PayPal rejects a second payout for the same entry and webhooks can find the entry again.
 */
export async function sendPayout(input: {
  ledgerEntryId: string;
  receiverEmail: string;
  amountCents: number;
  note: string;
  mockResponse?: string;
}) {
  const body = await paypalRequest(platformCredentials(), 'POST', '/v1/payments/payouts', {
    requestId: input.ledgerEntryId,
    mockResponse: input.mockResponse,
    body: {
      sender_batch_header: {
        sender_batch_id: input.ledgerEntryId,
        email_subject: 'You have a payment from KubePay',
        email_message: input.note,
      },
      items: [
        {
          recipient_type: 'EMAIL',
          receiver: input.receiverEmail,
          amount: { currency: CURRENCY, value: centsToValue(input.amountCents) },
          note: input.note,
          sender_item_id: input.ledgerEntryId,
        },
      ],
    },
  });
  return {
    payoutBatchId: body.batch_header.payout_batch_id as string,
    batchStatus: body.batch_header.batch_status as string,
  };
}

export type PayoutItem = {
  payoutItemId: string;
  ledgerEntryId: string;
  status: PayoutItemStatus;
  amountCents: number;
  error?: string;
};

/** GET /v1/payments/payouts/{batchId}. Use when a webhook is late. */
export async function getPayout(payoutBatchId: string) {
  const body = await paypalRequest(platformCredentials(), 'GET', `/v1/payments/payouts/${payoutBatchId}`);
  const items: PayoutItem[] = (body.items ?? []).map((item: any) => ({
    payoutItemId: item.payout_item_id,
    ledgerEntryId: item.payout_item?.sender_item_id,
    status: item.transaction_status,
    amountCents: valueToCents(item.payout_item.amount.value),
    error: item.errors?.name,
  }));
  return { payoutBatchId, batchStatus: body.batch_header.batch_status as string, items };
}
