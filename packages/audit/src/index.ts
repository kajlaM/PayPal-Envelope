// Audit log, anomaly score, and Audit Copilot on Elasticsearch (Step 11)
export { AUDIT_INDEX, auditEnabled } from './client.ts';
export { describeDecision, describeLedger, REASON_TEXT, type DecisionInput, type LedgerInput } from './describe.ts';
export { ensureAuditIndex, indexDecision, indexLedger, searchAudit, type AuditHit } from './store.ts';
export { anomalyScore, scoreAnomaly, spendHistory, type AnomalyResult, type SpendHistory } from './anomaly.ts';
export { askAudit, type CopilotAnswer } from './copilot.ts';
