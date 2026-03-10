'use client';

import { Card, Badge, Button, DataTable, ProgressBar } from '@/components/ui';
import { billingApi } from '@/lib/api';
import { useApi } from '@/lib/hooks';

const DEMO_CARRIER_ID = 'demo-carrier-001';

/* ── Types ──────────────────────────────────────────────────── */
interface Invoice {
  [key: string]: unknown;
  invoiceNo: string;
  date: string;
  amount: string;
  status: 'paid' | 'pending' | 'overdue';
}

interface Subscription {
  name: string;
  price: string;
  period: string;
  renewDate: string;
  features: string[];
}

/* ── Fallback Mock Data ───────────────────────────────────────── */
const mockPlan: Subscription = {
  name: 'Growth Plan',
  price: '$499',
  period: '/month',
  renewDate: 'Apr 1, 2026',
  features: [
    '20 active job posts',
    'AI-powered driver matching',
    'Priority support (4hr SLA)',
    'Advanced analytics dashboard',
    'Custom branding on listings',
    'Unlimited driver searches',
  ],
};

const mockUsage = [
  { label: 'Job Posts', value: 15, max: 20, color: 'blue' as const },
  { label: 'Driver Searches', value: 142, max: 200, color: 'green' as const },
  { label: 'AI Matches', value: 45, max: 50, color: 'amber' as const },
];

const mockInvoices: Invoice[] = [
  { invoiceNo: 'INV-2026-0312', date: 'Mar 1, 2026', amount: '$499.00', status: 'pending' },
  { invoiceNo: 'INV-2026-0287', date: 'Feb 1, 2026', amount: '$499.00', status: 'paid' },
  { invoiceNo: 'INV-2026-0251', date: 'Jan 1, 2026', amount: '$499.00', status: 'paid' },
  { invoiceNo: 'INV-2025-0219', date: 'Dec 1, 2025', amount: '$399.00', status: 'paid' },
  { invoiceNo: 'INV-2025-0188', date: 'Nov 1, 2025', amount: '$399.00', status: 'paid' },
  { invoiceNo: 'INV-2025-0157', date: 'Oct 1, 2025', amount: '$399.00', status: 'overdue' },
];

const statusBadge: Record<string, { variant: 'success' | 'warning' | 'error'; icon: string }> = {
  paid: { variant: 'success', icon: 'check_circle' },
  pending: { variant: 'warning', icon: 'schedule' },
  overdue: { variant: 'error', icon: 'error' },
};

const invoiceColumns = [
  { key: 'invoiceNo', header: 'Invoice #', render: (r: Invoice) => (
    <span className="font-mono text-xs font-bold" style={{ color: 'var(--neu-accent)' }}>{r.invoiceNo}</span>
  )},
  { key: 'date', header: 'Date' },
  { key: 'amount', header: 'Amount', render: (r: Invoice) => (
    <span className="font-bold" style={{ color: 'var(--neu-text)' }}>{r.amount}</span>
  )},
  { key: 'status', header: 'Status', render: (r: Invoice) => (
    <Badge variant={statusBadge[r.status].variant} icon={statusBadge[r.status].icon}>
      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
    </Badge>
  )},
  { key: 'download', header: '', render: () => (
    <button className="inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:opacity-80" style={{ color: 'var(--neu-accent)' }}>
      <span className="material-symbols-outlined text-[16px]">download</span>
      PDF
    </button>
  )},
];

export default function CarrierBillingPage() {
  const { data: apiInvoices, loading: invoicesLoading, error: invoicesError, refresh: refreshInvoices } = useApi<Invoice[]>(
    () => billingApi.listInvoices(DEMO_CARRIER_ID) as Promise<{ data: Invoice[] }>,
    [DEMO_CARRIER_ID]
  );

  const { data: apiSubscription, loading: subLoading, error: subError, refresh: refreshSub } = useApi<Subscription>(
    () => billingApi.getSubscription(DEMO_CARRIER_ID) as Promise<{ data: Subscription }>,
    [DEMO_CARRIER_ID]
  );

  const loading = invoicesLoading || subLoading;
  const hasError = invoicesError || subError;
  const invoices: Invoice[] = apiInvoices ?? mockInvoices;
  const plan: Subscription = apiSubscription ?? mockPlan;
  const usage = mockUsage; // Usage typically comes from subscription data

  const handleRefresh = () => {
    refreshInvoices();
    refreshSub();
  };

  return (
    <div className="space-y-7">
      {/* ═══ Header ═══ */}
      <div className="animate-fade-up flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--neu-text)' }}>Billing</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
            Manage your subscription, usage, and invoices
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-xs font-semibold animate-pulse" style={{ color: 'var(--neu-text-muted)' }}>
              Loading...
            </span>
          )}
          {hasError && (
            <Badge variant="warning" icon="cloud_off">Using cached data</Badge>
          )}
          <Button variant="ghost" icon="refresh" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
        </div>
      </div>

      {/* ═══ Current Plan + Usage ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Plan Card */}
        <Card elevation="md" className="lg:col-span-3 animate-fade-up stagger-1">
          <div className="flex items-center gap-3 mb-5">
            <div className="neu-x w-11 h-11 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]" style={{ color: 'var(--neu-accent)' }}>
                credit_card
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold" style={{ color: 'var(--neu-text)' }}>{plan.name}</h3>
                <Badge variant="success" icon="check_circle">Active</Badge>
              </div>
              <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>Renews {plan.renewDate}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold" style={{ color: 'var(--neu-text)' }}>{plan.price}</span>
              <span className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>{plan.period}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-5">
            {plan.features.map((feat) => (
              <div key={feat} className="flex items-center gap-2 py-1.5">
                <span className="material-symbols-outlined text-[16px]" style={{ color: '#22c55e' }}>check_circle</span>
                <span className="text-xs font-medium" style={{ color: 'var(--neu-text)' }}>{feat}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4" style={{ borderTop: '1px solid var(--neu-border)' }}>
            <Button variant="primary" icon="upgrade">Upgrade Plan</Button>
            <Button variant="ghost" icon="settings">Manage</Button>
          </div>
        </Card>

        {/* Usage Card */}
        <Card elevation="md" className="lg:col-span-2 animate-fade-up stagger-2">
          <div className="flex items-center gap-2 mb-5">
            <div className="neu-x w-9 h-9 rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>
                data_usage
              </span>
            </div>
            <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>
              Usage This Cycle
            </h3>
          </div>

          <div className="space-y-6">
            {usage.map((u) => (
              <div key={u.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold" style={{ color: 'var(--neu-text-muted)' }}>
                    {u.label}
                  </span>
                  <span className="text-xs font-bold" style={{ color: 'var(--neu-text)' }}>
                    {u.value} / {u.max}
                  </span>
                </div>
                <ProgressBar value={u.value} max={u.max} color={u.color} />
                {u.value / u.max >= 0.9 && (
                  <p className="text-[10px] font-semibold mt-1" style={{ color: '#f59e0b' }}>
                    Approaching limit
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--neu-border)' }}>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-text-muted)' }}>calendar_today</span>
              <span className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>
                Resets {plan.renewDate}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* ═══ Invoice History ═══ */}
      <div className="animate-fade-up stagger-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Invoice History</h3>
          <Button variant="ghost" icon="download" size="sm">Export All</Button>
        </div>
        <DataTable<Invoice>
          columns={invoiceColumns}
          data={invoices}
          emptyMessage="No invoices found"
          emptyIcon="receipt_long"
        />
      </div>
    </div>
  );
}
