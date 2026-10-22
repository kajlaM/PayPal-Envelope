import { useCallback, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { api, API_URL, errorText } from './api.ts';
import type { AgentStep, Decision, LedgerEntry, Vault } from './types.ts';

// Loads vaults, decisions and the ledger, and reloads them whenever the API emits a Socket.IO event
// (several events in a row cause one reload). Agent tool calls are streamed in as they happen.

const MAX_STEPS = 200;

export function useLiveData() {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const refresh = useCallback(async () => {
    try {
      const [v, d, l] = await Promise.all([api.vaults(), api.decisions(), api.ledger()]);
      setVaults(v);
      setDecisions(d);
      setLedger(l);
      setError(null);
    } catch (err) {
      setError(`Cannot reach the API at ${API_URL} (${errorText(err)})`);
    }
  }, []);

  useEffect(() => {
    const later = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(refresh, 250);
    };
    refresh();
    const socket = io(API_URL);
    socket.on('connect', () => {
      setConnected(true);
      later(); // catch up on anything missed while disconnected
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('vault:updated', later);
    socket.on('decision:created', later);
    socket.on('ledger:updated', later);
    socket.on('agent:step', (step: Omit<AgentStep, 'at'>) =>
      setSteps((prev) => [...prev, { ...step, at: new Date().toISOString() }].slice(-MAX_STEPS)),
    );
    return () => {
      clearTimeout(timer.current);
      socket.disconnect();
    };
  }, [refresh]);

  return { vaults, decisions, ledger, steps, connected, error, refresh };
}
