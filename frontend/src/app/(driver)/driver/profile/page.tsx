'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Input, Badge } from '@/components/ui';
import { getProfile, updateProfile } from '../../actions/profile';
import { listDocuments, getSignedUploadUrl, uploadDocument, deleteDocument } from '../../actions/documents';
import { useApi, useMutation } from '@/lib/hooks';

/* ── Constants ── */
const DEMO_DRIVER_ID = 'demo-driver-001';

/* ── Mock Fallback Data ── */
const endorsementOptions = [
  { code: 'H', label: 'Hazmat' },
  { code: 'N', label: 'Tanker' },
  { code: 'T', label: 'Doubles/Triples' },
  { code: 'P', label: 'Passenger' },
  { code: 'S', label: 'School Bus' },
  { code: 'X', label: 'Hazmat + Tanker' },
];

const truckTypes = ['Dry Van', 'Reefer', 'Flatbed', 'Tanker', 'LTL', 'Intermodal', 'Auto Hauler'];
const routeTypes = ['OTR (Over the Road)', 'Regional', 'Local', 'Dedicated', 'Team'];

const mockProfile = {
  firstName: 'Marcus', lastName: 'Thompson',
  email: 'marcus.t@email.com', phone: '(214) 555-0187',
  cdlClass: 'A', cdlState: 'TX',
  endorsements: ['H', 'T'] as string[],
  yearsExperience: '8',
  preferredTruck: 'Dry Van', preferredRoute: 'Regional',
  homeCity: 'Dallas', homeState: 'TX', homeZip: '75201',
};

/* ── Document type metadata ── */
const DOC_TYPE_META: Record<string, { label: string; icon: string }> = {
  cdl: { label: 'CDL License', icon: 'badge' },
  medical_card: { label: 'Medical Card (DOT)', icon: 'medical_information' },
  mvr: { label: 'MVR (Motor Vehicle Report)', icon: 'description' },
  employment_history: { label: 'Employment History', icon: 'work_history' },
  drug_test: { label: 'Drug Test Results', icon: 'biotech' },
  training_cert: { label: 'Training Certificate', icon: 'school' },
  background_check: { label: 'Background Check', icon: 'fact_check' },
  w9: { label: 'W-9 Tax Form', icon: 'receipt_long' },
};

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function DriverProfilePage() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(mockProfile);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadDocType, setUploadDocType] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── API Data ── */
  const { data: profileData, loading, error, refresh } = useApi<Record<string, unknown>>(
    () => getProfile(DEMO_DRIVER_ID).then(d => ({ data: d as Record<string, unknown> })),
    [DEMO_DRIVER_ID]
  );

  /* ── Documents API ── */
  const { data: docsData, loading: docsLoading, refresh: refreshDocs } = useApi<{ items: Array<Record<string, unknown>>; totalCount: number }>(
    () => listDocuments(DEMO_DRIVER_ID).then(d => ({ data: d as unknown as { items: Array<Record<string, unknown>>; totalCount: number } })),
    [DEMO_DRIVER_ID]
  );

  const documents = (docsData?.items || []) as Array<Record<string, unknown>>;

  /* ── File upload handler ── */
  const handleFileUpload = useCallback(async (file: File, docType?: string) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Unsupported file type. Please upload PDF, JPG, or PNG.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File too large. Maximum 10 MB.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // 1. Get signed upload URL from Cloud Run
      const { url, filePath } = await getSignedUploadUrl(file.name, file.type);

      // 2. Upload file directly to GCS
      const uploadRes = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error(`Upload failed (${uploadRes.status})`);

      // 3. Record document in database
      const resolvedType = docType || uploadDocType || 'training_cert';
      await uploadDocument(DEMO_DRIVER_ID, {
        docType: resolvedType,
        fileName: file.name,
        fileUrl: filePath,
      });

      // 4. Refresh document list
      refreshDocs();
      setUploadDocType(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [uploadDocType, refreshDocs]);

  /* ── Drag & drop handlers ── */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }, [handleFileUpload]);

  const handleDeleteDoc = useCallback(async (docId: string) => {
    try {
      await deleteDocument(DEMO_DRIVER_ID, docId);
      refreshDocs();
    } catch {
      setUploadError('Failed to delete document');
    }
  }, [refreshDocs]);

  const saveMutation = useMutation<Record<string, unknown>>(
    useCallback((data: Record<string, unknown>) =>
      updateProfile(DEMO_DRIVER_ID, data).then(d => ({ data: d as Record<string, unknown> })), [])
  );

  /* ── Sync API data into local state (API returns snake_case fields) ── */
  useEffect(() => {
    if (profileData) {
      setProfile({
        firstName: (profileData.first_name as string) || mockProfile.firstName,
        lastName: (profileData.last_name as string) || mockProfile.lastName,
        email: (profileData.email as string) || mockProfile.email,
        phone: (profileData.phone as string) || mockProfile.phone,
        cdlClass: (profileData.cdl_class as string) || mockProfile.cdlClass,
        cdlState: (profileData.cdl_state as string) || mockProfile.cdlState,
        endorsements: (profileData.endorsements as string[]) || mockProfile.endorsements,
        yearsExperience: String((profileData.years_experience as number) ?? mockProfile.yearsExperience),
        preferredTruck: (profileData.preferred_truck as string) || mockProfile.preferredTruck,
        preferredRoute: (profileData.preferred_route as string) || mockProfile.preferredRoute,
        homeCity: (profileData.home_city as string) || mockProfile.homeCity,
        homeState: (profileData.home_state as string) || mockProfile.homeState,
        homeZip: (profileData.home_zip as string) || mockProfile.homeZip,
      });
    }
  }, [profileData]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfile(p => ({ ...p, [field]: e.target.value }));
  };

  const toggleEndorsement = (code: string) => {
    if (!editing) return;
    setProfile(p => ({
      ...p,
      endorsements: p.endorsements.includes(code)
        ? p.endorsements.filter(e => e !== code)
        : [...p.endorsements, code],
    }));
  };

  const handleSave = async () => {
    // Convert camelCase UI state to snake_case fields the API expects
    const payload = {
      first_name: profile.firstName,
      last_name: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      cdl_class: profile.cdlClass,
      cdl_state: profile.cdlState,
      endorsements: profile.endorsements,
      years_experience: Number(profile.yearsExperience) || 0,
      preferred_truck: profile.preferredTruck,
      preferred_route: profile.preferredRoute,
      home_city: profile.homeCity,
      home_state: profile.homeState,
      home_zip: profile.homeZip,
    };
    const result = await saveMutation.execute(payload);
    if (result !== null) {
      setSaveSuccess(true);
      setEditing(false);
      refresh();
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    // Reset to API data or mock (API returns snake_case)
    if (profileData) {
      setProfile({
        firstName: (profileData.first_name as string) || mockProfile.firstName,
        lastName: (profileData.last_name as string) || mockProfile.lastName,
        email: (profileData.email as string) || mockProfile.email,
        phone: (profileData.phone as string) || mockProfile.phone,
        cdlClass: (profileData.cdl_class as string) || mockProfile.cdlClass,
        cdlState: (profileData.cdl_state as string) || mockProfile.cdlState,
        endorsements: (profileData.endorsements as string[]) || mockProfile.endorsements,
        yearsExperience: String((profileData.years_experience as number) ?? mockProfile.yearsExperience),
        preferredTruck: (profileData.preferred_truck as string) || mockProfile.preferredTruck,
        preferredRoute: (profileData.preferred_route as string) || mockProfile.preferredRoute,
        homeCity: (profileData.home_city as string) || mockProfile.homeCity,
        homeState: (profileData.home_state as string) || mockProfile.homeState,
        homeZip: (profileData.home_zip as string) || mockProfile.homeZip,
      });
    } else {
      setProfile(mockProfile);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Error Banner ── */}
      {(error || saveMutation.error) && (
        <Card elevation="xs" className="!bg-red-50 dark:!bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500">warning</span>
              <p className="text-sm text-red-700 dark:text-red-300">
                {saveMutation.error || 'Failed to load profile. Showing cached data.'}
              </p>
            </div>
            <Button variant="ghost" size="sm" icon="refresh" onClick={refresh}>Retry</Button>
          </div>
        </Card>
      )}

      {/* ── Success Banner ── */}
      {saveSuccess && (
        <Card elevation="xs" className="!bg-green-50 dark:!bg-green-500/10 border border-green-200 dark:border-green-500/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-green-500">check_circle</span>
            <p className="text-sm text-green-700 dark:text-green-300">Profile saved successfully.</p>
          </div>
        </Card>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between animate-fade-up">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>My Profile</h1>
        <div className="flex items-center gap-2">
          {!editing && <Button variant="ghost" size="sm" icon="refresh" onClick={refresh}>Refresh</Button>}
          <Button
            variant={editing ? 'primary' : 'secondary'}
            icon={editing ? 'save' : 'edit'}
            onClick={() => editing ? handleSave() : setEditing(true)}
            disabled={saveMutation.loading}
          >
            {saveMutation.loading ? 'Saving...' : editing ? 'Save Changes' : 'Edit Profile'}
          </Button>
        </div>
      </div>

      {/* ── Profile Header Card ── */}
      <Card elevation="lg" className="animate-fade-up stagger-1">
        <div className="flex items-center gap-5">
          {loading ? (
            <div className="w-20 h-20 rounded-2xl bg-[var(--neu-border)] animate-pulse shrink-0" />
          ) : (
            <div className="neu-ins w-20 h-20 rounded-2xl flex items-center justify-center shrink-0">
              <span className="text-3xl font-black" style={{ color: 'var(--neu-accent)' }}>
                {profile.firstName[0]}{profile.lastName[0]}
              </span>
            </div>
          )}
          <div className="space-y-1">
            <h2 className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>
              {loading ? (
                <span className="inline-block w-40 h-6 rounded bg-[var(--neu-border)] animate-pulse" />
              ) : (
                <>{profile.firstName} {profile.lastName}</>
              )}
            </h2>
            <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>
              CDL Class {profile.cdlClass} Driver &middot; {profile.yearsExperience} years experience
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="success" icon="verified">Verified</Badge>
              <Badge variant="accent" icon="calendar_month">Member since Jan 2026</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Personal Information ── */}
      <Card className="animate-fade-up stagger-2">
        <div className="flex items-center gap-2 mb-5">
          <span className="material-symbols-outlined text-[22px]" style={{ color: 'var(--neu-accent)' }}>person</span>
          <h3 className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>Personal Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="First Name" icon="badge" value={profile.firstName} onChange={handleChange('firstName')} disabled={!editing} />
          <Input label="Last Name" icon="badge" value={profile.lastName} onChange={handleChange('lastName')} disabled={!editing} />
          <Input label="Email" icon="mail" type="email" value={profile.email} onChange={handleChange('email')} disabled={!editing} />
          <Input label="Phone" icon="phone" type="tel" value={profile.phone} onChange={handleChange('phone')} disabled={!editing} />
        </div>
      </Card>

      {/* ── CDL Information ── */}
      <Card className="animate-fade-up stagger-3">
        <div className="flex items-center gap-2 mb-5">
          <span className="material-symbols-outlined text-[22px]" style={{ color: 'var(--neu-accent)' }}>verified</span>
          <h3 className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>CDL Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CDL Class Select */}
          <div className="space-y-1.5">
            <label className="kpi-label">CDL Class</label>
            <select
              value={profile.cdlClass}
              onChange={handleChange('cdlClass')}
              disabled={!editing}
              className="w-full rounded-xl px-4 py-2.5 text-sm neu-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neu-accent)]/30 transition-shadow duration-200"
              style={{ color: 'var(--neu-text)', fontFamily: "'Inter', sans-serif" }}
            >
              <option value="A">Class A</option>
              <option value="B">Class B</option>
              <option value="C">Class C</option>
            </select>
          </div>
          <Input label="CDL State" icon="map" value={profile.cdlState} onChange={handleChange('cdlState')} disabled={!editing} />
          <Input label="Years of Experience" icon="timeline" type="number" value={profile.yearsExperience} onChange={handleChange('yearsExperience')} disabled={!editing} />
        </div>

        {/* Endorsements as Chips */}
        <div className="mt-5">
          <p className="kpi-label mb-3">Endorsements</p>
          <div className="flex flex-wrap gap-2">
            {endorsementOptions.map(end => {
              const active = profile.endorsements.includes(end.code);
              return (
                <button
                  key={end.code}
                  onClick={() => toggleEndorsement(end.code)}
                  disabled={!editing}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${active
                      ? 'btn-glow text-white'
                      : 'neu-x disabled:opacity-50'
                    }`}
                  style={!active ? { color: 'var(--neu-text)' } : undefined}
                >
                  <span className="flex items-center gap-1.5">
                    {active && <span className="material-symbols-outlined text-[14px]">check</span>}
                    {end.code} &mdash; {end.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ── Preferences ── */}
      <Card className="animate-fade-up stagger-4">
        <div className="flex items-center gap-2 mb-5">
          <span className="material-symbols-outlined text-[22px]" style={{ color: 'var(--neu-accent)' }}>tune</span>
          <h3 className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>Preferences</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Desired Truck Type */}
          <div className="space-y-1.5">
            <label className="kpi-label">Desired Truck Type</label>
            <select
              value={profile.preferredTruck}
              onChange={handleChange('preferredTruck')}
              disabled={!editing}
              className="w-full rounded-xl px-4 py-2.5 text-sm neu-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neu-accent)]/30 transition-shadow duration-200"
              style={{ color: 'var(--neu-text)', fontFamily: "'Inter', sans-serif" }}
            >
              {truckTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Preferred Route */}
          <div className="space-y-1.5">
            <label className="kpi-label">Preferred Routes</label>
            <select
              value={profile.preferredRoute}
              onChange={handleChange('preferredRoute')}
              disabled={!editing}
              className="w-full rounded-xl px-4 py-2.5 text-sm neu-in focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neu-accent)]/30 transition-shadow duration-200"
              style={{ color: 'var(--neu-text)', fontFamily: "'Inter', sans-serif" }}
            >
              {routeTypes.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* Home Location */}
        <div className="mt-4">
          <p className="kpi-label mb-3">Home Location</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="City" icon="location_city" value={profile.homeCity} onChange={handleChange('homeCity')} disabled={!editing} />
            <Input label="State" icon="map" value={profile.homeState} onChange={handleChange('homeState')} disabled={!editing} />
            <Input label="ZIP Code" icon="pin_drop" value={profile.homeZip} onChange={handleChange('homeZip')} disabled={!editing} />
          </div>
        </div>
      </Card>

      {/* ── My Documents ── */}
      <Card className="animate-fade-up stagger-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px]" style={{ color: 'var(--neu-accent)' }}>folder_open</span>
            <h3 className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>My Documents</h3>
          </div>
          <Badge variant={documents.length > 0 ? 'success' : 'warning'} dot>
            {docsLoading ? '...' : `${documents.length} uploaded`}
          </Badge>
        </div>

        {/* Upload error banner */}
        {uploadError && (
          <div className="mb-3 rounded-lg px-3 py-2 text-xs bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">error</span>
            {uploadError}
            <button onClick={() => setUploadError(null)} className="ml-auto material-symbols-outlined text-[14px]">close</button>
          </div>
        )}

        <div className="space-y-2.5">
          {/* Uploaded documents from API */}
          {docsLoading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="neu-x rounded-xl p-3 h-14 animate-pulse" />
              ))}
            </div>
          ) : documents.length > 0 ? (
            documents.map((doc) => {
              const docType = (doc.doc_type as string) || '';
              const meta = DOC_TYPE_META[docType] || { label: docType, icon: 'description' };
              const status = (doc.status as string) || 'pending_review';
              const isExpired = doc.is_expired as boolean;
              const uploadedAt = doc.uploaded_at ? new Date(doc.uploaded_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
              const expDate = doc.expiration_date ? new Date(doc.expiration_date as string).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null;

              const statusConfig = isExpired
                ? { badge: 'error' as const, label: 'Expired' }
                : status === 'verified'
                  ? { badge: 'success' as const, label: 'Verified' }
                  : status === 'pending_review'
                    ? { badge: 'warning' as const, label: 'Pending Review' }
                    : { badge: 'accent' as const, label: status };

              return (
                <div key={doc._id as string} className="neu-x rounded-xl p-3 flex items-center gap-3">
                  <div className="neu-ins w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>{meta.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold truncate" style={{ color: 'var(--neu-text)' }}>{meta.label}</p>
                    <p className="text-[10px] truncate" style={{ color: 'var(--neu-text-muted)' }}>
                      {doc.file_name as string}
                      {uploadedAt && ` · ${uploadedAt}`}
                      {expDate && ` · Exp: ${expDate}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={statusConfig.badge} dot>{statusConfig.label}</Badge>
                    <button
                      onClick={() => handleDeleteDoc(doc._id as string)}
                      className="w-7 h-7 rounded-lg neu-x flex items-center justify-center hover:opacity-70 active:scale-90 transition-all"
                      aria-label={`Delete ${meta.label}`}
                    >
                      <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-text-muted)' }}>delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-center py-4" style={{ color: 'var(--neu-text-muted)' }}>
              No documents uploaded yet. Use the area below to upload.
            </p>
          )}

          {/* Missing doc type quick-upload buttons */}
          {!docsLoading && (() => {
            const uploadedTypes = new Set(documents.map(d => d.doc_type as string));
            const missingTypes = Object.entries(DOC_TYPE_META).filter(([key]) => !uploadedTypes.has(key));
            if (missingTypes.length === 0) return null;
            return (
              <div className="pt-2">
                <p className="kpi-label mb-2">Missing Documents</p>
                <div className="flex flex-wrap gap-2">
                  {missingTypes.map(([key, meta]) => (
                    <button
                      key={key}
                      onClick={() => { setUploadDocType(key); fileInputRef.current?.click(); }}
                      disabled={uploading}
                      className="neu-x rounded-lg px-3 py-2 flex items-center gap-2 text-[11px] font-semibold hover:opacity-80 active:scale-95 transition-all disabled:opacity-50"
                      style={{ color: 'var(--neu-text)' }}
                    >
                      <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-accent)' }}>upload</span>
                      {meta.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={handleFileInputChange}
          aria-label="Upload document"
        />

        {/* Upload Zone — Drag & Drop */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => { setUploadDocType(null); fileInputRef.current?.click(); }}
          className={`mt-4 rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer active:scale-[0.99] transition-all ${dragOver ? 'scale-[1.01]' : ''}`}
          style={{
            border: `2px dashed ${dragOver ? 'var(--neu-accent)' : 'var(--neu-border)'}`,
            background: dragOver ? 'var(--neu-accent-soft, rgba(37,99,235,0.05))' : 'var(--neu-bg-soft)',
          }}
        >
          <div className="neu-x w-11 h-11 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]" style={{ color: 'var(--neu-accent)' }}>
              {uploading ? 'hourglass_top' : 'cloud_upload'}
            </span>
          </div>
          <p className="text-[12px] font-bold" style={{ color: 'var(--neu-text)' }}>
            {uploading ? 'Uploading...' : 'Drag & drop or tap to upload'}
          </p>
          <p className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>PDF, JPG, PNG · Max 10MB</p>
        </div>
      </Card>

      {/* ── Save Banner (when editing) ── */}
      {editing && (
        <Card elevation="xs" className="animate-fade-up !bg-[var(--neu-accent)]/5 border border-[var(--neu-accent)]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--neu-accent)' }}>info</span>
              <p className="text-sm font-medium" style={{ color: 'var(--neu-text)' }}>You have unsaved changes</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
              <Button size="sm" icon="save" onClick={handleSave} disabled={saveMutation.loading}>
                {saveMutation.loading ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
