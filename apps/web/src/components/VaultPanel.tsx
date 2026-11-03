import { useEffect, useState } from 'react';
import { api, errorText } from '../api.ts';
import { cents, label, time, usd } from '../format.ts';
import type { AgentStep, Policy, Proposal, Vault } from '../types.ts';
import { BalanceBar, Countdown, ErrorNote, Pill } from './common.tsx';
import { FundButton } from './FundButton.tsx';

const short = (value: unknown) => {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text && text.length > 180 ? `${text.slice(0, 180)}…` : text;
};

function controlText(rules: Policy['rules']) {
  const mode = rules.control_mode ?? 'ASK_ABOVE';
  if (mode === 'ASK_ME') return 'Ask me (owner picks from the top 3)';
  if (mode === 'AUTOPILOT' || rules.human_approval_above === undefined) return 'Autopilot';
  return `Ask above ${usd(rules.human_approval_above)}`;
}

/** The selected vault: its rules, the PayPal fund button, agent controls, and the agent's live tool calls. */
export function VaultPanel({ vault, steps, onChanged }: { vault: Vault; steps: AgentStep[]; onChanged: () => void }) {
  const [task, setTask] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const p = vault.policy;
  const mySteps = steps.filter((s) => s.vaultId === vault.id).slice(-25).reverse();
  const [proposals, setProposals] = useState<Proposal[]>([]);

  // Ask me: load the open options when there are any (the vault list only has the count).
  useEffect(() => {
    if (!vault.openProposals || vault.status !== 'ACTIVE') return setProposals([]);
    let live = true;
    api.vault(vault.id).then((v) => live && setProposals(v.proposals.filter((p) => p.status === 'OPEN'))).catch(() => undefined);
    return () => {
      live = false;
    };
  }, [vault.id, vault.openProposals, vault.status, vault.updatedAt]);

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
            <div>
              <dt>Control</dt>
              <dd>{controlText(p.rules)}</dd>
            </div>
            {p.savings && (
              <div>
                <dt>Paid in over time</dt>
                <dd>
                  {usd(p.savings.amount_per_payment)} every {p.savings.every.toLowerCase()}
                  {vault.status === 'SAVING' && (vault.savingsPausedAt ? ' · paused' : vault.nextChargeAt ? ` · next ${time(vault.nextChargeAt)}` : '')}
                </dd>
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
                <dt>{p.shopping.list ? 'Shopping list' : 'Looking for'}</dt>
                <dd>{p.shopping.list ? p.shopping.list.items.map((i) => `${i.name} ≤ ${usd(i.max_price)}`).join(' · ') : p.shopping.product_query}</dd>
              </div>
            )}
          </>
        )}
      </dl>

      {vault.status === 'PENDING_FUNDING' && !p?.savings && (
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

      {proposals.map((prop) => (
        <div key={prop.id} className="stack">
          <h4>Pick one</h4>
          {prop.summary && <p className="small">{prop.summary}</p>}
          <ol className="steps">
            {prop.options.map((o, i) => (
              <li key={o.url}>
                <a href={o.url} target="_blank" rel="noreferrer">{o.title}</a> · {usd(o.verified_price ?? o.price)} at {o.merchant}
                <div className="small ok">{o.pros.map((t) => `+ ${t}`).join(' · ')}</div>
                <div className="small bad">{o.cons.map((t) => `− ${t}`).join(' · ')}</div>
                <button
                  className="primary"
                  disabled={busy !== null}
                  onClick={() => run('choose', () => api.chooseOption(vault.id, prop.id, i), (r) => `Picked: ${r.decision.result}${r.decision.reasons.length ? ` (${r.decision.reasons.join(', ')})` : ''}`)}
                >
                  Pick this
                </button>
              </li>
            ))}
          </ol>
          <button disabled={busy !== null} onClick={() => run('reject-options', () => api.rejectOptions(vault.id, prop.id), () => 'The agent will look for other options.')}>
            None of these
          </button>
        </div>
      ))}

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
