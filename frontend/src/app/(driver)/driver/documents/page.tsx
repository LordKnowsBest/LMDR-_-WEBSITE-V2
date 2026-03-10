'use client';

import { useState, useCallback } from 'react';
import { Card, Button, Badge, ProgressBar } from '@/components/ui';
import { driverApi } from '@/lib/api';
import { useApi, useMutation } from '@/lib/hooks';

/* ── Constants ── */
const DEMO_DRIVER_ID = 'demo-driver-001';

/* ── Types ── */
type DocStatus = 'verified' | 'pending' | 'missing' | 'expired';

interface DocItem {
  id: string; name: string; icon: string; status: DocStatus;
  uploadDate?: string; expiresAt?: string; fileName?: string;
}

/* ── Mock Fallback Data ── */
const mockDocuments: DocItem[] = [
  { id: '1', name: 'CDL License (Front)', icon: 'badge', status: 'verified', uploadDate: 'Feb 10, 2026', fileName: 'cdl_front_thompson.jpg' },
  { id: '2', name: 'CDL License (Back)', icon: 'badge', status: 'verified', uploadDate: 'Feb 10, 2026', fileName: 'cdl_back_thompson.jpg' },
  { id: '3', name: 'Medical Card (DOT Physical)', icon: 'medical_information', status: 'expired', uploadDate: 'Jun 15, 2025', expiresAt: 'Dec 15, 2025', fileName: 'medical_card.pdf' },
  { id: '4', name: 'MVR Report', icon: 'fact_check', status: 'pending', uploadDate: 'Mar 1, 2026', fileName: 'mvr_report_2026.pdf' },
  { id: '5', name: 'Employment History', icon: 'work_history', status: 'missing' },
  { id: '6', name: 'Drug Test Results', icon: 'science', status: 'pending', uploadDate: 'Mar 5, 2026', fileName: 'drug_test_results.pdf' },
  { id: '7', name: 'Training Certificates', icon: 'school', status: 'missing' },
  { id: '8', name: 'Background Check Authorization', icon: 'security', status: 'verified', uploadDate: 'Feb 12, 2026', fileName: 'bg_check_auth.pdf' },
];

const statusConfig: Record<DocStatus, { variant: 'success' | 'warning' | 'default' | 'error'; label: string; icon: string }> = {
  verified: { variant: 'success', label: 'Verified', icon: 'check_circle' },
  pending: { variant: 'warning', label: 'Pending Review', icon: 'schedule' },
  missing: { variant: 'default', label: 'Missing', icon: 'upload_file' },
  expired: { variant: 'error', label: 'Expired', icon: 'warning' },
};

export default function DriverDocumentsPage() {
  const [dragOver, setDragOver] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  /* ── API Data ── */
  const { data: docsData, loading, error, refresh } = useApi<Record<string, unknown>>(
    () => driverApi.getDocuments(DEMO_DRIVER_ID),
    [DEMO_DRIVER_ID]
  );

  const uploadMutation = useMutation<Record<string, unknown>>(
    useCallback((doc: Record<string, unknown>) => driverApi.registerDocument(DEMO_DRIVER_ID, doc), [])
  );

  /* ── Derive display values (API data with mock fallback) ── */
  const documents: DocItem[] = docsData?.documents
    ? (docsData.documents as DocItem[])
    : mockDocuments;

  const verified = documents.filter(d => d.status === 'verified').length;
  const total = documents.length;
  const expiring = documents.filter(d => d.status === 'expired');

  const handleUpload = async (docName: string) => {
    const result = await uploadMutation.execute({ name: docName, type: 'placeholder' });
    if (result !== null) {
      setUploadSuccess(true);
      refresh();
      setTimeout(() => setUploadSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Error Banner ── */}
      {(error || uploadMutation.error) && (
        <Card elevation="xs" className="!bg-red-50 dark:!bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500">warning</span>
              <p className="text-sm text-red-700 dark:text-red-300">
                {uploadMutation.error || 'Failed to load documents. Showing cached data.'}
              </p>
            </div>
            <Button variant="ghost" size="sm" icon="refresh" onClick={refresh}>Retry</Button>
          </div>
        </Card>
      )}

      {/* ── Upload Success Banner ── */}
      {uploadSuccess && (
        <Card elevation="xs" className="!bg-green-50 dark:!bg-green-500/10 border border-green-200 dark:border-green-500/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-green-500">check_circle</span>
            <p className="text-sm text-green-700 dark:text-green-300">Document registered successfully.</p>
          </div>
        </Card>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>My Documents</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--neu-text-muted)' }}>
            {loading ? 'Loading...' : `${verified} of ${total} documents verified`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ProgressBar value={verified} max={total} color="green" label="Completion" showValue className="w-40" />
          <Button variant="ghost" size="sm" icon="refresh" onClick={refresh}>Refresh</Button>
          <Button icon="upload_file">Upload New</Button>
        </div>
      </div>

      {/* ── Expiration Alerts ── */}
      {expiring.length > 0 && (
        <Card elevation="xs" className="animate-fade-up stagger-1 !bg-red-50 dark:!bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-red-500 text-[24px] mt-0.5">warning</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-800 dark:text-red-300">Document Expiration Alert</p>
              <div className="mt-2 space-y-1">
                {expiring.map(doc => (
                  <p key={doc.id} className="text-xs text-red-700 dark:text-red-400">
                    <span className="font-semibold">{doc.name}</span> expired on {doc.expiresAt}
                    <Button variant="ghost" size="sm" className="ml-2 !text-red-600 !px-2 !py-0.5" onClick={() => handleUpload(doc.name)}>Re-upload</Button>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── Upload Drop Zone ── */}
      <Card
        inset
        className={`animate-fade-up stagger-2 border-2 border-dashed transition-all duration-300 cursor-pointer ${
          dragOver
            ? 'border-[var(--neu-accent)] bg-[var(--neu-accent)]/5'
            : 'border-[var(--neu-border)]'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
      >
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="neu-x w-16 h-16 rounded-2xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]" style={{ color: 'var(--neu-accent)' }}>
              cloud_upload
            </span>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
              Drag & drop files here
            </p>
            <p className="text-[11px] mt-1" style={{ color: 'var(--neu-text-muted)' }}>
              or click to browse &middot; PDF, JPG, PNG up to 10MB
            </p>
          </div>
          <Button variant="secondary" size="sm" icon="folder_open">Browse Files</Button>
        </div>
      </Card>

      {/* ── Loading Skeleton ── */}
      {loading && !docsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} elevation="sm" className="animate-pulse">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[var(--neu-border)]" />
                  <div className="w-20 h-5 rounded bg-[var(--neu-border)]" />
                </div>
                <div className="h-4 w-36 rounded bg-[var(--neu-border)]" />
                <div className="h-3 w-28 rounded bg-[var(--neu-border)]" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Document Cards Grid ── */}
      {(!loading || docsData) && (
        <div>
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--neu-text)' }}>All Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc, i) => {
              const cfg = statusConfig[doc.status];
              return (
                <Card
                  key={doc.id}
                  elevation="sm"
                  hover
                  className={`animate-fade-up stagger-${Math.min(i + 1, 8)}`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Icon + Status */}
                    <div className="flex items-start justify-between">
                      <div className="neu-x w-12 h-12 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-[24px]" style={{ color: 'var(--neu-accent)' }}>
                          {doc.icon}
                        </span>
                      </div>
                      <Badge variant={cfg.variant} icon={cfg.icon}>{cfg.label}</Badge>
                    </div>

                    {/* Doc Name */}
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>{doc.name}</p>
                      {doc.fileName && (
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
                          {doc.fileName}
                        </p>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="space-y-1">
                      {doc.uploadDate && (
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-text-muted)' }}>calendar_today</span>
                          <span className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>Uploaded {doc.uploadDate}</span>
                        </div>
                      )}
                      {doc.expiresAt && (
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[14px] text-red-500">event_busy</span>
                          <span className="text-[11px] text-red-500 font-semibold">Expired {doc.expiresAt}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-1">
                      {doc.status === 'missing' ? (
                        <Button size="sm" icon="upload_file" className="w-full" onClick={() => handleUpload(doc.name)}
                          disabled={uploadMutation.loading}>
                          {uploadMutation.loading ? 'Uploading...' : 'Upload'}
                        </Button>
                      ) : doc.status === 'expired' ? (
                        <Button size="sm" variant="danger" icon="refresh" className="w-full" onClick={() => handleUpload(doc.name)}
                          disabled={uploadMutation.loading}>
                          {uploadMutation.loading ? 'Uploading...' : 'Re-upload'}
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" icon="visibility" className="w-full">View</Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
