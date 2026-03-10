import { Router, Request, Response } from 'express';
import { authenticate } from '@lmdr/middleware';
import { getDocuments, registerDocument, updateDocumentStatus } from '../services/documents';

const router = Router();
router.use(authenticate());

// GET /drivers/:id/documents
router.get('/:id/documents', async (req: Request, res: Response) => {
  try {
    const docs = await getDocuments(req.params.id);
    res.json({ data: docs });
  } catch (err) {
    console.error('[documents/list]', (err as Error).message);
    res.status(500).json({ error: 'Failed to list documents', detail: (err as Error).message });
  }
});

// POST /drivers/:id/documents — register document metadata
router.post('/:id/documents', async (req: Request, res: Response) => {
  try {
    const doc = await registerDocument(req.params.id, req.body);
    res.status(201).json({ data: doc });
  } catch (err) {
    console.error('[documents/register]', (err as Error).message);
    res.status(500).json({ error: 'Document registration failed', detail: (err as Error).message });
  }
});

// PUT /drivers/:driverId/documents/:docId/status
router.put('/:driverId/documents/:docId/status', async (req: Request, res: Response) => {
  try {
    const result = await updateDocumentStatus(req.params.docId, req.body.status);
    if (!result) return res.status(404).json({ error: 'Document not found' });
    res.json({ data: result });
  } catch (err) {
    console.error('[documents/update-status]', (err as Error).message);
    res.status(500).json({ error: 'Status update failed', detail: (err as Error).message });
  }
});

export default router;
