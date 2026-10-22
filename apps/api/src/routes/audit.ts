import { Router } from 'express';
import { z } from 'zod';
import { askAudit, auditEnabled, searchAudit } from '@kubepay/audit';
import { HttpError, requireInternalKey } from '../http.ts';
import { reindexAll } from '../services/audit.ts';

// Audit search and Audit Copilot (Step 11).

export const auditRouter = Router();

auditRouter.use((_req, _res, next) => {
  if (!auditEnabled()) throw new HttpError(503, 'AUDIT_NOT_CONFIGURED');
  next();
});

auditRouter.get('/search', async (req, res) => {
  const { q, vaultId } = z.object({ q: z.string().min(2).max(300), vaultId: z.string().optional() }).parse(req.query);
  res.json(await searchAudit(q, { vaultId }));
});

/** Audit Copilot: a question in plain English -> an answer citing the audit records it used. */
auditRouter.post('/ask', async (req, res) => {
  const { question, vaultId } = z.object({ question: z.string().min(3).max(500), vaultId: z.string().optional() }).parse(req.body);
  res.json(await askAudit(question, { vaultId }));
});

auditRouter.post('/reindex', requireInternalKey, async (_req, res) => {
  res.json(await reindexAll());
});
