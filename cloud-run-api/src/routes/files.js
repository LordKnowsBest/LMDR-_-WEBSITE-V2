import { Router } from 'express';
import { Storage } from '@google-cloud/storage';

const router = Router();
const storage = new Storage();

/** Map short bucket aliases to full GCS bucket names. */
const BUCKET_MAP = {
  'driver-documents': 'lmdr-driver-documents',
  'carrier-assets':   'lmdr-carrier-assets',
  'static-assets':    'lmdr-static-assets',
  'ai-training-data': 'lmdr-ai-training-data',
};

const VALID_BUCKETS = new Set(Object.keys(BUCKET_MAP));

// ─── POST /v1/files/signed-url ───────────────────────────────────────────────
// Generate a v4 signed upload URL.
// Body: { bucket, filename, contentType }
router.post('/signed-url', async (req, res) => {
  const { bucket: bucketAlias, filename, contentType } = req.body ?? {};

  if (!bucketAlias || !filename || !contentType) {
    return res.status(400).json({
      error: 'Missing required fields: bucket, filename, contentType',
    });
  }

  if (!VALID_BUCKETS.has(bucketAlias)) {
    return res.status(400).json({
      error: `Invalid bucket "${bucketAlias}". Must be one of: ${[...VALID_BUCKETS].join(', ')}`,
    });
  }

  const bucketName = BUCKET_MAP[bucketAlias];
  const uid = req.auth?.uid || 'anonymous';
  const filePath = `uploads/${uid}/${Date.now()}-${filename}`;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  try {
    const [url] = await storage
      .bucket(bucketName)
      .file(filePath)
      .generateSignedPostPolicyV4({
        expires: expiresAt,
        conditions: [
          ['content-length-range', 0, 50 * 1024 * 1024], // 50 MB max
        ],
        fields: { 'Content-Type': contentType },
      });

    // generateSignedPostPolicyV4 returns a policy object; for a plain PUT URL
    // we use getSignedUrl instead.
    const [signedUrl] = await storage
      .bucket(bucketName)
      .file(filePath)
      .getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: expiresAt,
        contentType,
        extensionHeaders: {
          'x-goog-content-length-range': `0,${50 * 1024 * 1024}`,
        },
      });

    return res.status(200).json({
      url: signedUrl,
      filePath,
      bucket: bucketAlias,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error('[files] signed-url error:', err);
    return res.status(500).json({ error: 'Failed to generate signed URL', detail: err.message });
  }
});

// ─── GET /v1/files/download-url ──────────────────────────────────────────────
// Generate a v4 signed download URL.
// Query: ?bucket=driver-documents&filePath=uploads/uid/file.pdf
router.get('/download-url', async (req, res) => {
  const { bucket: bucketAlias, filePath } = req.query ?? {};

  if (!bucketAlias || !filePath) {
    return res.status(400).json({
      error: 'Missing required query params: bucket, filePath',
    });
  }

  if (!VALID_BUCKETS.has(bucketAlias)) {
    return res.status(400).json({
      error: `Invalid bucket "${bucketAlias}". Must be one of: ${[...VALID_BUCKETS].join(', ')}`,
    });
  }

  const bucketName = BUCKET_MAP[bucketAlias];

  try {
    // Check the file exists before generating a URL.
    const [exists] = await storage.bucket(bucketName).file(filePath).exists();
    if (!exists) {
      return res.status(404).json({ error: 'File not found', bucket: bucketAlias, filePath });
    }

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const [url] = await storage
      .bucket(bucketName)
      .file(filePath)
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: expiresAt,
      });

    return res.status(200).json({
      url,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error('[files] download-url error:', err);
    return res.status(500).json({ error: 'Failed to generate download URL', detail: err.message });
  }
});

export default router;
