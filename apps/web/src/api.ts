import type { AgentRun, CompileResult, CopilotAnswer, Decision, LedgerEntry, Policy, Vault } from './types.ts';

export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public status: number, public code: string, public body: Record<string, unknown>) {
    super(code);
  }
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? res.statusText, data);
  return data as T;
}

/** A short message for the UI, e.g. "POLICY_NOT_UNDERSTOOD: no budget given". */
export function errorText(err: unknown): string {
  if (err instanceof ApiError) {
    const detail = err.body.message ?? (Array.isArray(err.body.reasons) ? err.body.reasons.join(', ') : undefined);
    return detail ? `${err.code}: ${detail}` : err.code;
  }
  return err instanceof Error ? err.message : String(err);
}

const v = (id: string) => `/api/vaults/${encodeURIComponent(id)}`;

export const api = {
  vaults: () => request<Vault[]>('/api/vaults'),
  decisions: () => request<Decision[]>('/api/decisions'),
  ledger: () => request<LedgerEntry[]>('/api/ledger'),

  compile: (text: string) => request<CompileResult>('/api/vaults/compile', { text }),
  createVault: (policy: Policy, sourceText?: string) => request<Vault>('/api/vaults', { policy, sourceText }),

  fundOrder: (id: string) => request<{ orderId: string }>(`${v(id)}/fund/order`, {}),
  fundCapture: (id: string, orderId: string) => request<Vault>(`${v(id)}/fund/capture`, { orderId }),
  subscribe: (id: string) => request<{ planId: string; customId: string }>(`${v(id)}/subscribe`, {}),
  subscribeConfirm: (id: string, subscriptionId: string) => request(`${v(id)}/subscribe/confirm`, { subscriptionId }),

  runAgent: (id: string, task?: string) => request<AgentRun>(`${v(id)}/agent`, task ? { task } : {}),
  stopAgent: (id: string) => request(`${v(id)}/agent/stop`, {}),
  approve: (vaultId: string, decisionId: string) => request(`${v(vaultId)}/decisions/${decisionId}/approve`, {}),
  reject: (vaultId: string, decisionId: string) => request(`${v(vaultId)}/decisions/${decisionId}/reject`, {}),
  liquidate: (id: string) => request(`${v(id)}/liquidate`, {}),
  sync: (id: string) => request(`${v(id)}/sync`, {}),

  ask: (question: string, vaultId?: string) => request<CopilotAnswer>('/api/audit/ask', { question, vaultId }),
};
