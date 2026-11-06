import type { Server } from 'socket.io';

// Live updates for the dashboard (Step 13). Each event carries the vault id so the UI can refetch.

export type PayPalVaultEvent = 'vault:updated' | 'decision:created' | 'ledger:updated' | 'agent:step' | 'policy:changed' | 'proposal:created' | 'savings:failed' | 'verify:mismatch';

type Payload = { vaultId: string; [key: string]: unknown };
type Listener = (event: PayPalVaultEvent, payload: Payload) => void;

let io: Server | undefined;
const listeners: Listener[] = [];

/** Server-side subscribers to every event (e.g. the Elastic audit log, Step 11). */
export const onEvent = (fn: Listener) => {
  listeners.push(fn);
};

export const setSocketServer = (server: Server) => {
  io = server;
};

export function emit(event: PayPalVaultEvent, payload: Payload) {
  io?.emit(event, payload);
  for (const fn of listeners) fn(event, payload);
}
