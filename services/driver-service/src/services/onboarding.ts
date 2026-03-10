import { query, getTableName, buildUpdateQuery } from '@lmdr/db';

const DRIVER_TABLE = getTableName('driverProfiles');
const DOCS_TABLE = getTableName('qualificationFiles');

export const ONBOARDING_STEPS = [
  { step: 1, name: 'profile_created', next: 'documents_required', requiredDocs: [] },
  { step: 2, name: 'documents_required', next: 'cdl_submitted', requiredDocs: ['cdl_front', 'cdl_back'] },
  { step: 3, name: 'cdl_submitted', next: 'background_check', requiredDocs: [] },
  { step: 4, name: 'background_check', next: 'mvr_check', requiredDocs: [] },
  { step: 5, name: 'mvr_check', next: 'profile_review', requiredDocs: [] },
  { step: 6, name: 'profile_review', next: 'active', requiredDocs: [] },
  { step: 7, name: 'active', next: null, requiredDocs: [] },
] as const;

export async function getOnboardingStatus(driverId: string) {
  const result = await query(
    `SELECT _id, data FROM "${DRIVER_TABLE}" WHERE _id = $1 LIMIT 1`,
    [driverId]
  );
  if (result.rows.length === 0) return null;

  const profile = result.rows[0].data as Record<string, unknown>;
  const currentStep = Number(profile.onboardingStep) || 1;
  const stepDef = ONBOARDING_STEPS.find(s => s.step === currentStep) || ONBOARDING_STEPS[0];

  // Get submitted docs for this driver
  const docsResult = await query(
    `SELECT data->>'docType' as doc_type FROM "${DOCS_TABLE}" WHERE data->>'driverId' = $1`,
    [driverId]
  );
  const submittedDocs = docsResult.rows.map(r => r.doc_type);

  const nextStep = ONBOARDING_STEPS.find(s => s.step === currentStep + 1);
  const nextRequired = nextStep ? nextStep.requiredDocs.filter((d: string) => !submittedDocs.includes(d)) : [];

  return {
    step: currentStep,
    name: stepDef.name,
    isComplete: profile.onboardingComplete === true,
    submittedDocs,
    nextRequired,
    totalSteps: ONBOARDING_STEPS.length,
  };
}

export async function advanceOnboardingStep(driverId: string) {
  const status = await getOnboardingStatus(driverId);
  if (!status) throw new Error('Driver not found');
  if (status.isComplete) throw new Error('Onboarding already complete');

  const currentStep = status.step;
  const nextStepNum = currentStep + 1;
  const nextStep = ONBOARDING_STEPS.find(s => s.step === nextStepNum);

  if (!nextStep) throw new Error('Already at final step');

  // Check required docs for current step are submitted
  const currentStepDef = ONBOARDING_STEPS.find(s => s.step === currentStep);
  if (currentStepDef && currentStepDef.requiredDocs.length > 0) {
    const missing = currentStepDef.requiredDocs.filter((d: string) => !status.submittedDocs.includes(d));
    if (missing.length > 0) {
      throw new Error(`Missing required documents: ${missing.join(', ')}`);
    }
  }

  const updates: Record<string, unknown> = {
    onboardingStep: nextStepNum,
    updatedAt: new Date().toISOString(),
  };

  if (nextStep.name === 'active') {
    updates.onboardingComplete = true;
    updates.isSearchable = true;
  }

  const { sql, params } = buildUpdateQuery(DRIVER_TABLE, driverId, updates);
  await query(sql, params);

  return { step: nextStepNum, name: nextStep.name };
}
