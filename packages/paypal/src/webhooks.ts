import { platformCredentials, utilityCredentials, webhookId, utilityWebhookId, type Credentials } from './config.ts';
import { paypalRequest } from './http.ts';
import { patchSchema, webhookListSchema, webhookSchema } from 'invoices';
import { paypalRest, toModel } from './rest-sdk.ts';

// Webhooks API: register our URL with PayPal, and confirm a webhook really came from PayPal.
// Each REST app has its own webhooks: the platform app (funding, payouts, subscriptions) and the
// city-utility app (its invoices).

export type WebhookApp = 'platform' | 'utility';

/** Event types PayPalVault subscribes to, per app. */
export const WEBHOOK_EVENTS: Record<WebhookApp, readonly string[]> = {
  platform: [
    'CHECKOUT.ORDER.APPROVED',
    'PAYMENT.CAPTURE.COMPLETED',
    'PAYMENT.CAPTURE.DENIED',
    'PAYMENT.PAYOUTSBATCH.SUCCESS',
    'PAYMENT.PAYOUTSBATCH.DENIED',
    'PAYMENT.PAYOUTS-ITEM.SUCCEEDED',
    'PAYMENT.PAYOUTS-ITEM.FAILED',
    'PAYMENT.PAYOUTS-ITEM.BLOCKED',
    'PAYMENT.PAYOUTS-ITEM.RETURNED',
    'PAYMENT.PAYOUTS-ITEM.REFUNDED',
    'PAYMENT.PAYOUTS-ITEM.DENIED',
    'PAYMENT.PAYOUTS-ITEM.CANCELED',
    'BILLING.SUBSCRIPTION.ACTIVATED',
    'BILLING.SUBSCRIPTION.CANCELLED',
    'PAYMENT.SALE.COMPLETED',
    'INVOICING.INVOICE.PAID', // "Ask a friend": the friend paid the money request
    'INVOICING.INVOICE.CANCELLED',
  ],
  utility: ['INVOICING.INVOICE.PAID', 'INVOICING.INVOICE.CANCELLED'],
};

const creds = (app: WebhookApp): Credentials => (app === 'utility' ? utilityCredentials() : platformCredentials());

/**
 * POST /v1/notifications/verify-webhook-signature.
 * `rawBody` must be the exact request body string (use express.raw / express.text),
 * because re-serialised JSON can fail verification.
 */
export async function verifyWebhook(
  headers: Record<string, string | string[] | undefined>,
  rawBody: string,
  app: WebhookApp = 'platform',
) {
  const h = (name: string) => {
    const value = headers[name];
    return Array.isArray(value) ? value[0] : value;
  };
  const meta = {
    auth_algo: h('paypal-auth-algo'),
    cert_url: h('paypal-cert-url'),
    transmission_id: h('paypal-transmission-id'),
    transmission_sig: h('paypal-transmission-sig'),
    transmission_time: h('paypal-transmission-time'),
    webhook_id: app === 'utility' ? utilityWebhookId() : webhookId(),
  };
  if (Object.values(meta).some((v) => !v)) return false;

  // Splice the raw event in so PayPal checks the same bytes it signed.
  const json = JSON.stringify(meta);
  const body = `${json.slice(0, -1)},"webhook_event":${rawBody}}`;
  const result = await paypalRequest(creds(app), 'POST', '/v1/notifications/verify-webhook-signature', { rawBody: body });
  return result.verification_status === 'SUCCESS';
}

export type Webhook = { id: string; url: string; events: string[] };

/** GET /v1/notifications/webhooks */
export async function listWebhooks(app: WebhookApp): Promise<Webhook[]> {
  const body = await paypalRest(app, (c) => c.webhooks.webhooksList({}), webhookListSchema,
    () => paypalRequest(creds(app), 'GET', '/v1/notifications/webhooks'));
  return (body.webhooks ?? []).map((w: any) => ({ id: w.id, url: w.url, events: w.event_types.map((e: any) => e.name) }));
}

/** Creates the webhook for `url`, or updates the event list if one already points there. */
export async function upsertWebhook(app: WebhookApp, url: string): Promise<Webhook> {
  const event_types = WEBHOOK_EVENTS[app].map((name) => ({ name }));
  const existing = (await listWebhooks(app)).find((w) => w.url === url);
  if (existing) {
    const patch = [{ op: 'replace', path: '/event_types', value: event_types }];
    await paypalRest(app, (c) => c.webhooks.webhooksUpdate({ webhookId: existing.id, body: patch.map((p) => toModel(patchSchema, p)) }));
    return { ...existing, events: [...WEBHOOK_EVENTS[app]] };
  }
  const created = await paypalRest(app, (c) => c.webhooks.webhooksPost({ body: toModel(webhookSchema, { url, event_types }) }), webhookSchema);
  return { id: created.id, url: created.url, events: [...WEBHOOK_EVENTS[app]] };
}

/** DELETE /v1/notifications/webhooks/{id} */
export async function deleteWebhook(app: WebhookApp, id: string) {
  await paypalRest(app, (c) => c.webhooks.webhooksDelete({ webhookId: id }));
}
