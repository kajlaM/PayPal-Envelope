import { Router } from 'express';
import { prisma } from '@paypalvault/db';
import { HttpError } from '../http.ts';
import { onMoneyRequestEvent } from '../services/fund-requests.ts';

// Money requests from the friend's side ("Ask a friend"): the requests sent to a PayPal email.
//   GET  /api/fund-requests?payerEmail=<email>[&status=OPEN]
//   POST /api/fund-requests/:id/sync    asks PayPal whether it was paid

export const fundRequestsRouter = Router();

fundRequestsRouter.get('/', async (req, res) => {
  const payerEmail = typeof req.query.payerEmail === 'string' ? req.query.payerEmail.trim().toLowerCase() : '';
  if (!payerEmail) throw new HttpError(400, 'PAYER_EMAIL_REQUIRED');
  const status = req.query.status === 'OPEN' || req.query.status === 'PAID' || req.query.status === 'CANCELLED' ? req.query.status : undefined;
  const requests = await prisma.fundRequest.findMany({
    where: { payerEmail, ...(status ? { status } : {}) },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { vault: { select: { id: true, name: true, type: true, status: true, user: { select: { name: true, paypalEmail: true } } } } },
  });
  res.json(requests);
});

fundRequestsRouter.post('/:id/sync', async (req, res) => {
  const request = await prisma.fundRequest.findUnique({ where: { id: req.params.id } });
  if (!request) throw new HttpError(404, 'REQUEST_NOT_FOUND');
  res.json(await onMoneyRequestEvent(request.invoiceId));
});
