import { query } from '@lmdr/db';
import type { DriverProfile, Job, MatchResult } from '@lmdr/types';

// Scoring weights (preserved from carrierMatching.jsw)
const WEIGHTS = {
  cdlMatch: 30,
  freightMatch: 25,
  stateProximity: 20,
  experienceBonus: 10,
  homeTimeMatch: 10,
  payCompatibility: 5,
};

export async function findJobsForDriver(driver: DriverProfile, limit: number): Promise<MatchResult[]> {
  const { rows } = await query(
    `SELECT _id, data FROM "airtable_job_postings"
     WHERE data->>'status' = 'open'
       AND data->>'cdlRequired' = $1
     LIMIT 500`,
    [driver.cdlClass]
  );

  const scored = rows.map((row: { _id: string; data: Record<string, unknown> }) => {
    const job = { _id: row._id, ...row.data } as unknown as Job;
    return scoreDriverJobPair(driver, job);
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function findDriversForJob(job: Job, limit: number): Promise<MatchResult[]> {
  const { rows } = await query(
    `SELECT _id, data FROM "airtable_driver_profiles"
     WHERE data->>'isSearchable' = 'true'
       AND data->>'cdlClass' = $1
     LIMIT 500`,
    [job.cdlRequired]
  );

  const scored = rows.map((row: { _id: string; data: Record<string, unknown> }) => {
    const driver = { _id: row._id, ...row.data } as unknown as DriverProfile;
    return scoreDriverJobPair(driver, job);
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

function scoreDriverJobPair(driver: DriverProfile, job: Job): MatchResult {
  let score = 0;
  const factors: Record<string, number> = {};

  // CDL class match (hard filter — already applied in query, but validate)
  factors.cdlMatch = driver.cdlClass === job.cdlRequired ? 1 : 0;
  score += factors.cdlMatch * WEIGHTS.cdlMatch;

  // Freight type match
  const freightPrefs = Array.isArray(driver.freightPreference) ? driver.freightPreference : [];
  factors.freightMatch = freightPrefs.includes(job.freightType) ? 1 : 0;
  score += factors.freightMatch * WEIGHTS.freightMatch;

  // Experience bonus
  factors.experienceBonus = driver.yearsExperience >= 2 ? 0.5 : 0;
  if (driver.yearsExperience >= 5) factors.experienceBonus = 1;
  score += factors.experienceBonus * WEIGHTS.experienceBonus;

  // State proximity
  factors.stateMatch = driver.homeState === job.state ? 1 : 0.3;
  score += factors.stateMatch * WEIGHTS.stateProximity;

  // Home time match
  if (job.homeTime && driver.freightPreference) {
    factors.homeTimeMatch = 0.5; // partial by default
  } else {
    factors.homeTimeMatch = 0;
  }
  score += factors.homeTimeMatch * WEIGHTS.homeTimeMatch;

  return {
    jobId: job._id,
    carrierId: job.carrierId,
    driverId: driver._id,
    score: Math.round(score),
    explanation: buildExplanation(factors),
    factors,
  };
}

function buildExplanation(factors: Record<string, number>): string {
  const parts: string[] = [];
  if (factors.cdlMatch === 1) parts.push('CDL class matches');
  if (factors.freightMatch === 1) parts.push('freight type aligns with preference');
  if (factors.experienceBonus > 0) parts.push('experience threshold met');
  if (factors.stateMatch === 1) parts.push('same state as home');
  if (factors.homeTimeMatch > 0) parts.push('home time compatible');
  return parts.length ? parts.join(', ') : 'Basic compatibility match';
}
