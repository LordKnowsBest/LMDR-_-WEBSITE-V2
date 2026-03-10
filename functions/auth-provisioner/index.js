import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { beforeUserCreated } from 'firebase-functions/v2/identity';
import { logger } from 'firebase-functions';

// ---------------------------------------------------------------------------
// Initialise Firebase Admin SDK (uses Application Default Credentials at
// runtime inside Cloud Functions).
// ---------------------------------------------------------------------------
initializeApp();

const CLOUD_RUN_API = 'https://lmdr-api-140035137711.us-central1.run.app';

// ---------------------------------------------------------------------------
// authProvisioner — blocking trigger that fires before a new user is created.
//
// Responsibilities:
//   1. Set default custom claims: { role, driverId, carrierId }
//   2. POST the new user record to the Cloud Run API for persistence in
//      Cloud SQL (airtable_v2_users or equivalent).
//
// Errors from the API call are caught and logged — we intentionally do NOT
// re-throw them so a transient backend failure never blocks user creation.
// ---------------------------------------------------------------------------
export const authProvisioner = beforeUserCreated(async (event) => {
  const user = event.data;
  const { uid: firebase_uid, email, displayName: display_name } = user;

  // --- 1. Set default custom claims ----------------------------------------
  const defaultClaims = {
    role: 'driver',
    driverId: null,
    carrierId: null,
  };

  try {
    await getAuth().setCustomUserClaims(firebase_uid, defaultClaims);
    logger.info('Custom claims set', { firebase_uid, claims: defaultClaims });
  } catch (claimError) {
    // Claims failure is non-fatal — log and continue.
    logger.error('Failed to set custom claims', {
      firebase_uid,
      error: claimError?.message ?? String(claimError),
    });
  }

  // --- 2. Register user in Cloud SQL via Cloud Run API ----------------------
  const payload = {
    firebase_uid,
    email: email ?? null,
    display_name: display_name ?? null,
    role: defaultClaims.role,
    created_at: new Date().toISOString(),
  };

  const internalKey = process.env.LMDR_INTERNAL_KEY;

  if (!internalKey) {
    logger.warn('LMDR_INTERNAL_KEY not set — skipping Cloud Run registration', {
      firebase_uid,
    });
    // Return without blocking — missing env var is a deploy config issue,
    // not a reason to deny user creation.
    return;
  }

  try {
    const response = await fetch(`${CLOUD_RUN_API}/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${internalKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '(no body)');
      logger.error('Cloud Run user registration failed', {
        firebase_uid,
        status: response.status,
        body,
      });
    } else {
      logger.info('User registered in Cloud SQL', {
        firebase_uid,
        email,
        status: response.status,
      });
    }
  } catch (apiError) {
    // Network / Cloud Run failure — log but do NOT block user creation.
    logger.error('Exception calling Cloud Run user registration', {
      firebase_uid,
      error: apiError?.message ?? String(apiError),
    });
  }
});
