import { useState } from 'react';
import { api, ApiError, errorText } from '../api.ts';
import { time } from '../format.ts';
import type { CopilotAnswer, Vault } from '../types.ts';

type Turn = { question: string; reply?: CopilotAnswer; error?: string };

const EXAMPLES = ['Why was the first purchase blocked?', 'What did the agent buy, and from whom?', 'Was any money refunded?'];

/** Audit Copilot (Step 11): plain-English questions answered from the Elastic audit log, with sources. */
export function Copilot({ selected }: { selected: Vault | null }) {
  const [question, setQuestion] = useState('');
  const [onlySelected, setOnlySelected] = useState(true);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const scope = onlySelected ? selected?.id : undefined;

  async function ask(q: string) {
    if (q.trim().length < 3) return;
    setBusy(true);
    setQuestion('');
    try {
      const reply = await api.ask(q.trim(), scope);
      setTurns((t) => [...t, { question: q, reply }]);
    } catch (err) {
      const error =
        err instanceof ApiError && err.code === 'AUDIT_NOT_CONFIGURED'
          ? 'The audit log is off. Set ELASTIC_URL and ELASTIC_API_KEY for the API.'
          : errorText(err);
      setTurns((t) => [...t, { question: q, error }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack copilot">
      <div className="turns" aria-live="polite">
        {turns.length === 0 && (
          <div className="row">
            {EXAMPLES.map((q) => (
              <button key={q} className="chip" onClick={() => ask(q)} disabled={busy}>
                {q}
              </button>
            ))}
          </div>
        )}
        {turns.map((t, i) => (
          <div key={i} className="turn">
            <p className="question">{t.question}</p>
            {t.error && <p className="error">{t.error}</p>}
            {t.reply && (
              <>
                <p className="answer">{t.reply.answer}</p>
                {t.reply.sources.length > 0 && (
                  <details>
                    <summary className="muted small">
                      {t.reply.sources.length} audit records{t.reply.model ? ` · ${t.reply.model}` : ''}
                    </summary>
                    <ul className="sources">
                      {t.reply.sources.map((s) => (
                        <li key={s.id}>
                          <code>{s.id}</code> <span className="muted">{time(s.timestamp)}</span>
                          <div>{s.summary}</div>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </>
            )}
          </div>
        ))}
        {busy && <p className="muted">Searching the audit log…</p>}
      </div>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask about any payment…" aria-label="Question" />
        <button className="primary" disabled={busy || question.trim().length < 3}>
          Ask
        </button>
      </form>
      {selected && (
        <label className="small muted">
          <input type="checkbox" checked={onlySelected} onChange={(e) => setOnlySelected(e.target.checked)} /> Only “{selected.name}”
        </label>
      )}
    </div>
  );
}
