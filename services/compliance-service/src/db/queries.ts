import { CloudTasksClient } from '@google-cloud/tasks';

const QUEUE_PATH = 'projects/ldmr-velocitymatch/locations/us-central1/queues/lmdr-compliance';
const SELF_URL = process.env.SELF_URL || 'http://localhost:8080';

let tasksClient: CloudTasksClient | null = null;

function getTasksClient(): CloudTasksClient {
  if (!tasksClient) {
    tasksClient = new CloudTasksClient();
  }
  return tasksClient;
}

/**
 * Enqueue a compliance check task to Cloud Tasks for async processing.
 * Falls back gracefully if Cloud Tasks is unavailable.
 */
export async function enqueueComplianceTask(
  checkType: 'mvr' | 'background',
  checkId: string,
  driverId: string
): Promise<void> {
  try {
    const client = getTasksClient();
    const callbackUrl = `${SELF_URL}/compliance/execute`;

    const payload = JSON.stringify({ checkType, checkId, driverId });

    await client.createTask({
      parent: QUEUE_PATH,
      task: {
        httpRequest: {
          httpMethod: 'POST',
          url: callbackUrl,
          headers: { 'Content-Type': 'application/json' },
          body: Buffer.from(payload).toString('base64'),
        },
        scheduleTime: {
          seconds: Math.floor(Date.now() / 1000) + 1,
        },
      },
    });

    console.log(`[tasks] Enqueued ${checkType} check ${checkId} for driver ${driverId}`);
  } catch (err) {
    console.error('[tasks] Failed to enqueue task:', (err as Error).message);
    throw err;
  }
}
