'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, ProgressBar, Input } from '@/components/ui';
import { driverApi } from '@/lib/api';
import { useApi, useMutation } from '@/lib/hooks';

/* ── Constants ── */
const DEMO_DRIVER_ID = 'demo-driver-001';

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

/* ── Step Content Components ── */
function PersonalInfoStep() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input label="First Name" icon="badge" placeholder="Marcus" />
      <Input label="Last Name" icon="badge" placeholder="Thompson" />
      <Input label="Email" icon="mail" type="email" placeholder="marcus@email.com" />
      <Input label="Phone" icon="phone" type="tel" placeholder="(214) 555-0187" />
      <Input label="City" icon="location_city" placeholder="Dallas" />
      <Input label="State" icon="map" placeholder="TX" />
    </div>
  );
}

function CdlDetailsStep() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="kpi-label">CDL Class</label>
          <select className="w-full rounded-xl px-4 py-2.5 text-sm neu-in" style={{ color: 'var(--neu-text)' }}>
            <option>Class A</option><option>Class B</option><option>Class C</option>
          </select>
        </div>
        <Input label="CDL State" icon="map" placeholder="TX" />
        <Input label="Years Experience" icon="timeline" type="number" placeholder="8" />
      </div>
      <div>
        <p className="kpi-label mb-2">Endorsements</p>
        <div className="flex flex-wrap gap-2">
          {['H - Hazmat', 'N - Tanker', 'T - Doubles', 'P - Passenger', 'X - HazTank'].map(e => (
            <button key={e} className="neu-x px-4 py-2 rounded-full text-xs font-bold transition-all" style={{ color: 'var(--neu-text)' }}>{e}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PreferencesStep() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <label className="kpi-label">Preferred Route Type</label>
        <select className="w-full rounded-xl px-4 py-2.5 text-sm neu-in" style={{ color: 'var(--neu-text)' }}>
          <option>OTR (Over the Road)</option><option>Regional</option><option>Local</option><option>Dedicated</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <label className="kpi-label">Desired Truck Type</label>
        <select className="w-full rounded-xl px-4 py-2.5 text-sm neu-in" style={{ color: 'var(--neu-text)' }}>
          <option>Dry Van</option><option>Reefer</option><option>Flatbed</option><option>Tanker</option>
        </select>
      </div>
      <Input label="Minimum Pay ($/mi)" icon="payments" placeholder="0.55" />
      <Input label="Max Days Out" icon="calendar_month" type="number" placeholder="14" />
    </div>
  );
}

function DocumentsStep() {
  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Upload the following documents to continue:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[
          { name: 'CDL License (Front & Back)', icon: 'badge' },
          { name: 'DOT Medical Card', icon: 'medical_information' },
          { name: 'MVR Report', icon: 'fact_check' },
          { name: 'Employment History', icon: 'work_history' },
        ].map(doc => (
          <Card key={doc.name} elevation="xs" className="!p-3">
            <div className="flex items-center gap-3">
              <div className="neu-x w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--neu-accent)' }}>{doc.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: 'var(--neu-text)' }}>{doc.name}</p>
                <p className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>PDF, JPG, PNG</p>
              </div>
              <Button variant="secondary" size="sm" icon="upload_file">Upload</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function BackgroundCheckStep() {
  return (
    <div className="text-center space-y-4 py-4">
      <div className="neu-x w-20 h-20 rounded-2xl flex items-center justify-center mx-auto">
        <span className="material-symbols-outlined text-[40px]" style={{ color: 'var(--neu-accent)' }}>security</span>
      </div>
      <div>
        <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>Background Check Authorization</p>
        <p className="text-xs mt-2 max-w-md mx-auto" style={{ color: 'var(--neu-text-muted)' }}>
          By clicking &quot;Authorize&quot;, you consent to a background verification check. This typically takes 2-3 business days.
        </p>
      </div>
      <Button icon="verified_user">Authorize Background Check</Button>
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

const stepContent = [PersonalInfoStep, CdlDetailsStep, PreferencesStep, DocumentsStep, BackgroundCheckStep, ProfileReviewStep, CompleteStep];

/* ── Main Component ── */
export default function DriverOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(3);
  const [advanceSuccess, setAdvanceSuccess] = useState(false);

  /* ── API Data ── */
  const { data: onboardingData, loading, error, refresh } = useApi<Record<string, unknown>>(
    () => driverApi.getOnboardingStatus(DEMO_DRIVER_ID),
    [DEMO_DRIVER_ID]
  );

  const advanceMutation = useMutation<{ step: string; data?: Record<string, unknown> }>(
    useCallback(
      (input: { step: string; data?: Record<string, unknown> }) =>
        driverApi.advanceOnboarding(DEMO_DRIVER_ID, input.step, input.data),
      []
    )
  );

  /* ── Sync API data into local state ── */
  useEffect(() => {
    if (onboardingData?.currentStep) {
      setCurrentStep(onboardingData.currentStep as number);
    }
  }, [onboardingData]);

  const completionPct = Math.round(((currentStep - 1) / (steps.length - 1)) * 100);

  const handleNext = async () => {
    if (currentStep >= steps.length) return;
    const stepName = steps[currentStep - 1].name;
    const result = await advanceMutation.execute({ step: stepName });
    if (result !== null) {
      setCurrentStep(s => Math.min(steps.length, s + 1));
      setAdvanceSuccess(true);
      refresh();
      setTimeout(() => setAdvanceSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── Error Banner ── */}
      {(error || advanceMutation.error) && (
        <Card elevation="xs" className="!bg-red-50 dark:!bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-red-500">warning</span>
              <p className="text-sm text-red-700 dark:text-red-300">
                {advanceMutation.error || 'Failed to load onboarding status. Showing cached progress.'}
              </p>
            </div>
            <Button variant="ghost" size="sm" icon="refresh" onClick={refresh}>Retry</Button>
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
                <span className={`text-[10px] font-bold hidden md:block max-w-[70px] text-center leading-tight ${
                  isCurrent ? '' : ''
                }`} style={{ color: isCurrent ? 'var(--neu-accent)' : 'var(--neu-text-muted)' }}>
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
          {(() => {
            const StepComponent = stepContent[currentStep - 1];
            return <StepComponent />;
          })()}
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
          disabled={currentStep === steps.length || advanceMutation.loading}
          onClick={handleNext}
        >
          {advanceMutation.loading ? 'Saving...' : currentStep === steps.length ? 'Complete' : 'Next'}
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
