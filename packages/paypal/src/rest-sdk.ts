import { InvoicesClient } from 'invoices';
import { PAYPAL_BASE_URL, platformCredentials, utilityCredentials, type Credentials } from './config.ts';
import { PayPalApiError } from './http.ts';

// The PayPal APIs the PayPal Server SDK does not cover (Payouts, Invoicing, Webhooks), through an SDK
// that APIMatic generated from PayPal's own published OpenAPI descriptions (packages/paypal-rest-sdk,
// from apimatic/paypal; see scripts/apimatic.mjs). One client per PayPal app, each caching its own
// OAuth token. The base URL is always PAYPAL_BASE_URL (the sandbox), never the SDK's default.
//
// The SDK's models use camelCase, PayPal's JSON snake_case. Callers build and read PayPal's JSON exactly
// as before: requests are decoded into the SDK's model and responses encoded back with the SDK's own
// schemas, so the JSON PayPal sees is the same. A PayPal error comes out as PayPalApiError, like the
// REST client's, so every caller's error handling keeps working.
//
// Kept on the REST client (http.ts) on purpose: invoice and money-request writes, which must send
// PayPal-Request-Id (PayPal's Invoicing description has no such header, so the SDK cannot send it),
// and the webhook signature check, which must send PayPal's event body byte for byte.

export type PayPalApp = 'platform' | 'utility';
type Codec = { encode(value: unknown): unknown; decode(value: unknown): unknown };
type Result =
  | { ok: true; value: unknown }
  | { ok: false; status: number; headers?: Headers; payload: unknown; message: string };

const clients = new Map<PayPalApp, InvoicesClient>();

function clientFor(app: PayPalApp): InvoicesClient {
  let client = clients.get(app);
  if (!client) {
    const creds: Credentials = app === 'platform' ? platformCredentials() : utilityCredentials();
    client = new InvoicesClient({
      serverOptions: { baseUrl: PAYPAL_BASE_URL },
      oauth2: { clientId: creds.clientId, clientSecret: creds.clientSecret },
      retry: { timeout: 30_000 }, // POSTs are never retried by the SDK
    });
    clients.set(app, client);
  }
  return client;
}

/** PayPal's JSON body as the SDK's request model (PayPal sees the same JSON). */
export function toModel<T>(codec: Codec, json: unknown): T {
  return codec.decode(json) as T;
}

/**
 * Runs one SDK call and returns PayPal's JSON (encoded back when the SDK modelled it).
 * `fallback`: the same request through the REST client, used only if PayPal's reply does not match
 * PayPal's published description (the SDK then cannot decode it). Safe for payouts too: the fallback
 * sends the same PayPal-Request-Id, so PayPal returns the same batch instead of paying twice.
 */
export async function paypalRest(
  app: PayPalApp,
  call: (c: InvoicesClient) => { asApiResult(): Promise<unknown> },
  codec?: Codec,
  fallback?: () => Promise<any>,
): Promise<any> {
  let result: Result;
  try {
    result = (await call(clientFor(app)).asApiResult()) as Result;
  } catch (err) {
    if (fallback && (err as { kind?: string }).kind === 'decode') {
      console.warn(`PayPal reply did not match its description (${(err as Error).message.slice(0, 120)}); read it with the REST client instead.`);
      return fallback();
    }
    // Token refused and the like: same shape as the REST client's errors.
    const cause = (err as { cause?: { status?: number } }).cause;
    throw new PayPalApiError(cause?.status ?? 502, { name: (err as Error).name, message: (err as Error).message });
  }
  if (!result.ok) throw new PayPalApiError(result.status, errorBody(result.payload, result.message), result.headers?.get('paypal-debug-id') ?? undefined);
  return codec && result.value !== undefined ? codec.encode(result.value) : result.value;
}

// PayPal's error fields (name, message, details[].issue / description / field) are single words, so the
// SDK's decoded error reads like PayPal's JSON. An undeclared error comes as raw bytes.
function errorBody(payload: unknown, message: string): any {
  const p = payload as { body?: unknown; rawBody?: ArrayBuffer } | undefined;
  if (p?.body && typeof p.body === 'object') return p.body;
  if (p?.rawBody) {
    try { return JSON.parse(new TextDecoder().decode(p.rawBody)); } catch { /* not JSON */ }
  }
  return { message };
}
