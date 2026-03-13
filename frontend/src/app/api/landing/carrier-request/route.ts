import { NextResponse } from 'next/server';

interface CarrierRequestPayload {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  dotNumber?: string;
  staffingType: string;
  driversNeeded: string;
  driverTypes: string[];
  additionalNotes?: string;
  sourceUrl?: string;
}

const CLOUD_RUN_URL = process.env.LMDR_API_URL || 'https://lmdr-api-140035137711.us-central1.run.app';
const INTERNAL_KEY = process.env.LMDR_INTERNAL_KEY || '';

function validate(payload: CarrierRequestPayload): string | null {
  if (!payload.companyName?.trim()) return 'Please enter your company name.';
  if (!payload.contactName?.trim()) return 'Please enter your name.';
  if (!payload.email?.trim()) return 'Please enter your email address.';
  if (!payload.phone?.trim()) return 'Please enter your phone number.';
  if (!payload.staffingType?.trim()) return 'Please select a staffing type.';
  if (!payload.driversNeeded?.trim()) return 'Please select how many drivers you need.';
  return null;
}

async function postLead(endpoint: string, payload: CarrierRequestPayload) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(endpoint.includes('/v1/admin/') ? { Authorization: `Bearer ${INTERNAL_KEY}` } : {}),
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Lead endpoint ${endpoint} returned ${response.status}`);
  }

  return response.json().catch(() => ({}));
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as CarrierRequestPayload;
  const validationError = validate(payload);

  if (validationError) {
    return NextResponse.json({ success: false, error: validationError }, { status: 400 });
  }

  const configuredEndpoint = process.env.LMDR_CARRIER_LEAD_ENDPOINT;
  if (!configuredEndpoint) {
    return NextResponse.json(
      {
        success: false,
        error: 'LMDR_CARRIER_LEAD_ENDPOINT is not configured. Set the exact GCP lead endpoint before deploy.',
      },
      { status: 503 }
    );
  }

  try {
    const result = await postLead(configuredEndpoint, {
      ...payload,
      sourceUrl: payload.sourceUrl || '/',
    });

    return NextResponse.json({
      success: true,
      leadId: result.leadId || result.id || result.checkoutToken || '',
      checkoutToken: result.checkoutToken || result.leadId || '',
      message: result.message || 'Staffing request submitted.',
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: `Carrier lead endpoint failed: ${configuredEndpoint}`,
      },
      { status: 503 }
    );
  }
}
