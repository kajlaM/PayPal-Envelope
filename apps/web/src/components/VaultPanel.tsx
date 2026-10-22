import { useState } from 'react';
import { api, errorText } from '../api.ts';
import { cents, label, time, usd } from '../format.ts';
import type { AgentStep, Vault } from '../types.ts';
import { BalanceBar, Countdown, ErrorNote, Pill } from './common.tsx';
import { FundButton } from './FundButton.tsx';

const short = (value: unknown) => {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text && text.length > 180 ? `${text.slice(0, 180)}…` : text;
};

/** The selected vault: its rules, the PayPal fund button, agent controls, and the agent's live tool calls. */
export function VaultPanel({ vault, steps, onChanged }: { vault: Vault; steps: AgentStep[]; onChanged: () => void }) {
  const [task, setTask] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const p = vault.policy;
  const mySteps = steps.filter((s) => s.vaultId === vault.id).slice(-25).reverse();

  async function run(name: string, fn: () => Promise<unknown>, done?: (r: any) => string | null) {
    setBusy(name);
    setError(null);
    setResult(null);
    try {
      const r = await fn();
      setResult(done?.(r) ?? null);
      onChanged();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="stack">
      <div className="row spread">
        <div>
          <h3>{vault.name}</h3>
          <p className="muted small">
            {label(vault.type)} vault · created {time(vault.createdAt)} · id {vault.id}
          </p>
        </div>
        <Pill value={vault.status} />
      </div>

      <dl className="facts">
        <div>
          <dt>Balance</dt>
          <dd>
            <BalanceBar balanceCents={vault.balanceCents} budgetCents={vault.budgetCents} /> of {cents(vault.budgetCents)}
          </dd>
        </div>
        <div>
          <dt>Expires in</dt>
          <dd>{vault.status === 'LIQUIDATED' ? 'closed' : <Countdown iso={vault.expiresAt} />}</dd>
        </div>
        {p && (
          <>
            <div>
              <dt>Max per payment</dt>
              <dd>{usd(p.rules.max_single_transaction)}</dd>
            </div>
            {p.rules.human_approval_above !== undefined && (
              <div>
                <dt>Needs you above</dt>
                <dd>{usd(p.rules.human_approval_above)}</dd>
              </div>
            )}
            <div>
              <dt>Merchants</dt>
              <dd>{p.rules.approved_merchants.join(', ')}</dd>
            </div>
            <div>
              <dt>Categories</dt>
              <dd>{p.rules.allowed_categories.join(', ')}</dd>
            </div>
            {p.shopping && (
              <div>
                <dt>Looking for</dt>
                <dd>{p.shopping.product_query}</dd>
              </div>
            )}
          </>
        )}
      </dl>

      {vault.status === 'PENDING_FUNDING' && (
        <>
          <p className="muted small">Fund the vault with PayPal (sandbox) to activate it.</p>
          <FundButton vault={vault} onFunded={onChanged} />
        </>
      )}

      {vault.status === 'ACTIVE' && (
        <div className="stack">
          <div className="row">
            <input
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder={vault.type === 'UTILITY' ? 'Optional task, e.g. "pay the open electricity bill"' : 'Optional task (default: buy what the policy says)'}
              aria-label="Agent task"
            />
            <button
              className="primary"
              disabled={busy !== null}
              onClick={() => run('agent', () => api.runAgent(vault.id, task.trim() || undefined), (r) => `Agent finished: ${r.outcome ?? 'done'}${r.summary ? `. ${r.summary}` : ''}`)}
            >
              {busy === 'agent' ? 'Agent running…' : 'Run agent'}
            </button>
          </div>
          <div className="row">
            {vault.nextAgentRunAt && (
              <button disabled={busy !== null} onClick={() => run('stop', () => api.stopAgent(vault.id))}>
                Stop watching
              </button>
            )}
            <button disabled={busy !== null} onClick={() => run('sync', () => api.sync(vault.id), () => 'Payouts synced with PayPal.')}>
              Sync payouts
            </button>
            <button
              className="bad"
              disabled={busy !== null}
              onClick={() =>
                confirm(`Refund the unused ${cents(vault.balanceCents)} to the owner and close "${vault.name}"?`) &&
                run('liquidate', () => api.liquidate(vault.id), () => 'Refund sent to the owner.')
              }
            >
              {busy === 'liquidate' ? 'Refunding…' : 'Liquidate now'}
            </button>
          </div>
          {vault.nextAgentRunAt && <p className="muted small">Watch mode: the agent looks again at {time(vault.nextAgentRunAt)}.</p>}
        </div>
      )}

      {vault.status === 'EXPIRED' && (
        <div className="row">
          <button className="bad" disabled={busy !== null} onClick={() => run('liquidate', () => api.liquidate(vault.id), () => 'Refund sent to the owner.')}>
            {busy === 'liquidate' ? 'Refunding…' : 'Retry refund'}
          </button>
          <button disabled={busy !== null} onClick={() => run('sync', () => api.sync(vault.id), () => 'Payouts synced with PayPal.')}>
            Sync payouts
          </button>
        </div>
      )}

      {result && <p className="ok small">{result}</p>}
      <ErrorNote message={error} />

      {mySteps.length > 0 && (
        <div>
          <h4>Agent activity</h4>
          <ol className="steps">
            {mySteps.map((s, i) => (
              <li key={`${s.at}-${i}`}>
                <span className="muted small">{time(s.at)}</span> <code>{s.tool}</code>
                <div className="small">{short(s.output)}</div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
