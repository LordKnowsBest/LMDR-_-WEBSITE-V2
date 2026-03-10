'use client';

import { useState, useCallback, useEffect } from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';
import { carrierApi } from '@/lib/api';
import { useApi, useMutation } from '@/lib/hooks';

const DEMO_CARRIER_ID = 'demo-carrier-001';

/* ── CDL Classes & Route Types ──────────────────────────────── */
const cdlClasses = ['A', 'B', 'C'];
const routeTypes = ['OTR', 'Regional', 'Local', 'Dedicated', 'Intermodal'];

/* ── Notification Items ─────────────────────────────────────── */
const notificationItems = [
  { key: 'emailApps', label: 'Email -- New Applications', desc: 'Get notified when a driver applies to your jobs', icon: 'mail' },
  { key: 'emailMatches', label: 'Email -- AI Match Alerts', desc: 'Receive AI-powered driver match recommendations', icon: 'smart_toy' },
  { key: 'smsUrgent', label: 'SMS -- Urgent Notifications', desc: 'Text messages for time-sensitive dispatch updates', icon: 'sms' },
  { key: 'pushDispatch', label: 'Push -- Dispatch Updates', desc: 'Browser notifications for load status changes', icon: 'notifications' },
  { key: 'emailBilling', label: 'Email -- Billing Alerts', desc: 'Invoice reminders and payment confirmations', icon: 'receipt' },
] as const;

type NotifKey = typeof notificationItems[number]['key'];

export default function CarrierSettingsPage() {
  const { data: carrierData, loading, error, refresh } = useApi<Record<string, unknown>>(
    () => carrierApi.getCarrier(DEMO_CARRIER_ID) as Promise<{ data: Record<string, unknown> }>,
    [DEMO_CARRIER_ID]
  );

  const updateCarrierMutation = useMutation<Record<string, unknown>>(
    useCallback((data: Record<string, unknown>) => carrierApi.updateCarrier(DEMO_CARRIER_ID, data), [])
  );

  const updatePrefsMutation = useMutation<Record<string, unknown>>(
    useCallback((prefs: Record<string, unknown>) => carrierApi.updatePreferences(DEMO_CARRIER_ID, prefs), [])
  );

  // Local form state — populated from API or defaults
  const [companyName, setCompanyName] = useState('TransPro Logistics LLC');
  const [dotNumber, setDotNumber] = useState('3847291');
  const [mcNumber, setMcNumber] = useState('MC-928471');
  const [phone, setPhone] = useState('(555) 234-5678');
  const [address, setAddress] = useState('4521 Industrial Blvd, Houston, TX 77001');

  const [selectedCdl, setSelectedCdl] = useState<string[]>(['A', 'B']);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>(['OTR', 'Regional']);
  const [minExperience, setMinExperience] = useState('2');
  const [notifications, setNotifications] = useState<Record<NotifKey, boolean>>({
    emailApps: true,
    emailMatches: true,
    smsUrgent: false,
    pushDispatch: true,
    emailBilling: true,
  });

  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Populate form from API data when available
  useEffect(() => {
    if (carrierData) {
      const c = carrierData as Record<string, unknown>;
      if (c.companyName) setCompanyName(c.companyName as string);
      if (c.dotNumber) setDotNumber(String(c.dotNumber));
      if (c.mcNumber) setMcNumber(c.mcNumber as string);
      if (c.phone) setPhone(c.phone as string);
      if (c.address) setAddress(c.address as string);
      if (c.preferredCdl) setSelectedCdl(c.preferredCdl as string[]);
      if (c.preferredRoutes) setSelectedRoutes(c.preferredRoutes as string[]);
      if (c.minExperience) setMinExperience(String(c.minExperience));
    }
  }, [carrierData]);

  const toggleCdl = (cls: string) => {
    setSelectedCdl((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  };

  const toggleRoute = (rt: string) => {
    setSelectedRoutes((prev) =>
      prev.includes(rt) ? prev.filter((r) => r !== rt) : [...prev, rt]
    );
  };

  const toggleNotif = (key: NotifKey) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveCompany = async () => {
    setSaveSuccess(null);
    const result = await updateCarrierMutation.execute({
      companyName,
      dotNumber,
      mcNumber,
      phone,
      address,
    });
    if (result) {
      setSaveSuccess('Company info saved');
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  };

  const handleSavePreferences = async () => {
    setSaveSuccess(null);
    const result = await updatePrefsMutation.execute({
      preferredCdl: selectedCdl,
      preferredRoutes: selectedRoutes,
      minExperience: Number(minExperience),
    });
    if (result) {
      setSaveSuccess('Preferences saved');
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  };

  const mutationError = updateCarrierMutation.error || updatePrefsMutation.error;

  return (
    <div className="space-y-7">
      {/* ═══ Header ═══ */}
      <div className="animate-fade-up flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>Settings</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
            Company profile, hiring preferences, and notification controls
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-xs font-semibold animate-pulse" style={{ color: 'var(--neu-text-muted)' }}>
              Loading...
            </span>
          )}
          {error && (
            <Badge variant="warning" icon="cloud_off">Using defaults</Badge>
          )}
          <Button variant="ghost" icon="refresh" size="sm" onClick={refresh}>
            Refresh
          </Button>
        </div>
      </div>

      {/* ═══ Status Banners ═══ */}
      {saveSuccess && (
        <Card elevation="sm" className="animate-fade-up">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-green-500">check_circle</span>
            <span className="text-sm font-semibold text-green-600">{saveSuccess}</span>
          </div>
        </Card>
      )}
      {mutationError && (
        <Card elevation="sm" className="animate-fade-up">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-red-500">error</span>
            <span className="text-sm text-red-600">{mutationError}</span>
          </div>
        </Card>
      )}

      {/* ═══ Company Information ═══ */}
      <Card elevation="md" className="animate-fade-up stagger-1">
        <div className="flex items-center gap-2 mb-6">
          <div className="neu-x w-9 h-9 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>business</span>
          </div>
          <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Company Information</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Input id="companyName" label="Company Name" icon="badge" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          <Input id="dotNumber" label="DOT Number" icon="tag" value={dotNumber} onChange={(e) => setDotNumber(e.target.value)} />
          <Input id="mcNumber" label="MC Number" icon="confirmation_number" value={mcNumber} onChange={(e) => setMcNumber(e.target.value)} />
          <Input id="phone" label="Phone" icon="call" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="sm:col-span-2">
            <Input id="address" label="Address" icon="location_on" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
        </div>

        <div className="flex justify-end mt-5 pt-4" style={{ borderTop: '1px solid var(--neu-border)' }}>
          <Button
            variant="primary"
            icon="save"
            onClick={handleSaveCompany}
            disabled={updateCarrierMutation.loading}
          >
            {updateCarrierMutation.loading ? 'Saving...' : 'Save Company Info'}
          </Button>
        </div>
      </Card>

      {/* ═══ Hiring Preferences ═══ */}
      <Card elevation="md" className="animate-fade-up stagger-2">
        <div className="flex items-center gap-2 mb-6">
          <div className="neu-x w-9 h-9 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>tune</span>
          </div>
          <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Hiring Preferences</h3>
        </div>

        {/* CDL Classes */}
        <div className="mb-6">
          <p className="kpi-label mb-2">PREFERRED CDL CLASSES</p>
          <div className="flex gap-3">
            {cdlClasses.map((cls) => (
              <button
                key={cls}
                onClick={() => toggleCdl(cls)}
                className={`
                  w-16 h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all duration-200
                  ${selectedCdl.includes(cls)
                    ? 'btn-glow text-white'
                    : 'neu-x hover:translate-y-[-1px]'
                  }
                `}
                style={!selectedCdl.includes(cls) ? { color: 'var(--neu-text)' } : undefined}
              >
                <span className="text-lg font-bold">{cls}</span>
                <span className="text-[10px] font-semibold opacity-70">CDL</span>
              </button>
            ))}
          </div>
        </div>

        {/* Min Experience */}
        <div className="mb-6">
          <Input
            id="minExperience"
            label="Minimum Experience (years)"
            icon="military_tech"
            type="number"
            value={minExperience}
            onChange={(e) => setMinExperience(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {/* Route Types */}
        <div className="mb-5">
          <p className="kpi-label mb-2">ROUTE TYPES</p>
          <div className="flex flex-wrap gap-2">
            {routeTypes.map((rt) => (
              <button
                key={rt}
                onClick={() => toggleRoute(rt)}
                className="transition-all duration-150"
              >
                <Badge
                  variant={selectedRoutes.includes(rt) ? 'accent' : 'default'}
                  icon={selectedRoutes.includes(rt) ? 'check_circle' : 'circle'}
                >
                  {rt}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4" style={{ borderTop: '1px solid var(--neu-border)' }}>
          <Button
            variant="primary"
            icon="save"
            onClick={handleSavePreferences}
            disabled={updatePrefsMutation.loading}
          >
            {updatePrefsMutation.loading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </Card>

      {/* ═══ Notification Settings ═══ */}
      <Card elevation="md" className="animate-fade-up stagger-3">
        <div className="flex items-center gap-2 mb-6">
          <div className="neu-x w-9 h-9 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>notifications</span>
          </div>
          <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Notification Settings</h3>
        </div>

        <div className="space-y-1">
          {notificationItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-3 px-3 rounded-xl transition-colors hover:bg-[var(--neu-shadow-d)]/5"
            >
              <div className="flex items-center gap-3">
                <div className="neu-ins w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[16px]" style={{ color: 'var(--neu-text-muted)' }}>
                    {item.icon}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>{item.label}</p>
                  <p className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>{item.desc}</p>
                </div>
              </div>
              <button
                onClick={() => toggleNotif(item.key)}
                className={`
                  relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0
                  ${notifications[item.key] ? 'bg-[var(--neu-accent)]' : 'neu-ins'}
                `}
              >
                <span
                  className={`
                    absolute top-[3px] left-[3px] w-[22px] h-[22px] rounded-full bg-white shadow-md transition-transform duration-200
                    ${notifications[item.key] ? 'translate-x-[20px]' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* ═══ Safety & Compliance ═══ */}
      <Card elevation="md" className="animate-fade-up stagger-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="neu-x w-9 h-9 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>verified_user</span>
          </div>
          <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Safety & Compliance</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <p className="kpi-label">FMCSA RATING</p>
            <Badge variant="success" icon="verified" className="text-sm py-1 px-3">
              Satisfactory
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="kpi-label">INSURANCE STATUS</p>
            <div className="flex items-center gap-2">
              <Badge variant="success" dot>Active</Badge>
              <span className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                Exp. Sep 2026
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="kpi-label">LAST DOT AUDIT</p>
            <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>Jan 15, 2026</p>
            <p className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>No violations found</p>
          </div>
          <div className="space-y-1">
            <p className="kpi-label">SAFETY SCORE</p>
            <p className="text-2xl font-bold" style={{ color: 'var(--neu-accent)' }}>94.6</p>
            <p className="text-[10px]" style={{ color: '#22c55e' }}>Above fleet average</p>
          </div>
        </div>

        <div className="mt-5 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--neu-border)' }}>
          <span className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
            Data sourced from FMCSA SAFER system
          </span>
          <Button variant="ghost" icon="open_in_new" size="sm">View Full Report</Button>
        </div>
      </Card>
    </div>
  );
}
