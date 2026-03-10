import crypto from 'crypto';
import { query } from '../db/pool.js';

let firebaseAdmin = null;
let firebaseInitialized = false;

async function ensureFirebase() {
  if (firebaseInitialized) return firebaseAdmin;
  try {
    const admin = await import('firebase-admin');
    firebaseAdmin = admin.default;
    firebaseAdmin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'ldmr-velocitymatch',
    });
    firebaseInitialized = true;
    return firebaseAdmin;
  } catch (err) {
    console.error('Firebase Admin init failed:', err.message);
    throw err;
  }
}

export function parseBearerToken(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

export function isApiKey(token) {
  return !!(token?.startsWith('lmdr_live_') || token?.startsWith('lmdr_test_'));
}

async function hashApiKey(apiKey) {
  const pepper = process.env.API_KEY_PEPPER || '';
  return crypto.createHash('sha256').update(apiKey + pepper).digest('hex');
}

async function resolveApiKey(token) {
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
    tier: partner.data.tier || 'starter',
    partnerData: partner.data,
  };
}

async function resolveFirebaseToken(token) {
  const admin = await ensureFirebase();
  const decoded = await admin.auth().verifyIdToken(token);
  return {
    type: 'firebase',
    uid: decoded.uid,
    email: decoded.email,
    role: decoded.role || 'user',
    carrierId: decoded.carrierId,
    driverId: decoded.driverId,
  };
}

/**
 * Express middleware. Attaches req.auth on success, returns 401 on failure.
 * Set options.optional = true to allow unauthenticated requests through.
 */
export function authenticate({ optional = false } = {}) {
  return async (req, res, next) => {
    const token = parseBearerToken(req.headers.authorization);

    if (!token) {
      if (optional) return next();
      return res.status(401).json({ error: 'Authorization header required' });
    }

    try {
      req.auth = isApiKey(token)
        ? await resolveApiKey(token)
        : await resolveFirebaseToken(token);

      if (!req.auth) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Authentication failed', detail: err.message });
    }
  };
}

/** Guard that requires admin role */
export function requireAdmin() {
  return (req, res, next) => {
    if (req.auth?.role !== 'admin' && req.auth?.type !== 'apiKey') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };
}
