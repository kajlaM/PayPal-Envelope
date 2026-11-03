import { createHmac, timingSafeEqual } from 'node:crypto';

// Signed links in alert emails: Approve / Reject a purchase that needs the owner, or Pick one of the
// agent's options (Ask me). The API signs them into the email; the wallet site checks them.
// A link is tied to one decision or option and expires. It never moves money on its own: it opens a
// confirm page, and Approve / Pick still need the owner's password there. Each one works only once,
// because a decision or option that was already handled can't be handled again.

export type ApprovalAction =
  | { a: 'approve' | 'reject'; v: string; d: string } // NEEDS_HUMAN decision
  | { a: 'pick'; v: string; p: string; i: number } // Ask me: option i of proposal p
  | { a: 'none'; v: string; p: string }; // Ask me: none of these

export const APPROVAL_LINK_TTL_MS = 24 * 60 * 60_000;

const sign = (body: string, secret: string) => createHmac('sha256', secret).update(`approval-link:${body}`).digest('base64url');

/** A token for one action, valid for `ttlMs`. */
export function signApprovalLink(action: ApprovalAction, secret: string, ttlMs = APPROVAL_LINK_TTL_MS, now = Date.now()) {
  const body = Buffer.from(JSON.stringify({ ...action, e: now + ttlMs })).toString('base64url');
  return `${body}.${sign(body, secret)}`;
}

export type CheckedLink = { ok: true; action: ApprovalAction; expiresAt: Date } | { ok: false; reason: 'INVALID' | 'EXPIRED' };

/** Checks the signature and the expiry. */
export function verifyApprovalLink(token: string, secret: string, now = Date.now()): CheckedLink {
  const [body, sig] = String(token ?? '').split('.');
  if (!body || !sig) return { ok: false, reason: 'INVALID' };
  const expected = Buffer.from(sign(body, secret));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: 'INVALID' };
  let data: any;
  try {
    data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, reason: 'INVALID' };
  }
  if (typeof data?.e !== 'number' || typeof data.v !== 'string') return { ok: false, reason: 'INVALID' };
  if (data.e < now) return { ok: false, reason: 'EXPIRED' };
  const { e, ...action } = data;
  const valid =
    ((action.a === 'approve' || action.a === 'reject') && typeof action.d === 'string')
    || (action.a === 'pick' && typeof action.p === 'string' && Number.isInteger(action.i) && action.i >= 0)
    || (action.a === 'none' && typeof action.p === 'string');
  return valid ? { ok: true, action: action as ApprovalAction, expiresAt: new Date(e) } : { ok: false, reason: 'INVALID' };
}
