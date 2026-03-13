'use client';

import { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { Card, Button, Badge, ProgressBar, Input } from '@/components/ui';
import { useApi, useMutation } from '@/lib/hooks';
import { getProfile, getProfileStrength, updateProfile } from '../../actions/profile';
import { getDocumentStatus, getSignedUploadUrl, uploadDocument } from '../../actions/documents';
import { getTimeline } from '../../actions/lifecycle';

/* ── Constants ── */
const DEMO_DRIVER_ID = 'demo-driver-001';

/* ── Types ── */
interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  cdl_class: string;
  cdl_state: string;
  years_experience: string;
  endorsements: string[];
  preferred_route_type: string;
  desired_truck_type: string;
  minimum_pay: string;
  max_days_out: string;
  background_check_authorized: boolean;
}

const INITIAL_FORM: FormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  city: '',
  state: '',
  cdl_class: 'Class A',
  cdl_state: '',
  years_experience: '',
  endorsements: [],
  preferred_route_type: 'OTR (Over the Road)',
  desired_truck_type: 'Dry Van',
  minimum_pay: '',
  max_days_out: '',
  background_check_authorized: false,
};

interface DocSlot {
  name: string;
  icon: string;
  docType: string;
  uploading: boolean;
  uploaded: boolean;
  fileName?: string;
  error?: string;
}

/* ── Step Definitions ── */
const steps = [
  { id: 1, name: 'Personal Info', icon: 'person', description: 'Tell us about yourself so carriers can find you.', detail: 'Provide your full name, contact information, and home location. This information is kept private and only shared with carriers you apply to.' },
  { id: 2, name: 'CDL Details', icon: 'verified', description: 'Enter your CDL class, endorsements, and experience.', detail: 'Your CDL classification and endorsements are key matching criteria. Accurate information helps us find the best carriers for your qualifications.' },
  { id: 3, name: 'Preferences', icon: 'tune', description: 'Set your route, truck type, and pay preferences.', detail: 'Tell us what kind of driving job you want -- OTR, regional, local, or dedicated. We will match you with carriers that fit your lifestyle.' },
  { id: 4, name: 'Documents', icon: 'upload_file', description: 'Upload CDL, medical card, and MVR documents.', detail: 'Verified documents speed up your applications. Carriers see that your credentials are confirmed, giving you priority in the matching queue.' },
  { id: 5, name: 'Background Check', icon: 'security', description: 'Authorize and complete background verification.', detail: 'A clean background check opens doors to premium carriers. This step typically takes 2-3 business days once authorized.' },
  { id: 6, name: 'Profile Review', icon: 'rate_review', description: 'Our team reviews your profile for completeness.', detail: 'A real person reviews your profile to ensure everything is accurate and complete. This usually takes less than 24 hours.' },
  { id: 7, name: 'Go Active!', icon: 'rocket_launch', description: 'You are live and searchable by carriers!', detail: 'Congratulations! Your profile is now visible to carriers in our network. You will start receiving match notifications immediately.' },
];

/* ── Endorsement options ── */
const ENDORSEMENT_OPTIONS = ['H - Hazmat', 'N - Tanker', 'T - Doubles', 'P - Passenger', 'X - HazTank'];

/* ── Step Content Components ── */
function PersonalInfoStep({ form, onChange }: { form: FormData; onChange: (field: keyof FormData, value: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input label="First Name" icon="badge" placeholder="Marcus" value={form.first_name} onChange={(e) => onChange('first_name', e.target.value)} />
      <Input label="Last Name" icon="badge" placeholder="Thompson" value={form.last_name} onChange={(e) => onChange('last_name', e.target.value)} />
      <Input label="Email" icon="mail" type="email" placeholder="marcus@email.com" value={form.email} onChange={(e) => onChange('email', e.target.value)} />
      <Input label="Phone" icon="phone" type="tel" placeholder="(214) 555-0187" value={form.phone} onChange={(e) => onChange('phone', e.target.value)} />
      <Input label="City" icon="location_city" placeholder="Dallas" value={form.city} onChange={(e) => onChange('city', e.target.value)} />
      <Input label="State" icon="map" placeholder="TX" value={form.state} onChange={(e) => onChange('state', e.target.value)} />
    </div>
  );
}

function CdlDetailsStep({ form, onChange, onToggleEndorsement }: { form: FormData; onChange: (field: keyof FormData, value: string) => void; onToggleEndorsement: (e: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="kpi-label">CDL Class</label>
          <select className="w-full rounded-xl px-4 py-2.5 text-sm neu-in" style={{ color: 'var(--neu-text)' }} value={form.cdl_class} onChange={(e) => onChange('cdl_class', e.target.value)}>
            <option>Class A</option><option>Class B</option><option>Class C</option>
          </select>
        </div>
        <Input label="CDL State" icon="map" placeholder="TX" value={form.cdl_state} onChange={(e) => onChange('cdl_state', e.target.value)} />
        <Input label="Years Experience" icon="timeline" type="number" placeholder="8" value={form.years_experience} onChange={(e) => onChange('years_experience', e.target.value)} />
      </div>
      <div>
        <p className="kpi-label mb-2">Endorsements</p>
        <div className="flex flex-wrap gap-2">
          {ENDORSEMENT_OPTIONS.map(e => {
            const selected = form.endorsements.includes(e);
            return (
              <button
                key={e}
                type="button"
                onClick={() => onToggleEndorsement(e)}
                className={`neu-x px-4 py-2 rounded-full text-xs font-bold transition-all ${selected ? 'ring-2 ring-[var(--neu-accent)]' : ''}`}
                style={{ color: selected ? 'var(--neu-accent)' : 'var(--neu-text)' }}
              >
                {e} {selected && '\u2713'}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PreferencesStep({ form, onChange }: { form: FormData; onChange: (field: keyof FormData, value: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <label className="kpi-label">Preferred Route Type</label>
        <select className="w-full rounded-xl px-4 py-2.5 text-sm neu-in" style={{ color: 'var(--neu-text)' }} value={form.preferred_route_type} onChange={(e) => onChange('preferred_route_type', e.target.value)}>
          <option>OTR (Over the Road)</option><option>Regional</option><option>Local</option><option>Dedicated</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="kpi-label">Desired Truck Type</label>
        <select className="w-full rounded-xl px-4 py-2.5 text-sm neu-in" style={{ color: 'var(--neu-text)' }} value={form.desired_truck_type} onChange={(e) => onChange('desired_truck_type', e.target.value)}>
          <option>Dry Van</option><option>Reefer</option><option>Flatbed</option><option>Tanker</option>
        </select>
      </div>
      <Input label="Minimum Pay ($/mi)" icon="payments" placeholder="0.55" value={form.minimum_pay} onChange={(e) => onChange('minimum_pay', e.target.value)} />
      <Input label="Max Days Out" icon="calendar_month" type="number" placeholder="14" value={form.max_days_out} onChange={(e) => onChange('max_days_out', e.target.value)} />
    </div>
  );
}

function DocumentsStep({ docSlots, onFileSelect }: { docSlots: DocSlot[]; onFileSelect: (index: number, file: File) => void }) {
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Upload the following documents to continue:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {docSlots.map((doc, idx) => (
          <Card key={doc.name} elevation="xs" className="!p-3">
            <div className="flex items-center gap-3">
              <div className="neu-x w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]" style={{ color: doc.uploaded ? '#22c55e' : 'var(--neu-accent)' }}>
                  {doc.uploaded ? 'check_circle' : doc.icon}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: 'var(--neu-text)' }}>{doc.name}</p>
                {doc.uploaded ? (
                  <p className="text-[10px] text-green-600 truncate">{doc.fileName ?? 'Uploaded'}</p>
                ) : doc.error ? (
                  <p className="text-[10px] text-red-500 truncate">{doc.error}</p>
                ) : (
                  <p className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>PDF, JPG, PNG</p>
                )}
              </div>
              <input
                ref={(el) => { fileRefs.current[idx] = el; }}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const file = e.target.files?.[0];
                  if (file) onFileSelect(idx, file);
                }}
              />
              <Button
                variant={doc.uploaded ? 'ghost' : 'secondary'}
                size="sm"
                icon={doc.uploaded ? 'check' : 'upload_file'}
                disabled={doc.uploading}
                onClick={() => fileRefs.current[idx]?.click()}
              >
                {doc.uploading ? 'Uploading...' : doc.uploaded ? 'Replace' : 'Upload'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BackgroundCheckStep({ authorized, onAuthorize, loading }: { authorized: boolean; onAuthorize: () => void; loading: boolean }) {
  return (
    <div className="text-center space-y-4 py-4">
      <div className="neu-x w-20 h-20 rounded-2xl flex items-center justify-center mx-auto">
        <span className="material-symbols-outlined text-[40px]" style={{ color: authorized ? '#22c55e' : 'var(--neu-accent)' }}>
          {authorized ? 'verified_user' : 'security'}
        </span>
      </div>
      <div>
        <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
          {authorized ? 'Background Check Authorized' : 'Background Check Authorization'}
        </p>
        <p className="text-xs mt-2 max-w-md mx-auto" style={{ color: 'var(--neu-text-muted)' }}>
          {authorized
            ? 'You have authorized the background check. This typically takes 2-3 business days to complete.'
            : 'By clicking "Authorize", you consent to a background verification check. This typically takes 2-3 business days.'}
        </p>
      </div>
      {!authorized && (
        <Button icon="verified_user" disabled={loading} onClick={onAuthorize}>
          {loading ? 'Authorizing...' : 'Authorize Background Check'}
        </Button>
      )}
      {authorized && <Badge variant="success" icon="check_circle">Authorized</Badge>}
    </div>
  );
}

function ProfileReviewStep() {
  return (
    <div className="text-center space-y-4 py-4">
      <div className="neu-x w-20 h-20 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
        <span className="material-symbols-outlined text-[40px]" style={{ color: 'var(--neu-accent)' }}>hourglass_top</span>
      </div>
      <div>
        <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>Profile Under Review</p>
        <p className="text-xs mt-2 max-w-md mx-auto" style={{ color: 'var(--neu-text-muted)' }}>
          Our team is reviewing your profile. You will receive an email notification once the review is complete. This usually takes less than 24 hours.
        </p>
      </div>
      <Badge variant="info" icon="schedule">Estimated: &lt; 24 hours</Badge>
    </div>
  );
}

function CompleteStep() {
  return (
    <div className="text-center space-y-4 py-4">
      <div className="neu-x w-20 h-20 rounded-2xl flex items-center justify-center mx-auto">
        <span className="material-symbols-outlined text-[40px] text-green-500">check_circle</span>
      </div>
      <div>
        <p className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>You&apos;re All Set!</p>
        <p className="text-sm mt-2 max-w-md mx-auto" style={{ color: 'var(--neu-text-muted)' }}>
          Your profile is active and visible to carriers. Start exploring your AI-powered matches now.
        </p>
      </div>
      <div className="flex justify-center gap-3">
        <Button icon="auto_awesome">View Matches</Button>
        <Button variant="secondary" icon="dashboard">Go to Dashboard</Button>
      </div>
    </div>
  );
}

/* ── Helpers ── */

/** Map profile API data to form fields, with fallback defaults */
function profileToForm(profile: Record<string, unknown> | null): FormData {
  if (!profile) return { ...INITIAL_FORM };
  const s = (key: string, camel?: string) => String(profile[key] ?? profile[camel ?? ''] ?? '');
  const endorsementsRaw = profile.endorsements;
  const endorsements: string[] = Array.isArray(endorsementsRaw)
    ? endorsementsRaw as string[]
    : typeof endorsementsRaw === 'string'
    ? (endorsementsRaw as string).split(',').map((e: string) => e.trim()).filter(Boolean)
    : [];
  return {
    first_name: s('first_name', 'firstName'),
    last_name: s('last_name', 'lastName'),
    email: s('email'),
    phone: s('phone'),
    city: s('city'),
    state: s('state'),
    cdl_class: s('cdl_class', 'cdlClass') || 'Class A',
    cdl_state: s('cdl_state', 'cdlState'),
    years_experience: s('years_experience', 'yearsExperience'),
    endorsements,
    preferred_route_type: s('preferred_route_type', 'preferredRouteType') || 'OTR (Over the Road)',
    desired_truck_type: s('desired_truck_type', 'desiredTruckType') || 'Dry Van',
    minimum_pay: s('minimum_pay', 'minimumPay'),
    max_days_out: s('max_days_out', 'maxDaysOut'),
    background_check_authorized: profile.background_check_authorized === true || profile.background_check_status === 'authorized' || profile.background_check_status === 'passed' || profile.backgroundCheckStatus === 'authorized' || profile.backgroundCheckStatus === 'passed',
  };
}

/** Build the fields payload for a given step */
function stepFieldsPayload(step: number, form: FormData): Record<string, unknown> {
  switch (step) {
    case 1:
      return {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        state: form.state,
        onboarding_step: 2,
      };
    case 2:
      return {
        cdl_class: form.cdl_class,
        cdl_state: form.cdl_state,
        years_experience: form.years_experience ? Number(form.years_experience) : undefined,
        endorsements: form.endorsements.join(', '),
        onboarding_step: 3,
      };
    case 3:
      return {
        preferred_route_type: form.preferred_route_type,
        desired_truck_type: form.desired_truck_type,
        minimum_pay: form.minimum_pay ? Number(form.minimum_pay) : undefined,
        max_days_out: form.max_days_out ? Number(form.max_days_out) : undefined,
        onboarding_step: 4,
      };
    case 5:
      return {
        background_check_authorized: true,
        background_check_status: 'authorized',
        onboarding_step: 6,
      };
    default:
      return { onboarding_step: step + 1 };
  }
}

/** Derive which step the user should be on from their profile data */
function deriveStepFromProfile(
  profile: Record<string, unknown> | null,
  docStatus: { complete: string[]; missing: string[]; expired: string[]; pendingReview: string[] } | null
): number {
  if (!profile) return 1;
  const hasPersonalInfo = !!(profile.first_name || profile.firstName);
  const hasCdlDetails = !!(profile.cdl_class || profile.cdlClass);
  const hasPreferences = !!(profile.preferred_route_type || profile.preferredRouteType);
  const hasDocuments = docStatus && docStatus.complete && docStatus.complete.length >= 3;
  const hasBgCheck = profile.background_check_status === 'passed' || profile.background_check_status === 'authorized' || profile.backgroundCheckStatus === 'passed' || profile.backgroundCheckStatus === 'authorized';
  const profileReviewed = profile.profile_status === 'reviewed' || profile.profileStatus === 'reviewed' || profile.status === 'active';

  let derivedStep = 1;
  if (hasPersonalInfo) derivedStep = 2;
  if (hasPersonalInfo && hasCdlDetails) derivedStep = 3;
  if (hasPersonalInfo && hasCdlDetails && hasPreferences) derivedStep = 4;
  if (hasPersonalInfo && hasCdlDetails && hasPreferences && hasDocuments) derivedStep = 5;
  if (hasPersonalInfo && hasCdlDetails && hasPreferences && hasDocuments && hasBgCheck) derivedStep = 6;
  if (hasPersonalInfo && hasCdlDetails && hasPreferences && hasDocuments && hasBgCheck && profileReviewed) derivedStep = 7;

  return derivedStep;
}

/* ── Initial document slots ── */
const INITIAL_DOC_SLOTS: DocSlot[] = [
  { name: 'CDL License (Front & Back)', icon: 'badge', docType: 'cdl_license', uploading: false, uploaded: false },
  { name: 'DOT Medical Card', icon: 'medical_information', docType: 'medical_card', uploading: false, uploaded: false },
  { name: 'MVR Report', icon: 'fact_check', docType: 'mvr_report', uploading: false, uploaded: false },
  { name: 'Employment History', icon: 'work_history', docType: 'employment_history', uploading: false, uploaded: false },
];

/* ── Main Component ── */
export default function DriverOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [advanceSuccess, setAdvanceSuccess] = useState(false);
  const [form, setForm] = useState<FormData>({ ...INITIAL_FORM });
  const [formDirty, setFormDirty] = useState(false);
  const [docSlots, setDocSlots] = useState<DocSlot[]>(INITIAL_DOC_SLOTS.map(d => ({ ...d })));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /* ── API Data ── */
  const { data: profileData, loading: profileLoading, error: profileError, refresh: refreshProfile } = useApi<Record<string, unknown>>(
    () => getProfile(DEMO_DRIVER_ID).then(d => ({ data: d as unknown as Record<string, unknown> })),
    [DEMO_DRIVER_ID]
  );

  const { data: strengthData, refresh: refreshStrength } = useApi<{ score: number; missingFields: string[] }>(
    () => getProfileStrength(DEMO_DRIVER_ID).then(d => ({ data: d })),
    [DEMO_DRIVER_ID]
  );

  const { data: docStatusData, refresh: refreshDocs } = useApi<{ complete: string[]; missing: string[]; expired: string[]; pendingReview: string[] }>(
    () => getDocumentStatus(DEMO_DRIVER_ID).then(d => ({ data: d })),
    [DEMO_DRIVER_ID]
  );

  const { data: timelineData } = useApi<{ items: unknown[] }>(
    () => getTimeline(DEMO_DRIVER_ID).then(d => ({ data: d })),
    [DEMO_DRIVER_ID]
  );

  /* ── Derive onboarding state from API data ── */
  const loading = profileLoading;
  const error = profileError;

  const refresh = useCallback(() => {
    refreshProfile();
    refreshStrength();
    refreshDocs();
  }, [refreshProfile, refreshStrength, refreshDocs]);

  /* ── Seed form from profile data on initial load ── */
  useEffect(() => {
    if (profileData && !formDirty) {
      setForm(profileToForm(profileData));
    }
  }, [profileData, formDirty]);

  /* ── Derive step from profile on load ── */
  useEffect(() => {
    const serverStep = profileData?.onboarding_step ?? profileData?.onboardingStep;
    if (typeof serverStep === 'number' && serverStep >= 1 && serverStep <= 7) {
      setCurrentStep(serverStep);
    } else {
      const derived = deriveStepFromProfile(profileData ?? null, docStatusData ?? null);
      setCurrentStep(derived);
    }
  }, [profileData, docStatusData]);

  /* ── Sync doc status into doc slots ── */
  useEffect(() => {
    if (docStatusData?.complete) {
      setDocSlots(prev => prev.map(slot => ({
        ...slot,
        uploaded: slot.uploaded || docStatusData.complete.some(
          c => c.toLowerCase().includes(slot.docType.replace('_', ' ')) || slot.docType.toLowerCase().includes(c.toLowerCase())
        ),
      })));
    }
  }, [docStatusData]);

  const completionPct = Math.round(((currentStep - 1) / (steps.length - 1)) * 100);

  /* ── Form change handler ── */
  const handleFieldChange = useCallback((field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setFormDirty(true);
  }, []);

  const handleToggleEndorsement = useCallback((endorsement: string) => {
    setForm(prev => ({
      ...prev,
      endorsements: prev.endorsements.includes(endorsement)
        ? prev.endorsements.filter(e => e !== endorsement)
        : [...prev.endorsements, endorsement],
    }));
    setFormDirty(true);
  }, []);

  /* ── Save current step data via updateProfile ── */
  const saveStepData = useCallback(async (step: number): Promise<boolean> => {
    // Steps 4 (docs), 6 (review), 7 (complete) don't need a profile save on Next
    if (step === 6 || step === 7) return true;
    if (step === 4) {
      // For docs step, just advance the onboarding_step
      try {
        await updateProfile(DEMO_DRIVER_ID, { onboarding_step: 5 });
        return true;
      } catch {
        return true; // graceful degradation
      }
    }

    const fields = stepFieldsPayload(step, form);
    try {
      setSaving(true);
      setSaveError(null);
      await updateProfile(DEMO_DRIVER_ID, fields);
      setFormDirty(false);
      return true;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [form]);

  /* ── Document upload handler ── */
  const handleFileSelect = useCallback(async (index: number, file: File) => {
    // Mark slot as uploading
    setDocSlots(prev => prev.map((s, i) => i === index ? { ...s, uploading: true, error: undefined } : s));

    try {
      // 1. Get signed upload URL
      const { url, filePath } = await getSignedUploadUrl(file.name, file.type);

      // 2. Upload file to signed URL (direct browser upload)
      const uploadRes = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!uploadRes.ok) {
        throw new Error(`Upload failed (${uploadRes.status})`);
      }

      // 3. Register document with backend
      const docSlot = docSlots[index];
      await uploadDocument(DEMO_DRIVER_ID, {
        docType: docSlot.docType,
        fileName: file.name,
        fileUrl: filePath,
      });

      // 4. Mark slot as uploaded
      setDocSlots(prev => prev.map((s, i) => i === index ? { ...s, uploading: false, uploaded: true, fileName: file.name } : s));

      // Refresh doc status
      refreshDocs();
    } catch (err) {
      setDocSlots(prev => prev.map((s, i) => i === index
        ? { ...s, uploading: false, error: err instanceof Error ? err.message : 'Upload failed' }
        : s
      ));
    }
  }, [docSlots, refreshDocs]);

  /* ── Background check authorization ── */
  const handleAuthorize = useCallback(async () => {
    try {
      setSaving(true);
      await updateProfile(DEMO_DRIVER_ID, {
        background_check_authorized: true,
        background_check_status: 'authorized',
      });
      setForm(prev => ({ ...prev, background_check_authorized: true }));
    } catch {
      setSaveError('Failed to authorize background check.');
    } finally {
      setSaving(false);
    }
  }, []);

  /* ── Next handler: save then advance ── */
  const handleNext = async () => {
    if (currentStep >= steps.length) return;
    const saved = await saveStepData(currentStep);
    if (saved) {
      setCurrentStep(s => Math.min(steps.length, s + 1));
      setAdvanceSuccess(true);
      refresh();
      setTimeout(() => setAdvanceSuccess(false), 3000);
    }
  };

  /* ── Render step content ── */
  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return <PersonalInfoStep form={form} onChange={handleFieldChange} />;
      case 2: return <CdlDetailsStep form={form} onChange={handleFieldChange} onToggleEndorsement={handleToggleEndorsement} />;
      case 3: return <PreferencesStep form={form} onChange={handleFieldChange} />;
      case 4: return <DocumentsStep docSlots={docSlots} onFileSelect={handleFileSelect} />;
      case 5: return <BackgroundCheckStep authorized={form.background_check_authorized} onAuthorize={handleAuthorize} loading={saving} />;
      case 6: return <ProfileReviewStep />;
      case 7: return <CompleteStep />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── Error Banner ── */}
      {(error || saveError) && (
        <Card elevation="xs" className="!bg-red-50 dark:!bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500">warning</span>
              <p className="text-sm text-red-700 dark:text-red-300">
                {saveError || 'Failed to load onboarding status. Showing cached progress.'}
              </p>
            </div>
            <Button variant="ghost" size="sm" icon="refresh" onClick={() => { setSaveError(null); refresh(); }}>Retry</Button>
          </div>
        </Card>
      )}

      {/* ── Success Banner ── */}
      {advanceSuccess && (
        <Card elevation="xs" className="!bg-green-50 dark:!bg-green-500/10 border border-green-200 dark:border-green-500/20">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-green-500">check_circle</span>
            <p className="text-sm text-green-700 dark:text-green-300">Step completed successfully.</p>
          </div>
        </Card>
      )}

      {/* ── Header ── */}
      <div className="text-center animate-fade-up">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>Driver Onboarding</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--neu-text-muted)' }}>
          {loading ? 'Loading your progress...' : 'Complete all steps to become searchable by carriers'}
        </p>
      </div>

      {/* ── Completion Bar ── */}
      <Card elevation="sm" className="animate-fade-up stagger-1">
        <div className="flex items-center justify-between mb-2">
          <span />
          <Button variant="ghost" size="sm" icon="refresh" onClick={refresh}>Refresh</Button>
        </div>
        <ProgressBar
          value={completionPct}
          color={completionPct >= 85 ? 'green' : completionPct >= 50 ? 'blue' : 'amber'}
          label={`${completionPct}% Complete`}
          showValue
        />
      </Card>

      {/* ── Step Progress Bar (horizontal) ── */}
      <div className="animate-fade-up stagger-2">
        <div className="flex items-center justify-between relative">
          {/* Connecting line */}
          <div className="absolute top-5 left-0 right-0 h-0.5" style={{ background: 'var(--neu-border)' }} />
          <div
            className="absolute top-5 left-0 h-0.5 transition-all duration-500"
            style={{
              width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              background: 'var(--neu-accent)',
            }}
          />

          {steps.map((step) => {
            const isComplete = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className="flex flex-col items-center gap-1.5 relative z-10 group"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isComplete
                    ? 'bg-green-500 text-white shadow-[0_4px_12px_rgba(34,197,94,0.3)]'
                    : isCurrent
                    ? 'btn-glow text-white'
                    : 'neu-x'
                }`}>
                  <span className="material-symbols-outlined text-[20px]" style={!isComplete && !isCurrent ? { color: 'var(--neu-text-muted)' } : undefined}>
                    {isComplete ? 'check' : step.icon}
                  </span>
                </div>
                <span className={`text-[10px] font-bold hidden md:block max-w-[70px] text-center leading-tight`} style={{ color: isCurrent ? 'var(--neu-accent)' : 'var(--neu-text-muted)' }}>
                  {step.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Current Step Content Card ── */}
      <Card elevation="lg" className="animate-fade-up stagger-3">
        {/* Step Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="neu-x w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[22px]" style={{ color: 'var(--neu-accent)' }}>
              {steps[currentStep - 1].icon}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>
                Step {currentStep}: {steps[currentStep - 1].name}
              </h2>
              <Badge variant="accent">Step {currentStep} of {steps.length}</Badge>
            </div>
            <p className="text-sm mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
              {steps[currentStep - 1].description}
            </p>
          </div>
        </div>

        {/* Info Blurb */}
        <Card inset className="!p-3 mb-5">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] mt-0.5" style={{ color: 'var(--neu-accent)' }}>info</span>
            <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
              {steps[currentStep - 1].detail}
            </p>
          </div>
        </Card>

        {/* Step Body */}
        <div className="min-h-[200px]">
          {renderStepContent()}
        </div>
      </Card>

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between animate-fade-up stagger-4">
        <Button
          variant="secondary"
          icon="arrow_back"
          disabled={currentStep === 1}
          onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
        >
          Back
        </Button>
        <div className="flex items-center gap-2">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                step.id === currentStep ? 'w-6 bg-[var(--neu-accent)]' : step.id < currentStep ? 'bg-green-400' : 'bg-[var(--neu-border)]'
              }`}
            />
          ))}
        </div>
        <Button
          icon={currentStep === steps.length ? 'check_circle' : 'arrow_forward'}
          disabled={currentStep === steps.length || saving}
          onClick={handleNext}
        >
          {saving ? 'Saving...' : currentStep === steps.length ? 'Complete' : 'Next'}
        </Button>
      </div>

      {/* ── Step List (compact overview) ── */}
      <Card className="animate-fade-up stagger-5">
        <p className="kpi-label mb-3">All Steps</p>
        <div className="space-y-2">
          {steps.map((step) => {
            const isComplete = step.id < currentStep;
            const isCurrent = step.id === currentStep;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className="flex items-center gap-3 w-full text-left py-1.5 group"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isComplete ? 'bg-green-100 dark:bg-green-500/15' : isCurrent ? 'bg-blue-100 dark:bg-blue-500/15' : 'neu-ins'
                }`}>
                  <span className={`material-symbols-outlined text-[15px] ${
                    isComplete ? 'text-green-600' : isCurrent ? 'text-blue-600' : ''
                  }`} style={!isComplete && !isCurrent ? { color: 'var(--neu-text-muted)' } : undefined}>
                    {isComplete ? 'check_circle' : step.icon}
                  </span>
                </div>
                <span className={`text-sm font-medium flex-1 ${isComplete ? 'line-through' : ''}`}
                  style={{ color: isCurrent ? 'var(--neu-accent)' : isComplete ? 'var(--neu-text-muted)' : 'var(--neu-text)' }}>
                  {step.id}. {step.name}
                </span>
                {isComplete && <Badge variant="success">Done</Badge>}
                {isCurrent && <Badge variant="info" dot>Current</Badge>}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
