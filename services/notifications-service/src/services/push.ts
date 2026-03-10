import * as admin from 'firebase-admin';
import { logNotification } from './history';

// Lazy init pattern — same as @lmdr/middleware/src/auth.ts
let firebaseApp: admin.app.App | null = null;

function getFirebaseApp(): admin.app.App {
  if (!firebaseApp) {
    firebaseApp = admin.apps.length > 0
      ? admin.apps[0]!
      : admin.initializeApp({
          credential: admin.credential.applicationDefault(),
        });
  }
  return firebaseApp;
}

interface PushPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPush(payload: PushPayload) {
  const { token, title, body, data } = payload;

  try {
    const messaging = getFirebaseApp().messaging();

    const message: admin.messaging.Message = {
      token,
      notification: { title, body },
      ...(data && { data }),
    };

    const messageId = await messaging.send(message);
    await logNotification(token, 'push', title, 'sent');

    return {
      success: true,
      messageId,
    };
  } catch (err) {
    console.error('[push] FCM send failed:', (err as Error).message);
    await logNotification(token, 'push', title, 'failed');

    // Placeholder: don't throw for push failures, just return failure
    return {
      success: false,
      error: (err as Error).message,
    };
  }
}
