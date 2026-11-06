import { Router } from 'express';
import { askAudit, auditEnabled, searchAudit } from '@paypalvault/audit';
import { AuditAskBody, AuditSearchQuery } from '../api-schemas.ts';
import { HttpError, requireInternalKey } from '../http.ts';
import { reindexAll } from '../services/audit.ts';

// Audit search and Audit Copilot (Step 11).

export const auditRouter = Router();

auditRouter.use((_req, _res, next) => {
  if (!auditEnabled()) throw new HttpError(503, 'AUDIT_NOT_CONFIGURED');
  next();
});

auditRouter.get('/search', async (req, res) => {
  const { q, vaultId } = AuditSearchQuery.parse(req.query);
  res.json(await searchAudit(q, { vaultId }));
});

/** Audit Copilot: a question in plain English -> an answer citing the audit records it used. */
auditRouter.post('/ask', async (req, res) => {
  const { question, vaultId } = AuditAskBody.parse(req.body);
  res.json(await askAudit(question, { vaultId }));
});

auditRouter.post('/reindex', requireInternalKey, async (_req, res) => {
  res.json(await reindexAll());
});
