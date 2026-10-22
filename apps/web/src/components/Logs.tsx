import { useMemo, useState } from 'react';
import type { ColDef, RowClassRules } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { api, errorText } from '../api.ts';
import { cents, decisionOutcome, label, outcomeTone, time, usd } from '../format.ts';
import type { Decision, LedgerEntry } from '../types.ts';
import { ErrorNote, Pill } from './common.tsx';

type Names = Map<string, string>;

/** Waiting for a human, and the vault is still active (an expired or refunded vault can't pay any more). */
export const isPending = (d: Decision, activeIds: Set<string>) => d.result === 'NEEDS_HUMAN' && !d.resolvedBy && activeIds.has(d.vaultId);

const toneRows = <T,>(outcome: (row: T) => string): RowClassRules<T> => ({
  'row-good': (p) => !!p.data && outcomeTone(outcome(p.data)) === 'good',
  'row-bad': (p) => !!p.data && outcomeTone(outcome(p.data)) === 'bad',
  'row-warn': (p) => !!p.data && outcomeTone(outcome(p.data)) === 'warn',
});

const decisionRows = toneRows<Decision>(decisionOutcome);
const ledgerRows = toneRows<LedgerEntry>((e) => e.status);

/** Every Policy Engine decision; green = approved, red = blocked, amber = waiting for a human. */
export function DecisionLog({ decisions, names }: { decisions: Decision[]; names: Names }) {
  const columns = useMemo<ColDef<Decision>[]>(
    () => [
      { field: 'createdAt', headerName: 'Time', width: 160, sort: 'desc', valueFormatter: (p) => time(p.value) },
      { headerName: 'Vault', width: 170, valueGetter: (p) => names.get(p.data!.vaultId) ?? p.data!.vaultId },
      { headerName: 'Merchant', width: 150, valueGetter: (p) => p.data!.requestJson.merchant },
      { headerName: 'Amount', width: 100, valueGetter: (p) => p.data!.requestJson.amount, valueFormatter: (p) => usd(p.value) },
      { headerName: 'Result', width: 170, valueGetter: (p) => decisionOutcome(p.data!), cellRenderer: (p: { value: string }) => <Pill value={p.value} /> },
      { field: 'reasons', headerName: 'Reason codes', flex: 1, minWidth: 200, valueFormatter: (p) => (p.value as string[]).join(', ') || '—' },
      { headerName: 'What the agent asked for', flex: 1, minWidth: 200, valueGetter: (p) => p.data!.requestJson.reason, tooltipValueGetter: (p) => p.value },
    ],
    [names],
  );
  return (
    <div className="grid" style={{ height: 380 }}>
      <AgGridReact<Decision>
        rowData={decisions}
        columnDefs={columns}
        getRowId={(p) => p.data.id}
        rowClassRules={decisionRows}
        overlayNoRowsTemplate="No payment decisions yet."
      />
    </div>
  );
}

/** Every money movement: FUND (in), SPEND and LIQUIDATE (out), with the PayPal reference. */
export function LedgerGrid({ ledger, names }: { ledger: LedgerEntry[]; names: Names }) {
  const columns = useMemo<ColDef<LedgerEntry>[]>(
    () => [
      { field: 'createdAt', headerName: 'Time', width: 160, sort: 'desc', valueFormatter: (p) => time(p.value) },
      { headerName: 'Vault', width: 170, valueGetter: (p) => names.get(p.data!.vaultId) ?? p.data!.vaultId },
      { field: 'type', width: 110 },
      { field: 'status', width: 130, cellRenderer: (p: { value: string }) => <Pill value={p.value} /> },
      {
        field: 'amountCents',
        headerName: 'Amount',
        width: 110,
        valueFormatter: (p) => (p.data!.type === 'FUND' ? '+' : '−') + cents(p.value),
      },
      { headerName: 'To / from', width: 150, valueGetter: (p) => p.data!.merchant?.name ?? (p.data!.type === 'FUND' ? 'owner (PayPal)' : 'owner') },
      { field: 'paypalRef', headerName: 'PayPal reference', flex: 1, minWidth: 180 },
      { field: 'note', flex: 1, minWidth: 150, tooltipValueGetter: (p) => p.value },
    ],
    [names],
  );
  return (
    <div className="grid" style={{ height: 380 }}>
      <AgGridReact<LedgerEntry>
        rowData={ledger}
        columnDefs={columns}
        getRowId={(p) => p.data.id}
        rowClassRules={ledgerRows}
        overlayNoRowsTemplate="No money has moved yet."
      />
    </div>
  );
}

/** NEEDS_HUMAN decisions that nobody has approved or rejected yet, in vaults that can still pay. */
export function PendingApprovals({ decisions, names, activeIds }: { decisions: Decision[]; names: Names; activeIds: Set<string> }) {
  const pending = useMemo(() => decisions.filter((d) => isPending(d, activeIds)), [decisions, activeIds]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo<ColDef<Decision>[]>(() => {
    async function act(d: Decision, action: 'approve' | 'reject') {
      setBusy(d.id);
      setError(null);
      try {
        await api[action](d.vaultId, d.id);
      } catch (err) {
        setError(errorText(err));
      } finally {
        setBusy(null);
      }
    }
    return [
      { headerName: 'Vault', width: 160, valueGetter: (p) => names.get(p.data!.vaultId) ?? p.data!.vaultId },
      { headerName: 'Merchant', width: 140, valueGetter: (p) => p.data!.requestJson.merchant },
      { headerName: 'Amount', width: 95, valueGetter: (p) => p.data!.requestJson.amount, valueFormatter: (p) => usd(p.value) },
      { field: 'reasons', headerName: 'Why it needs you', flex: 1, minWidth: 180, valueFormatter: (p) => (p.value as string[]).map(label).join(', ') },
      {
        headerName: '',
        width: 190,
        sortable: false,
        cellRenderer: (p: { data: Decision }) => (
          <div className="row tight">
            <button className="good" disabled={busy !== null} onClick={() => act(p.data, 'approve')}>
              {busy === p.data.id ? '…' : 'Approve'}
            </button>
            <button className="bad" disabled={busy !== null} onClick={() => act(p.data, 'reject')}>
              Reject
            </button>
          </div>
        ),
      },
    ];
  }, [names, busy]);

  return (
    <div className="stack">
      <div className="grid" style={{ height: 220 }}>
        <AgGridReact<Decision>
          rowData={pending}
          columnDefs={columns}
          getRowId={(p) => p.data.id}
          overlayNoRowsTemplate="Nothing is waiting for you."
        />
      </div>
      <ErrorNote message={error} />
    </div>
  );
}
