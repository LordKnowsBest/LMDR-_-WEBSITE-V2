import { query, getTableName } from '@lmdr/db';

const DRIVERS_TABLE = getTableName('driverProfiles');
const CARRIERS_TABLE = getTableName('carriers');
const JOBS_TABLE = getTableName('jobPostings');
const INTERESTS_TABLE = getTableName('driverCarrierInterests');

export interface DashboardMetrics {
  totalDrivers: number;
  onboardedDrivers: number;
  totalCarriers: number;
  openJobs: number;
  activeAssignments: number;
  generatedAt: string;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [driversResult, onboardedResult, carriersResult, jobsResult, assignmentsResult] =
    await Promise.all([
      query(`SELECT COUNT(*) as count FROM "${DRIVERS_TABLE}"`),
      query(
        `SELECT COUNT(*) as count FROM "${DRIVERS_TABLE}" WHERE data->>'onboardingComplete' = 'true'`
      ),
      query(`SELECT COUNT(*) as count FROM "${CARRIERS_TABLE}"`),
      query(
        `SELECT COUNT(*) as count FROM "${JOBS_TABLE}" WHERE data->>'status' = 'open'`
      ),
      query(
        `SELECT COUNT(*) as count FROM "${INTERESTS_TABLE}" WHERE data->>'status' = 'active'`
      ),
    ]);

  return {
    totalDrivers: Number(driversResult.rows[0].count),
    onboardedDrivers: Number(onboardedResult.rows[0].count),
    totalCarriers: Number(carriersResult.rows[0].count),
    openJobs: Number(jobsResult.rows[0].count),
    activeAssignments: Number(assignmentsResult.rows[0].count),
    generatedAt: new Date().toISOString(),
  };
}
