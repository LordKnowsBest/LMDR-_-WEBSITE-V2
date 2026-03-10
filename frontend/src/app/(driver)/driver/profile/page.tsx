'use client';

import { useState } from 'react';
import { Card, Button, Input, Badge } from '@/components/ui';

/* ── Mock Data ── */
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

export default function DriverProfilePage() {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: 'Marcus', lastName: 'Thompson',
    email: 'marcus.t@email.com', phone: '(214) 555-0187',
    cdlClass: 'A', cdlState: 'TX',
    endorsements: ['H', 'T'] as string[],
    yearsExperience: '8',
    preferredTruck: 'Dry Van', preferredRoute: 'Regional',
    homeCity: 'Dallas', homeState: 'TX', homeZip: '75201',
  });

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

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Header ── */}
      <div className="flex items-center justify-between animate-fade-up">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>My Profile</h1>
        <Button
          variant={editing ? 'primary' : 'secondary'}
          icon={editing ? 'save' : 'edit'}
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Save Changes' : 'Edit Profile'}
        </Button>
      </div>

      {/* ── Profile Header Card ── */}
      <Card elevation="lg" className="animate-fade-up stagger-1">
        <div className="flex items-center gap-5">
          <div className="neu-ins w-20 h-20 rounded-2xl flex items-center justify-center shrink-0">
            <span className="text-3xl font-black" style={{ color: 'var(--neu-accent)' }}>
              {profile.firstName[0]}{profile.lastName[0]}
            </span>
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold" style={{ color: 'var(--neu-text)' }}>
              {profile.firstName} {profile.lastName}
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
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                    active
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

      {/* ── Save Banner (when editing) ── */}
      {editing && (
        <Card elevation="xs" className="animate-fade-up !bg-[var(--neu-accent)]/5 border border-[var(--neu-accent)]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--neu-accent)' }}>info</span>
              <p className="text-sm font-medium" style={{ color: 'var(--neu-text)' }}>You have unsaved changes</p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" icon="save" onClick={() => setEditing(false)}>Save Profile</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
