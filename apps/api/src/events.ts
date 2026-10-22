import type { Server } from 'socket.io';

// Live updates for the dashboard (Step 13). Each event carries the vault id so the UI can refetch.

export type KubePayEvent = 'vault:updated' | 'decision:created' | 'ledger:updated' | 'agent:step';

type Payload = { vaultId: string; [key: string]: unknown };
type Listener = (event: KubePayEvent, payload: Payload) => void;

let io: Server | undefined;
const listeners: Listener[] = [];

/** Server-side subscribers to every event (e.g. the Elastic audit log, Step 11). */
export const onEvent = (fn: Listener) => {
  listeners.push(fn);
};

export const setSocketServer = (server: Server) => {
  io = server;
};

export function emit(event: KubePayEvent, payload: Payload) {
  io?.emit(event, payload);
  for (const fn of listeners) fn(event, payload);
}
