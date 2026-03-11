'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, Button, Input, Badge } from '@/components/ui';
import { driverApi } from '@/lib/api';
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

export default function DriverProfilePage() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(mockProfile);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /* ── API Data ── */
  const { data: profileData, loading, error, refresh } = useApi<Record<string, unknown>>(
    () => driverApi.getProfile(DEMO_DRIVER_ID),
    [DEMO_DRIVER_ID]
  );

  const saveMutation = useMutation<Record<string, unknown>>(
    useCallback((data: Record<string, unknown>) => driverApi.updateProfile(DEMO_DRIVER_ID, data), [])
  );

  /* ── Sync API data into local state ── */
  useEffect(() => {
    if (profileData) {
      setProfile({
        firstName: (profileData.firstName as string) || mockProfile.firstName,
        lastName: (profileData.lastName as string) || mockProfile.lastName,
        email: (profileData.email as string) || mockProfile.email,
        phone: (profileData.phone as string) || mockProfile.phone,
        cdlClass: (profileData.cdlClass as string) || mockProfile.cdlClass,
        cdlState: (profileData.cdlState as string) || mockProfile.cdlState,
        endorsements: (profileData.endorsements as string[]) || mockProfile.endorsements,
        yearsExperience: String((profileData.yearsExperience as number) ?? mockProfile.yearsExperience),
        preferredTruck: (profileData.preferredTruck as string) || mockProfile.preferredTruck,
        preferredRoute: (profileData.preferredRoute as string) || mockProfile.preferredRoute,
        homeCity: (profileData.homeCity as string) || mockProfile.homeCity,
        homeState: (profileData.homeState as string) || mockProfile.homeState,
        homeZip: (profileData.homeZip as string) || mockProfile.homeZip,
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
    const result = await saveMutation.execute(profile);
    if (result !== null) {
      setSaveSuccess(true);
      setEditing(false);
      refresh();
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    // Reset to API data or mock
    if (profileData) {
      setProfile({
        firstName: (profileData.firstName as string) || mockProfile.firstName,
        lastName: (profileData.lastName as string) || mockProfile.lastName,
        email: (profileData.email as string) || mockProfile.email,
        phone: (profileData.phone as string) || mockProfile.phone,
        cdlClass: (profileData.cdlClass as string) || mockProfile.cdlClass,
        cdlState: (profileData.cdlState as string) || mockProfile.cdlState,
        endorsements: (profileData.endorsements as string[]) || mockProfile.endorsements,
        yearsExperience: String((profileData.yearsExperience as number) ?? mockProfile.yearsExperience),
        preferredTruck: (profileData.preferredTruck as string) || mockProfile.preferredTruck,
        preferredRoute: (profileData.preferredRoute as string) || mockProfile.preferredRoute,
        homeCity: (profileData.homeCity as string) || mockProfile.homeCity,
        homeState: (profileData.homeState as string) || mockProfile.homeState,
        homeZip: (profileData.homeZip as string) || mockProfile.homeZip,
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
          <Badge variant="warning" dot>3 of 5</Badge>
        </div>

        <div className="space-y-2.5">
          {[
            { name: 'CDL — Front', icon: 'badge', status: 'verified' as const, date: 'Uploaded Feb 14, 2026', expires: 'Aug 2028' },
            { name: 'CDL — Back', icon: 'badge', status: 'verified' as const, date: 'Uploaded Feb 14, 2026', expires: 'Aug 2028' },
            { name: 'Medical Card (DOT)', icon: 'medical_information', status: 'pending' as const, date: 'Uploaded Mar 1, 2026', expires: 'Mar 2028' },
            { name: 'MVR (Motor Vehicle Report)', icon: 'description', status: 'missing' as const, date: null, expires: null },
            { name: 'W-9 Tax Form', icon: 'receipt_long', status: 'missing' as const, date: null, expires: null },
          ].map((doc) => {
            const statusMap = {
              verified: { badge: 'success' as const, label: 'Verified', icon: 'check_circle' },
              pending: { badge: 'warning' as const, label: 'Pending', icon: 'hourglass_top' },
              missing: { badge: 'error' as const, label: 'Missing', icon: 'error' },
            };
            const s = statusMap[doc.status];

            return (
              <div key={doc.name} className="neu-x rounded-xl p-3 flex items-center gap-3">
                <div className="neu-ins w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>{doc.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold truncate" style={{ color: 'var(--neu-text)' }}>{doc.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>
                    {doc.date || 'Not uploaded yet'}
                    {doc.expires && ` · Exp: ${doc.expires}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={s.badge} dot>{s.label}</Badge>
                  {doc.status === 'missing' && (
                    <button
                      className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-transform"
                      style={{ background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)' }}
                    >
                      <span className="material-symbols-outlined text-white text-[14px]">upload</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Upload Zone */}
        <div
          className="mt-4 rounded-xl p-5 flex flex-col items-center gap-2 cursor-pointer active:scale-[0.99] transition-transform"
          style={{
            border: '2px dashed var(--neu-border)',
            background: 'var(--neu-bg-soft)',
          }}
        >
          <div className="neu-x w-11 h-11 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]" style={{ color: 'var(--neu-accent)' }}>cloud_upload</span>
          </div>
          <p className="text-[12px] font-bold" style={{ color: 'var(--neu-text)' }}>Drag & drop or tap to upload</p>
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
