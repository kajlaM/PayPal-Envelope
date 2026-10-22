import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { API_URL } from './api.ts';
import { Copilot } from './components/Copilot.tsx';
import { DeployVault } from './components/DeployVault.tsx';
import { DecisionLog, isPending, LedgerGrid, PendingApprovals } from './components/Logs.tsx';
import { VaultPanel } from './components/VaultPanel.tsx';
import { VaultsGrid } from './components/VaultsGrid.tsx';
import { useLiveData } from './live.ts';

// Bryntum is large, so the timeline loads only when its tab is opened.
const VaultTimeline = lazy(() => import('./components/VaultTimeline.tsx').then((m) => ({ default: m.VaultTimeline })));

const TABS = ['Decision log', 'Ledger', 'Timeline', 'Audit Copilot'] as const;
type Tab = (typeof TABS)[number];

// The selected vault lives in ?vault=<id>, so Zapier alert links open straight to it.
const initialVault = () => new URLSearchParams(location.search).get('vault');

export function App() {
  const { vaults, decisions, ledger, steps, connected, error, refresh } = useLiveData();
  const [selectedId, setSelectedId] = useState<string | null>(initialVault);
  const [tab, setTab] = useState<Tab>('Decision log');
  const [onlySelected, setOnlySelected] = useState(false);

  useEffect(() => {
    const url = new URL(location.href);
    if (selectedId) url.searchParams.set('vault', selectedId);
    else url.searchParams.delete('vault');
    history.replaceState(null, '', url);
  }, [selectedId]);

  const selected = vaults.find((v) => v.id === selectedId) ?? null;
  const names = useMemo(() => new Map(vaults.map((v) => [v.id, v.name])), [vaults]);
  const scoped = onlySelected && selected;
  const shownDecisions = useMemo(() => (scoped ? decisions.filter((d) => d.vaultId === selected.id) : decisions), [decisions, scoped, selected]);
  const shownLedger = useMemo(() => (scoped ? ledger.filter((e) => e.vaultId === selected.id) : ledger), [ledger, scoped, selected]);
  const activeIds = useMemo(() => new Set(vaults.filter((v) => v.status === 'ACTIVE').map((v) => v.id)), [vaults]);
  const pendingCount = decisions.filter((d) => isPending(d, activeIds)).length;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>
            K
          </span>
          <div>
            <h1>KubePay AI</h1>
            <p>Spending vaults for AI agents · PayPal sandbox</p>
          </div>
        </div>
        <span className={`live ${connected ? 'on' : ''}`} title={API_URL}>
          {connected ? 'Live' : 'Offline'}
        </span>
      </header>

      {error && <p className="banner error">{error}. Start it with npm run api:dev.</p>}

      <main className="layout">
        <section className="card deploy">
          <h2>Deploy a vault</h2>
          <DeployVault onCreated={(id) => { setSelectedId(id); refresh(); }} />
        </section>

        <section className="card vaults">
          <h2>Vaults</h2>
          <VaultsGrid vaults={vaults} selectedId={selectedId} onSelect={setSelectedId} />
        </section>

        <section className="card selected">
          <h2>Selected vault</h2>
          {selected ? (
            <VaultPanel key={selected.id} vault={selected} steps={steps} onChanged={refresh} />
          ) : (
            <p className="muted">Click a vault in the grid to fund it, run its agent, or refund it.</p>
          )}
        </section>

        <section className="card approvals">
          <h2>
            Pending approvals {pendingCount > 0 && <span className="count">{pendingCount}</span>}
          </h2>
          <PendingApprovals decisions={decisions} names={names} activeIds={activeIds} />
        </section>

        <section className="card wide">
          <div className="row spread">
            <div className="tabs" role="tablist">
              {TABS.map((t) => (
                <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'tab on' : 'tab'} onClick={() => setTab(t)}>
                  {t}
                </button>
              ))}
            </div>
            {selected && (tab === 'Decision log' || tab === 'Ledger') && (
              <label className="small muted">
                <input type="checkbox" checked={onlySelected} onChange={(e) => setOnlySelected(e.target.checked)} /> Only “{selected.name}”
              </label>
            )}
          </div>
          {tab === 'Decision log' && <DecisionLog decisions={shownDecisions} names={names} />}
          {tab === 'Ledger' && <LedgerGrid ledger={shownLedger} names={names} />}
          {tab === 'Timeline' && (
            <Suspense fallback={<p className="muted">Loading timeline…</p>}>
              <VaultTimeline vaults={vaults} ledger={ledger} />
            </Suspense>
          )}
          {tab === 'Audit Copilot' && <Copilot selected={selected} />}
        </section>
      </main>
    </div>
  );
}
