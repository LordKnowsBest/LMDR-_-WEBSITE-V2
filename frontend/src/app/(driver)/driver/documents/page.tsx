'use client';
import { useState } from 'react';
import { Card, Button, Badge } from '@/components/ui';

interface Doc {
  id: string;
  docType: string;
  fileName: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'expired';
  uploadedAt: string;
}

const statusVariant = {
  pending_review: 'warning' as const,
  approved: 'success' as const,
  rejected: 'error' as const,
  expired: 'default' as const,
};

const requiredDocs = [
  { type: 'cdl_front', label: 'CDL Front' },
  { type: 'cdl_back', label: 'CDL Back' },
  { type: 'medical_card', label: 'Medical Card' },
  { type: 'mvr', label: 'Motor Vehicle Record' },
];

export default function DriverDocumentsPage() {
  const [documents, setDocuments] = useState<Doc[]>([]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-lmdr-dark">My Documents</h2>
        <Button>
          <span className="material-symbols-outlined text-[18px] mr-2">upload_file</span>
          Upload Document
        </Button>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-lmdr-dark mb-4">Required Documents</h3>
        <div className="space-y-3">
          {requiredDocs.map((doc) => {
            const uploaded = documents.find(d => d.docType === doc.type);
            return (
              <div key={doc.type} className="flex items-center justify-between py-3 border-b border-tan/10 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-tan">description</span>
                  <div>
                    <p className="text-sm font-medium text-lmdr-dark">{doc.label}</p>
                    {uploaded && <p className="text-xs text-tan">{uploaded.fileName}</p>}
                  </div>
                </div>
                {uploaded ? (
                  <Badge variant={statusVariant[uploaded.status]}>{uploaded.status.replace('_', ' ')}</Badge>
                ) : (
                  <Badge variant="default">Not Uploaded</Badge>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {documents.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-lmdr-dark mb-4">All Uploaded Documents</h3>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-lmdr-dark">{doc.fileName}</span>
                <Badge variant={statusVariant[doc.status]}>{doc.status.replace('_', ' ')}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
