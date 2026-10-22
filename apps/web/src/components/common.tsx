import { useEffect, useState } from 'react';
import { countdown, label, outcomeTone } from '../format.ts';

export function Pill({ value }: { value: string }) {
  return <span className={`pill ${outcomeTone(value)}`}>{label(value)}</span>;
}

/** Re-renders every second so the time left stays current. */
export function Countdown({ iso }: { iso: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const text = countdown(iso, now);
  return <span className={text === 'expired' ? 'muted' : undefined}>{text}</span>;
}

export function BalanceBar({ balanceCents, budgetCents }: { balanceCents: number; budgetCents: number }) {
  const pct = budgetCents > 0 ? Math.min(100, Math.max(0, (balanceCents / budgetCents) * 100)) : 0;
  return (
    <div className="balance">
      <div className="balance-track">
        <div className="balance-fill" style={{ width: `${pct}%` }} />
      </div>
      <span>${(balanceCents / 100).toFixed(2)}</span>
    </div>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  return message ? <p className="error" role="alert">{message}</p> : null;
}
