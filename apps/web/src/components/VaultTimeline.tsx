import { useMemo } from 'react';
import { BryntumScheduler } from '@bryntum/scheduler-react-enterprise';
import '@bryntum/core-enterprise/fontawesome/css/fontawesome.css';
import '@bryntum/core-enterprise/fontawesome/css/solid.css';
import '@bryntum/scheduler-enterprise/scheduler.css';
import '@bryntum/scheduler-enterprise/svalbard-light.css';
import { cents } from '../format.ts';
import type { LedgerEntry, Vault } from '../types.ts';

const HOUR = 3_600_000;

const statusColor: Record<Vault['status'], string> = {
  PENDING_FUNDING: 'orange',
  SAVING: 'violet',
  ACTIVE: 'blue',
  EXPIRED: 'gray',
  LIQUIDATED: 'green',
};
const entryColor: Record<LedgerEntry['status'], string> = { PENDING: 'orange', COMPLETED: 'teal', FAILED: 'red' };

/** Each vault as a bar from creation to expiry (or to its refund), with every payout marked on it. */
export function VaultTimeline({ vaults, ledger }: { vaults: Vault[]; ledger: LedgerEntry[] }) {
  const { resources, events, startDate, endDate, viewPreset } = useMemo(() => {
    const ends = new Map(vaults.map((v) => [v.id, v.status === 'LIQUIDATED' ? v.updatedAt : v.expiresAt]));
    const resources = vaults.map((v) => ({ id: v.id, name: v.name }));
    const events = [
      ...vaults.map((v) => ({
        id: `vault-${v.id}`,
        resourceId: v.id,
        name: `${v.name} · ${v.status.replaceAll('_', ' ').toLowerCase()}`,
        startDate: new Date(v.createdAt),
        endDate: new Date(ends.get(v.id)!),
        eventColor: statusColor[v.status],
      })),
      ...ledger
        .filter((e) => e.type !== 'FUND' && ends.has(e.vaultId))
        .map((e) => ({
          id: `ledger-${e.id}`,
          resourceId: e.vaultId,
          name: `${e.type === 'SPEND' ? `Paid ${e.merchant?.name ?? ''}` : 'Refund'} ${cents(e.amountCents)}`,
          startDate: new Date(e.createdAt),
          endDate: new Date(e.createdAt), // zero length = milestone marker
          eventColor: entryColor[e.status],
        })),
    ];
    const times = events.flatMap((e) => [e.startDate.getTime(), e.endDate.getTime()]);
    const start = times.length ? Math.min(...times) : Date.now() - 12 * HOUR;
    const end = times.length ? Math.max(...times, Date.now()) : Date.now() + 12 * HOUR;
    const spanDays = (end - start) / (24 * HOUR);
    return {
      resources,
      events,
      startDate: new Date(start - HOUR),
      endDate: new Date(end + HOUR),
      viewPreset: spanDays <= 2 ? 'hourAndDay' : spanDays <= 21 ? 'dayAndWeek' : 'weekAndMonth',
    };
  }, [vaults, ledger]);

  return (
    <div className="timeline">
      <BryntumScheduler
        resources={resources}
        events={events}
        startDate={startDate}
        endDate={endDate}
        viewPreset={viewPreset}
        columns={[{ text: 'Vault', field: 'name', width: 190 }]}
        rowHeight={44}
        barMargin={6}
        readOnly
        eventMenuFeature={false}
        scheduleMenuFeature={false}
        cellEditFeature={false}
        timeRangesFeature={{ showCurrentTimeLine: true }}
      />
    </div>
  );
}
