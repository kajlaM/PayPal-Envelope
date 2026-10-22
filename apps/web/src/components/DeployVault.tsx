import { useState } from 'react';
import { api, errorText } from '../api.ts';
import { usd } from '../format.ts';
import type { CompileResult, Policy } from '../types.ts';
import { ErrorNote } from './common.tsx';

const EXAMPLE = 'Create a vault with $50 to buy noise-canceling headphones before Sunday, max spend $45.';

// Plain English -> Claude writes the policy (POST /compile) -> the user checks or edits the JSON -> Confirm saves the vault.
export function DeployVault({ onCreated }: { onCreated: (vaultId: string) => void }) {
  const [text, setText] = useState('');
  const [draft, setDraft] = useState<CompileResult | null>(null);
  const [json, setJson] = useState('');
  const [busy, setBusy] = useState<'compile' | 'create' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function compile() {
    setBusy('compile');
    setError(null);
    try {
      const result = await api.compile(text.trim());
      setDraft(result);
      setJson(JSON.stringify(result.policy, null, 2));
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  }

  async function confirm() {
    let policy: Policy;
    try {
      policy = JSON.parse(json);
    } catch {
      return setError('The policy JSON is not valid JSON.');
    }
    setBusy('create');
    setError(null);
    try {
      const vault = await api.createVault(policy, text.trim() || undefined);
      setDraft(null);
      setText('');
      onCreated(vault.id);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(null);
    }
  }

  const p = draft?.policy;
  return (
    <div className="stack">
      <textarea
        rows={3}
        value={text}
        placeholder={EXAMPLE}
        onChange={(e) => setText(e.target.value)}
        aria-label="Describe the vault"
      />
      <div className="row">
        <button className="primary" disabled={text.trim().length < 5 || busy !== null} onClick={compile}>
          {busy === 'compile' ? 'Writing policy…' : 'Generate policy'}
        </button>
        {!text && (
          <button className="link" onClick={() => setText(EXAMPLE)}>
            Use example
          </button>
        )}
      </div>

      {p && (
        <div className="stack preview">
          <p className="summary">
            <strong>{p.vault_name}</strong> · {p.vault_type.toLowerCase()} · budget {usd(p.allocated_budget)} · max{' '}
            {usd(p.rules.max_single_transaction)} per payment · expires {new Date(p.rules.expiry_timestamp).toLocaleString()}
            {p.rules.human_approval_above !== undefined && <> · human approval above {usd(p.rules.human_approval_above)}</>}
          </p>
          {draft.warnings.length > 0 && (
            <ul className="warnings">
              {draft.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          )}
          <label className="muted small" htmlFor="policy-json">
            Policy JSON{draft.model ? ` (written by ${draft.model})` : ''}, edit before confirming if needed
          </label>
          <textarea id="policy-json" className="code" rows={14} value={json} onChange={(e) => setJson(e.target.value)} spellCheck={false} />
          <div className="row">
            <button className="primary" disabled={busy !== null} onClick={confirm}>
              {busy === 'create' ? 'Creating…' : 'Confirm & create vault'}
            </button>
            <button disabled={busy !== null} onClick={() => setDraft(null)}>
              Discard
            </button>
          </div>
        </div>
      )}
      <ErrorNote message={error} />
    </div>
  );
}
