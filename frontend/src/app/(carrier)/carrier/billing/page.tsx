'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';

interface Invoice {
  [key: string]: unknown;
  invoiceNo: string;
  date: string;
  amount: string;
  status: 'paid' | 'pending' | 'overdue';
}

const invoices: Invoice[] = [
  { invoiceNo: 'INV-2026-0312', date: '2026-03-01', amount: '$499.00', status: 'pending' },
  { invoiceNo: 'INV-2026-0287', date: '2026-02-01', amount: '$499.00', status: 'paid' },
  { invoiceNo: 'INV-2026-0251', date: '2026-01-01', amount: '$499.00', status: 'paid' },
  { invoiceNo: 'INV-2025-0219', date: '2025-12-01', amount: '$399.00', status: 'paid' },
  { invoiceNo: 'INV-2025-0188', date: '2025-11-01', amount: '$399.00', status: 'paid' },
];

const statusVariant: Record<string, 'success' | 'warning' | 'error'> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'error',
};

const invoiceColumns = [
  { key: 'invoiceNo', header: 'Invoice #' },
  { key: 'date', header: 'Date' },
  { key: 'amount', header: 'Amount' },
  {
    key: 'status',
    header: 'Status',
    render: (row: Invoice) => (
      <Badge variant={statusVariant[row.status]}>{row.status}</Badge>
    ),
  },
  {
    key: 'download',
    header: '',
    render: () => (
      <button className="text-lmdr-blue hover:text-lmdr-deep text-sm flex items-center gap-1">
        <span className="material-symbols-outlined text-base">download</span>
        PDF
      </button>
    ),
  },
];

const rateCards = [
  { label: 'Per Job Post', value: '$25', note: 'Unlimited applicants' },
  { label: 'Per Successful Hire', value: '$150', note: 'Charged on acceptance' },
  { label: 'AI Match Premium', value: '$50/mo', note: 'Top-ranked visibility' },
];

export default function CarrierBillingPage() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-lmdr-dark">Billing & Invoices</h2>

      {/* Subscription Status */}
      <Card elevation="md" className="flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-lmdr-blue/10 text-lmdr-blue">
          <span className="material-symbols-outlined text-3xl">credit_card</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-lmdr-dark">Growth Plan</h3>
            <Badge variant="success">Active</Badge>
          </div>
          <p className="text-sm text-tan">$499/month &middot; Renews April 1, 2026</p>
          <p className="text-xs text-tan mt-1">Includes 20 job posts, AI matching, priority support</p>
        </div>
        <button className="text-sm text-lmdr-blue hover:text-lmdr-deep font-medium">
          Manage Subscription
        </button>
      </Card>

      {/* Rate Card Summary */}
      <div>
        <h3 className="text-lg font-semibold text-lmdr-dark mb-4">Rate Card</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {rateCards.map((rc) => (
            <Card key={rc.label} elevation="sm" className="text-center">
              <p className="text-sm text-tan mb-1">{rc.label}</p>
              <p className="text-2xl font-bold text-lmdr-dark">{rc.value}</p>
              <p className="text-xs text-tan mt-1">{rc.note}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Invoice History */}
      <div>
        <h3 className="text-lg font-semibold text-lmdr-dark mb-4">Invoice History</h3>
        <DataTable<Invoice> columns={invoiceColumns} data={invoices} />
      </div>
    </div>
  );
}
