// Express API: vault routes, webhooks, Socket.IO (Steps 5, 9)
import { createServer } from 'node:http';
import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';
import { prisma } from '@kubepay/db';
import { setSocketServer } from './events.ts';
import { errorHandler, requireInternalKey } from './http.ts';
import { auditRouter } from './routes/audit.ts';
import { demoStoreRouter } from './routes/demo-store.ts';
import { fundRequestsRouter } from './routes/fund-requests.ts';
import { vaultsRouter } from './routes/vaults.ts';
import { startAuditLog } from './services/audit.ts';
import { startNotifications } from './services/notify.ts';
import { startBackgroundJobs, tick } from './services/scheduler.ts';
import { webhooksRouter } from './webhooks.ts';

const app = express();
app.use(cors());
app.use('/webhooks', webhooksRouter); // before express.json: needs the raw body
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});
app.use('/api/vaults', vaultsRouter);
app.use('/api/fund-requests', fundRequestsRouter);
app.use('/demo-store', demoStoreRouter);
app.use('/api/audit', auditRouter);
// One background tick (sweeper + agent watch) for a cron job; the server also runs it every minute.
app.post('/api/jobs/tick', requireInternalKey, async (_req, res) => {
  res.json(await tick());
});
app.get('/api/merchants', async (_req, res) => {
  res.json(await prisma.merchant.findMany({ orderBy: { name: 'asc' } }));
});
app.get('/api/ledger', async (req, res) => {
  const vaultId = typeof req.query.vaultId === 'string' ? req.query.vaultId : undefined;
  res.json(await prisma.ledgerEntry.findMany({ where: { vaultId }, orderBy: { createdAt: 'desc' }, include: { merchant: true }, take: 500 }));
});
app.get('/api/decisions', async (req, res) => {
  const vaultId = typeof req.query.vaultId === 'string' ? req.query.vaultId : undefined;
  res.json(await prisma.decision.findMany({ where: { vaultId }, orderBy: { createdAt: 'desc' }, take: 500 }));
});
app.use(errorHandler);

const server = createServer(app);
setSocketServer(new Server(server, { cors: { origin: '*' } }));

const port = Number(process.env.PORT ?? 4000);
server.listen(port, () => {
  console.log(`KubePay API on http://localhost:${port}`);
  startBackgroundJobs();
  startNotifications();
  startAuditLog().catch((err) => console.error('Audit log failed to start:', (err as Error).message));
});
