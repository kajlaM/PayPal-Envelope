import type { ErrorRequestHandler, RequestHandler } from 'express';
import { z } from 'zod';
import { LedgerError } from '@paypalvault/db';
import { PayPalApiError } from '@paypalvault/paypal';

export class HttpError extends Error {
  constructor(public status: number, public code: string, public extra: Record<string, unknown> = {}) {
    super(code);
  }
}

/** Agents call money-moving routes with the x-internal-key header. The browser never has this key. */
export const requireInternalKey: RequestHandler = (req, _res, next) => {
  const key = process.env.INTERNAL_API_KEY;
  if (!key || req.header('x-internal-key') !== key) throw new HttpError(401, 'INTERNAL_KEY_REQUIRED');
  next();
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.code, ...err.extra });
  if (err instanceof z.ZodError) return res.status(400).json({ error: 'INVALID_INPUT', issues: z.treeifyError(err) });
  if (err instanceof LedgerError) return res.status(409).json({ error: err.code });
  if (err instanceof PayPalApiError) {
    return res.status(502).json({ error: 'PAYPAL_ERROR', status: err.status, name: err.body?.name, message: err.body?.message, debugId: err.debugId });
  }
  if (err?.code === 'P2025') return res.status(404).json({ error: 'NOT_FOUND' });
  console.error(err);
  res.status(500).json({ error: 'INTERNAL_ERROR' });
};
