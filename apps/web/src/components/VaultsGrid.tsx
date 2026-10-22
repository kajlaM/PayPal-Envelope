import { useEffect, useMemo, useRef } from 'react';
import type { ColDef } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { cents, label, time } from '../format.ts';
import type { Vault } from '../types.ts';
import { BalanceBar, Countdown, Pill } from './common.tsx';

export function VaultsGrid({ vaults, selectedId, onSelect }: { vaults: Vault[]; selectedId: string | null; onSelect: (id: string | null) => void }) {
  const grid = useRef<AgGridReact<Vault>>(null);

  const columns = useMemo<ColDef<Vault>[]>(
    () => [
      { field: 'name', headerName: 'Vault', flex: 2, minWidth: 140, tooltipField: 'name' },
      { field: 'type', width: 90, valueFormatter: (p) => label(p.value) },
      { field: 'budgetCents', headerName: 'Budget', width: 95, valueFormatter: (p) => cents(p.value) },
      {
        field: 'balanceCents',
        headerName: 'Balance',
        flex: 1,
        minWidth: 130,
        cellRenderer: (p: { data: Vault }) => <BalanceBar balanceCents={p.data.balanceCents} budgetCents={p.data.budgetCents} />,
      },
      { field: 'status', width: 125, cellRenderer: (p: { value: string }) => <Pill value={p.value} /> },
      {
        field: 'expiresAt',
        headerName: 'Expires in',
        width: 100,
        cellRenderer: (p: { data: Vault }) =>
          p.data.status === 'LIQUIDATED' ? <span className="muted">closed</span> : <Countdown iso={p.data.expiresAt} />,
      },
      {
        headerName: 'Agent',
        flex: 1,
        minWidth: 110,
        valueGetter: (p) =>
          p.data?.nextAgentRunAt
            ? `watching · next ${time(p.data.nextAgentRunAt)}`
            : p.data?.lastAgentOutcome
              ? label(p.data.lastAgentOutcome)
              : '',
      },
    ],
    [],
  );

  // Keep the grid's selection in step with the app (e.g. a vault just created, or ?vault= in the URL).
  useEffect(() => {
    const api = grid.current?.api;
    if (!api) return;
    const node = selectedId ? api.getRowNode(selectedId) : undefined;
    if (node && !node.isSelected()) {
      node.setSelected(true);
      api.ensureNodeVisible(node);
    }
  }, [selectedId, vaults]);

  return (
    <div className="grid" style={{ height: 300 }}>
      <AgGridReact<Vault>
        ref={grid}
        rowData={vaults}
        columnDefs={columns}
        getRowId={(p) => p.data.id}
        rowSelection={{ mode: 'singleRow', checkboxes: false, enableClickSelection: true }}
        onSelectionChanged={(e) => {
          const id = e.api.getSelectedRows()[0]?.id ?? null;
          if (id !== selectedId) onSelect(id);
        }}
        onFirstDataRendered={(e) => {
          const node = selectedId ? e.api.getRowNode(selectedId) : undefined;
          node?.setSelected(true);
        }}
        overlayNoRowsTemplate="No vaults yet. Describe one on the left to create it."
      />
    </div>
  );
}
