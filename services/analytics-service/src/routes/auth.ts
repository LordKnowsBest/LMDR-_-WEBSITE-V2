import { Router, Request, Response } from 'express';
import { authenticate, requireAdmin } from '@lmdr/middleware';
import { getUserRoles, assignRole, removeRole, listAllRoles } from '../services/roleManager';

const router = Router();
router.use(authenticate());

// GET /auth/roles/:uid — get roles for a user
router.get('/roles/:uid', async (req: Request, res: Response) => {
  try {
    const roles = await getUserRoles(req.params.uid);
    res.json({ data: roles });
  } catch (err) {
    console.error('[auth/roles/:uid]', (err as Error).message);
    res.status(500).json({ error: 'Failed to get roles', detail: (err as Error).message });
  }
});

// POST /auth/roles — assign a role { uid, role, carrierId?, driverId?, grantedBy }
router.post('/roles', requireAdmin(), async (req: Request, res: Response) => {
  try {
    const { uid, role, carrierId, driverId, grantedBy } = req.body;
    if (!uid || !role || !grantedBy) {
      return res.status(400).json({ error: 'uid, role, and grantedBy are required' });
    }
    const record = await assignRole(uid, role, carrierId, driverId, grantedBy);
    res.status(201).json({ data: record });
  } catch (err) {
    console.error('[auth/roles/assign]', (err as Error).message);
    res.status(500).json({ error: 'Failed to assign role', detail: (err as Error).message });
  }
});

// DELETE /auth/roles/:uid/:role — remove a role
router.delete('/roles/:uid/:role', requireAdmin(), async (req: Request, res: Response) => {
  try {
    const removed = await removeRole(req.params.uid, req.params.role);
    if (!removed) return res.status(404).json({ error: 'Role assignment not found' });
    res.json({ data: { removed: true } });
  } catch (err) {
    console.error('[auth/roles/remove]', (err as Error).message);
    res.status(500).json({ error: 'Failed to remove role', detail: (err as Error).message });
  }
});

// GET /auth/roles — list all role assignments (admin only)
router.get('/roles', requireAdmin(), async (req: Request, res: Response) => {
  try {
    const roles = await listAllRoles();
    res.json({ data: roles });
  } catch (err) {
    console.error('[auth/roles/list]', (err as Error).message);
    res.status(500).json({ error: 'Failed to list roles', detail: (err as Error).message });
  }
});

export default router;
