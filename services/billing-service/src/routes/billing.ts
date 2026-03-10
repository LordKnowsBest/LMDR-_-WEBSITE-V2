import { Router, Request, Response } from 'express';
import { authenticate } from '@lmdr/middleware';
import { createInvoice, getInvoice, listInvoices, updateInvoiceStatus } from '../services/invoices';
import { listRateCards, createRateCard } from '../services/rateCards';
import { getCarrierSubscription } from '../services/subscriptions';

const router = Router();
router.use(authenticate());

// POST /billing/invoices — create invoice
router.post('/invoices', async (req: Request, res: Response) => {
  try {
    const { carrierId, lineItems, dueDate } = req.body;
    const invoice = await createInvoice(carrierId, lineItems, dueDate);
    res.status(201).json({ data: invoice });
  } catch (err) {
    console.error('[billing/invoices/create]', (err as Error).message);
    res.status(500).json({ error: 'Create invoice failed', detail: (err as Error).message });
  }
});

// GET /billing/invoices/:id — get invoice
router.get('/invoices/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await getInvoice(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ data: invoice });
  } catch (err) {
    console.error('[billing/invoices/get]', (err as Error).message);
    res.status(500).json({ error: 'Get invoice failed', detail: (err as Error).message });
  }
});

// GET /billing/invoices?carrierId= — list invoices for carrier
router.get('/invoices', async (req: Request, res: Response) => {
  try {
    const carrierId = req.query.carrierId as string;
    if (!carrierId) return res.status(400).json({ error: 'carrierId query parameter is required' });
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const invoices = await listInvoices(carrierId, limit);
    res.json({ data: invoices });
  } catch (err) {
    console.error('[billing/invoices/list]', (err as Error).message);
    res.status(500).json({ error: 'List invoices failed', detail: (err as Error).message });
  }
});

// PUT /billing/invoices/:id/status — update invoice status
router.put('/invoices/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'sent', 'paid', 'overdue'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    const updated = await updateInvoiceStatus(req.params.id, status);
    if (!updated) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ data: updated });
  } catch (err) {
    console.error('[billing/invoices/status]', (err as Error).message);
    res.status(500).json({ error: 'Update status failed', detail: (err as Error).message });
  }
});

// GET /billing/rate-cards — list rate cards
router.get('/rate-cards', async (req: Request, res: Response) => {
  try {
    const carrierId = req.query.carrierId as string | undefined;
    const rateCards = await listRateCards(carrierId);
    res.json({ data: rateCards });
  } catch (err) {
    console.error('[billing/rate-cards/list]', (err as Error).message);
    res.status(500).json({ error: 'List rate cards failed', detail: (err as Error).message });
  }
});

// POST /billing/rate-cards — create rate card
router.post('/rate-cards', async (req: Request, res: Response) => {
  try {
    const rateCard = await createRateCard(req.body);
    res.status(201).json({ data: rateCard });
  } catch (err) {
    console.error('[billing/rate-cards/create]', (err as Error).message);
    res.status(500).json({ error: 'Create rate card failed', detail: (err as Error).message });
  }
});

// GET /billing/subscriptions/:carrierId — get carrier subscription status
router.get('/subscriptions/:carrierId', async (req: Request, res: Response) => {
  try {
    const subscription = await getCarrierSubscription(req.params.carrierId);
    if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
    res.json({ data: subscription });
  } catch (err) {
    console.error('[billing/subscriptions/get]', (err as Error).message);
    res.status(500).json({ error: 'Get subscription failed', detail: (err as Error).message });
  }
});

export default router;
