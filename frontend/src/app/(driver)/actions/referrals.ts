'use server';

import { driverFetch } from '@/lib/driver-api';

export interface Referral {
  _id: string;
  referrer_id: string;
  referred_name: string;
  referred_phone: string;
  referred_email?: string;
  cdl_class?: string;
  notes?: string;
  status: string;
  submitted_at: string;
  _createdAt: string;
}

export async function submitReferral(
  id: string,
  data: { name: string; phone: string; email?: string; cdlClass?: string; notes?: string }
) {
  return driverFetch<{ referralId: string; status: string }>(`/referrals/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getReferrals(id: string) {
  return driverFetch<{ referrals: Referral[] }>(`/referrals/${id}`);
}

export async function getReferral(id: string, refId: string) {
  return driverFetch<{ referral: Referral }>(`/referrals/${id}/${refId}`);
}
