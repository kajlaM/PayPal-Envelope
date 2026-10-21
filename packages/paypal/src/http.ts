import { randomUUID } from 'node:crypto';
import { PAYPAL_BASE_URL, type Credentials } from './config.ts';

// Small REST client for the PayPal APIs the Server SDK does not cover
// (Payouts, Invoicing, Catalog Products, Webhooks).

export class PayPalApiError extends Error {
  constructor(
    public status: number,
    public body: any,
    public debugId?: string,
  ) {
    super(`PayPal ${status}: ${body?.name ?? ''} ${body?.message ?? body?.error_description ?? ''}`.trim());
  }
}

const tokens = new Map<string, { token: string; expiresAt: number }>();

/** POST /v1/oauth2/token, cached until 1 minute before it expires. */
export async function getAccessToken(creds: Credentials): Promise<string> {
  const cached = tokens.get(creds.clientId);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const body: any = await res.json();
  if (!res.ok) throw new PayPalApiError(res.status, body, res.headers.get('paypal-debug-id') ?? undefined);

  tokens.set(creds.clientId, { token: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 });
  return body.access_token;
}

export type RequestOptions = {
  body?: unknown;
  /** Raw JSON string body; used when the exact bytes matter (webhook verification). */
  rawBody?: string;
  /** Idempotency key. A random one is used for every POST if not given. */
  requestId?: string;
  /** Negative testing, e.g. '{"mock_application_codes":"INSUFFICIENT_FUNDS"}'. */
  mockResponse?: string;
};

export async function paypalRequest<T = any>(
  creds: Credentials,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${await getAccessToken(creds)}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
  if (method === 'POST') headers['PayPal-Request-Id'] = opts.requestId ?? randomUUID();
  if (opts.mockResponse) headers['PayPal-Mock-Response'] = opts.mockResponse;

  const res = await fetch(`${PAYPAL_BASE_URL}${path}`, {
    method,
    headers,
    body: opts.rawBody ?? (opts.body === undefined ? undefined : JSON.stringify(opts.body)),
  });
  const text = await res.text();
  const body = text ? JSON.parse(text) : undefined;
  if (!res.ok) throw new PayPalApiError(res.status, body, res.headers.get('paypal-debug-id') ?? undefined);
  return body as T;
}
