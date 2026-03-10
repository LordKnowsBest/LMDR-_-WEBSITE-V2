import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { query } from '@lmdr/db';

let firebaseAdmin: typeof import('firebase-admin') | null = null;
let firebaseInitialized = false;

async function ensureFirebase(): Promise<typeof import('firebase-admin')> {
  if (firebaseInitialized && firebaseAdmin) return firebaseAdmin;
  const admin = await import('firebase-admin');
  if (!firebaseInitialized) {
    admin.default.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'ldmr-velocitymatch',
    });
    firebaseInitialized = true;
  }
  firebaseAdmin = admin.default as unknown as typeof import('firebase-admin');
  return firebaseAdmin;
}

export function parseBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

export function isApiKey(token: string | null): boolean {
  return !!(token?.startsWith('lmdr_live_') || token?.startsWith('lmdr_test_'));
}

async function hashApiKey(apiKey: string): Promise<string> {
  const pepper = process.env.API_KEY_PEPPER || '';
  return crypto.createHash('sha256').update(apiKey + pepper).digest('hex');
}

interface ApiKeyAuth {
  type: 'apiKey';
  partnerId: string;
  tier: string;
  partnerData: Record<string, unknown>;
}

interface FirebaseAuth {
  type: 'firebase';
  uid: string;
  email?: string;
  role: string;
  carrierId?: string;
  driverId?: string;
}

export type AuthInfo = ApiKeyAuth | FirebaseAuth;

async function resolveApiKey(token: string): Promise<ApiKeyAuth | null> {
  const hash = await hashApiKey(token);
  const result = await query(
    `SELECT _id, data FROM "airtable_api_partners" WHERE data->>'api_key_hash' = $1 LIMIT 1`,
    [hash]
  );
  if (result.rows.length === 0) return null;
  const partner = result.rows[0];
  return {
    type: 'apiKey',
    partnerId: partner._id,
    tier: (partner.data as Record<string, unknown>).tier as string || 'starter',
    partnerData: partner.data as Record<string, unknown>,
  };
}

async function resolveFirebaseToken(token: string): Promise<FirebaseAuth> {
  const admin = await ensureFirebase();
  const decoded = await (admin as any).auth().verifyIdToken(token);
  return {
    type: 'firebase',
    uid: decoded.uid,
    email: decoded.email,
    role: decoded.role || 'user',
    carrierId: decoded.carrierId,
    driverId: decoded.driverId,
  };
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthInfo;
}

export function authenticate({ optional = false } = {}) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = parseBearerToken(req.headers.authorization);

    if (!token) {
      if (optional) return next();
      return res.status(401).json({ error: 'Authorization header required' });
    }

    try {
      req.auth = isApiKey(token)
        ? (await resolveApiKey(token)) || undefined
        : await resolveFirebaseToken(token);

      if (!req.auth) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      next();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return res.status(401).json({ error: 'Authentication failed', detail: message });
    }
  };
}

export function requireAdmin() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.auth?.type === 'apiKey' || (req.auth?.type === 'firebase' && req.auth.role === 'admin')) {
      return next();
    }
    return res.status(403).json({ error: 'Admin access required' });
  };
}
