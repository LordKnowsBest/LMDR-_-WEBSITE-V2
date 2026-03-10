import { query } from '@lmdr/db';

// Scoring weights from driverScoring.js
const SCORING_WEIGHTS = {
  profileCompleteness: 15,
  documentsSubmitted: 20,
  experienceYears: 15,
  endorsements: 10,
  safetyRecord: 20,
  responsiveness: 10,
  marketAdjustment: 10,
};

export interface DriverScoreResult {
  driverId: string;
  totalScore: number;
  breakdown: Record<string, number>;
  tier: 'gold' | 'silver' | 'bronze' | 'unranked';
}

export async function scoreDriver(driverId: string): Promise<DriverScoreResult> {
  const { rows } = await query(
    `SELECT _id, data FROM "airtable_driver_profiles" WHERE _id = $1 LIMIT 1`,
    [driverId]
  );

  if (rows.length === 0) {
    return { driverId, totalScore: 0, breakdown: {}, tier: 'unranked' };
  }

  const profile = rows[0].data as Record<string, unknown>;
  const breakdown: Record<string, number> = {};

  // Profile completeness
  const requiredFields = ['cdlClass', 'homeState', 'yearsExperience', 'freightPreference'];
  const filledFields = requiredFields.filter(f => profile[f] !== null && profile[f] !== undefined && profile[f] !== '');
  breakdown.profileCompleteness = (filledFields.length / requiredFields.length) * SCORING_WEIGHTS.profileCompleteness;

  // Documents submitted
  breakdown.documentsSubmitted = profile.docsSubmitted === true || profile.docsSubmitted === 'Yes'
    ? SCORING_WEIGHTS.documentsSubmitted
    : 0;

  // Experience years
  const years = Number(profile.yearsExperience) || 0;
  breakdown.experienceYears = Math.min(years / 10, 1) * SCORING_WEIGHTS.experienceYears;

  // Endorsements
  const endorsements = String(profile.endorsements || '');
  const endorsementCount = endorsements ? endorsements.split(',').length : 0;
  breakdown.endorsements = Math.min(endorsementCount / 3, 1) * SCORING_WEIGHTS.endorsements;

  // Safety record (clean MVR)
  breakdown.safetyRecord = profile.cleanMVR === 'Yes' ? SCORING_WEIGHTS.safetyRecord : 0;

  // Responsiveness (placeholder — based on response rate to carrier interest)
  breakdown.responsiveness = SCORING_WEIGHTS.responsiveness * 0.5;

  // Market adjustment (placeholder — from marketSignalsService)
  breakdown.marketAdjustment = SCORING_WEIGHTS.marketAdjustment * 0.5;

  const totalScore = Math.round(Object.values(breakdown).reduce((sum, v) => sum + v, 0));

  return {
    driverId,
    totalScore,
    breakdown,
    tier: totalScore >= 80 ? 'gold' : totalScore >= 60 ? 'silver' : totalScore >= 40 ? 'bronze' : 'unranked',
  };
}

export async function scoreDriverBatch(driverIds: string[]): Promise<DriverScoreResult[]> {
  return Promise.all(driverIds.map(id => scoreDriver(id)));
}

export function applyMarketAdjustment(score: number, factor: number): number {
  return Math.round(score * (2 - factor));
}
