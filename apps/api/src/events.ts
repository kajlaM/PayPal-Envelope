import type { Server } from 'socket.io';

// Live updates for the dashboard (Step 13). Each event carries the vault id so the UI can refetch.

export type KubePayEvent = 'vault:updated' | 'decision:created' | 'ledger:updated' | 'agent:step';

let io: Server | undefined;

export const setSocketServer = (server: Server) => {
  io = server;
};

export function emit(event: KubePayEvent, payload: { vaultId: string; [key: string]: unknown }) {
  io?.emit(event, payload);
}
