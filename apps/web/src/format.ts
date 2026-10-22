export const usd = (dollars: number) =>
  dollars.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

export const cents = (c: number) => usd(c / 100);

export const time = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';

/** "2d 4h", "13m 05s", or "expired". */
export function countdown(iso: string, now = Date.now()) {
  let s = Math.floor((new Date(iso).getTime() - now) / 1000);
  if (s <= 0) return 'expired';
  const d = Math.floor(s / 86400);
  const h = Math.floor((s %= 86400) / 3600);
  const m = Math.floor((s %= 3600) / 60);
  s %= 60;
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

/** Final result shown for a decision, including a human's approve/reject. */
export const decisionOutcome = (d: { result: string; resolvedBy: string | null }) => d.resolvedBy ?? d.result;

export const outcomeTone = (outcome: string) =>
  outcome === 'APPROVE' || outcome === 'APPROVED_BY_HUMAN' || outcome === 'COMPLETED' || outcome === 'ACTIVE'
    ? 'good'
    : outcome === 'BLOCK' || outcome === 'REJECTED_BY_HUMAN' || outcome === 'FAILED' || outcome === 'EXPIRED'
      ? 'bad'
      : outcome === 'NEEDS_HUMAN' || outcome === 'PENDING' || outcome === 'PENDING_FUNDING'
        ? 'warn'
        : 'muted';

export const label = (code: string) => code.replaceAll('_', ' ').toLowerCase();
