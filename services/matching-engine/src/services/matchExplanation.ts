import { query } from '@lmdr/db';

export interface MatchExplanationResult {
  driverId: string;
  carrierId: string;
  overallScore: number;
  factors: MatchFactor[];
  summary: string;
}

interface MatchFactor {
  name: string;
  score: number;
  maxScore: number;
  description: string;
}

export async function getMatchExplanation(driverId: string, carrierId: string): Promise<MatchExplanationResult | null> {
  // Fetch driver and carrier data
  const [driverResult, carrierResult] = await Promise.all([
    query(`SELECT _id, data FROM "airtable_driver_profiles" WHERE _id = $1 LIMIT 1`, [driverId]),
    query(`SELECT _id, data FROM "airtable_carriers" WHERE _id = $1 LIMIT 1`, [carrierId]),
  ]);

  if (driverResult.rows.length === 0 || carrierResult.rows.length === 0) return null;

  const driver = driverResult.rows[0].data as Record<string, unknown>;
  const carrier = carrierResult.rows[0].data as Record<string, unknown>;

  const factors: MatchFactor[] = [];

  // CDL compatibility
  const cdlMatch = driver.cdlClass === carrier.cdlRequired;
  factors.push({
    name: 'CDL Class',
    score: cdlMatch ? 30 : 0,
    maxScore: 30,
    description: cdlMatch ? `Your CDL Class ${driver.cdlClass} matches this carrier's requirements` : `CDL Class mismatch`,
  });

  // Freight type
  const driverPrefs = Array.isArray(driver.freightPreference) ? driver.freightPreference : [];
  const freightMatch = driverPrefs.includes(carrier.freightType as string);
  factors.push({
    name: 'Freight Type',
    score: freightMatch ? 25 : 0,
    maxScore: 25,
    description: freightMatch ? `${carrier.freightType} matches your preferences` : `Freight type outside your preferences`,
  });

  // Location proximity
  const stateMatch = driver.homeState === carrier.state;
  factors.push({
    name: 'Location',
    score: stateMatch ? 20 : 6,
    maxScore: 20,
    description: stateMatch ? `Carrier operates in your home state` : `Carrier operates in a different state`,
  });

  // Experience
  const years = Number(driver.yearsExperience) || 0;
  const expScore = years >= 5 ? 10 : years >= 2 ? 5 : 0;
  factors.push({
    name: 'Experience',
    score: expScore,
    maxScore: 10,
    description: `${years} years of experience`,
  });

  // Pay range
  const payScore = carrier.payPerMile ? 10 : 5;
  factors.push({
    name: 'Pay',
    score: payScore,
    maxScore: 15,
    description: carrier.payPerMile ? `Pay rate: $${carrier.payPerMile}/mile` : `Pay information not available`,
  });

  const overallScore = factors.reduce((sum, f) => sum + f.score, 0);
  const summary = buildSummary(factors, overallScore);

  return {
    driverId,
    carrierId,
    overallScore,
    factors,
    summary,
  };
}

function buildSummary(factors: MatchFactor[], score: number): string {
  const strengths = factors.filter(f => f.score >= f.maxScore * 0.7).map(f => f.name);
  const weaknesses = factors.filter(f => f.score < f.maxScore * 0.3).map(f => f.name);

  let summary = `Overall match score: ${score}/100. `;
  if (strengths.length) summary += `Strong in: ${strengths.join(', ')}. `;
  if (weaknesses.length) summary += `Room for improvement: ${weaknesses.join(', ')}.`;
  return summary.trim();
}
