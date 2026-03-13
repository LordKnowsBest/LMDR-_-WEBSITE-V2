import { NextResponse } from 'next/server';

import { adminFetch } from '@/lib/admin-api';

type DriverRecord = Record<string, unknown>;
type PreviewPayload = {
  success: boolean;
  preview: {
    count: number;
    breakdown?: {
      byClass?: Record<string, number>;
      withEndorsements?: number;
      avgExperience?: number;
    };
    message: string;
    hasMatches: boolean;
    exceedsNeed: boolean | null;
  };
};

interface PreviewRequest {
  cdlTypes?: string[];
  endorsements?: string[];
  driversNeeded?: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const previewCache = new Map<string, { expiresAt: number; payload: PreviewPayload }>();

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function normalize(value: string): string {
  return value.trim().toUpperCase();
}

function parseDriverNeeded(value?: string): number | null {
  if (!value) return null;
  if (value.endsWith('+')) {
    return Number.parseInt(value, 10) || null;
  }
  return Number.parseInt(value, 10) || null;
}

function isSearchable(driver: DriverRecord): boolean {
  const searchable = driver.is_searchable;
  const visibility = String(driver.visibility_level || '').toLowerCase();
  const searchableOk = searchable === true || String(searchable).toLowerCase() === 'yes';
  return searchableOk && visibility !== 'hidden';
}

function matchesCriteria(driver: DriverRecord, criteria: PreviewRequest): boolean {
  if (!isSearchable(driver)) return false;

  const driverClass = normalize(String(driver.cdl_class || driver.cdlClass || ''));
  const driverEndorsements = asArray(driver.endorsements).map(normalize);

  if (criteria.cdlTypes?.length) {
    const requiredClasses = criteria.cdlTypes.map(normalize);
    if (!requiredClasses.includes(driverClass)) {
      return false;
    }
  }

  if (criteria.endorsements?.length) {
    const requiredEndorsements = criteria.endorsements.map(normalize);
    if (!requiredEndorsements.every((endorsement) => driverEndorsements.includes(endorsement))) {
      return false;
    }
  }

  return true;
}

export async function POST(request: Request) {
  const criteria = (await request.json().catch(() => ({}))) as PreviewRequest;
  const cacheKey = JSON.stringify({
    cdlTypes: [...(criteria.cdlTypes || [])].sort(),
    endorsements: [...(criteria.endorsements || [])].sort(),
    driversNeeded: criteria.driversNeeded || '',
  });
  const cached = previewCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json(cached.payload);
  }

  if (!process.env.LMDR_INTERNAL_KEY) {
    return NextResponse.json(
      {
        success: false,
        error: 'LMDR_INTERNAL_KEY is not configured for match preview.',
        preview: {
          count: 0,
          message: "Match preview is unavailable until LMDR_INTERNAL_KEY is configured.",
          hasMatches: false,
          exceedsNeed: null,
        },
      },
      { status: 503 }
    );
  }

  try {
    const response = await adminFetch<{ items: DriverRecord[]; totalCount: number; limit: number; skip: number }>(
      '/drivers/query',
      {
        method: 'POST',
        body: JSON.stringify({ limit: 500, skip: 0 }),
      }
    );

    const drivers = (response.items || []).filter((driver) => matchesCriteria(driver, criteria));
    const breakdown = {
      byClass: {} as Record<string, number>,
      withEndorsements: 0,
      avgExperience: 0,
    };

    let totalExperience = 0;
    drivers.forEach((driver) => {
      const driverClass = String(driver.cdl_class || driver.cdlClass || 'Unknown');
      breakdown.byClass[driverClass] = (breakdown.byClass[driverClass] || 0) + 1;

      const endorsements = asArray(driver.endorsements);
      if (endorsements.length > 0) {
        breakdown.withEndorsements += 1;
      }

      totalExperience += Number(driver.years_experience || driver.yearsExperience || 0);
    });

    breakdown.avgExperience = drivers.length > 0
      ? Math.round((totalExperience / drivers.length) * 10) / 10
      : 0;

    const totalCount = drivers.length;
    let message = 'Submit your request and we will match you with qualified drivers.';
    if (totalCount === 0) {
      message = "We do not have exact matches yet, but our network is growing daily.";
    } else if (totalCount < 5) {
      message = `We have ${totalCount} drivers that match your criteria.`;
    } else if (totalCount < 20) {
      message = `Great news! ${totalCount} qualified drivers match your needs.`;
    } else {
      message = `Excellent! ${totalCount}+ drivers are ready to connect with you.`;
    }

    const payload: PreviewPayload = {
      success: true,
      preview: {
        count: totalCount,
        breakdown,
        message,
        hasMatches: totalCount > 0,
        exceedsNeed: criteria.driversNeeded
          ? totalCount >= (parseDriverNeeded(criteria.driversNeeded) || 0)
          : null,
      },
    };

    previewCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      payload,
    });

    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate preview';
    return NextResponse.json(
      {
        success: false,
        error: message,
        preview: {
          count: 0,
          message: "Submit your request and we'll match you with qualified drivers.",
          hasMatches: false,
        },
      },
      { status: 200 }
    );
  }
}
