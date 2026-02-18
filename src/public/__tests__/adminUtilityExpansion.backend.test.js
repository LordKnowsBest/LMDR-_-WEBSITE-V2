/* eslint-env jest */
/* eslint-disable */

const fs = require('fs');
const path = require('path');

const aiRouterPath = path.resolve(__dirname, '..', '..', 'backend', 'aiRouterService.jsw');
const observabilityPath = path.resolve(__dirname, '..', '..', 'backend', 'observabilityService.jsw');
const auditServicePath = path.resolve(__dirname, '..', '..', 'backend', 'admin_audit_service.jsw');
const jobsConfigPath = path.resolve(__dirname, '..', '..', 'backend', 'jobs.config');
const configDataPath = path.resolve(__dirname, '..', '..', 'backend', 'configData.js');

describe('Admin Utility Expansion backend completion checks', () => {
  test('aiRouterService exposes cost optimizer APIs and fallback flow', () => {
    const source = fs.readFileSync(aiRouterPath, 'utf8');
    expect(source).toContain('export async function getCostOptimizerConfig');
    expect(source).toContain('export async function updateCostOptimizerConfig');
    expect(source).toContain('export async function getProviderCostMetrics');
    expect(source).toContain('export async function getCostSavingsReport');
    expect(source).toContain('export async function selectOptimalProvider');
    expect(source).toContain('providerCostMetricsCacheExpiry');
    expect(source).toContain('optimizerFallbackQueue');
    expect(source).toContain('updateProviderCostsJob');
  });

  test('observabilityService exposes anomaly engine APIs', () => {
    const source = fs.readFileSync(observabilityPath, 'utf8');
    expect(source).toContain('export async function calculateBaseline');
    expect(source).toContain('export async function updateBaselines');
    expect(source).toContain('export async function runAnomalyDetection');
    expect(source).toContain('export async function getActiveAnomalies');
    expect(source).toContain('export async function acknowledgeAnomaly');
    expect(source).toContain('export async function resolveAnomaly');
    expect(source).toContain('export async function getAnomalyRules');
    expect(source).toContain('export async function updateAnomalyRule');
    expect(source).toContain('export async function createAnomalyRule');
    expect(source).toContain('export async function deleteAnomalyRule');
    expect(source).toContain('export async function getAnomalyHistory');
  });

  test('admin_audit_service exposes compliance reporting APIs', () => {
    const source = fs.readFileSync(auditServicePath, 'utf8');
    expect(source).toContain('export async function generateComplianceReport');
    expect(source).toContain('export async function getReportTemplates');
    expect(source).toContain('export async function getReportStatus');
    expect(source).toContain('export async function listComplianceReports');
    expect(source).toContain('export async function deleteComplianceReport');
    expect(source).toContain('export async function downloadReport');
    expect(source).toContain('export async function createScheduledReport');
    expect(source).toContain('export async function updateScheduledReport');
    expect(source).toContain('export async function deleteScheduledReport');
    expect(source).toContain('export async function getScheduledReports');
    expect(source).toContain('export async function runScheduledReports');
    expect(source).toContain('applyPIIMasking');
  });

  test('jobs.config registers anomaly, baseline, cost, and scheduled-report jobs', () => {
    const config = JSON.parse(fs.readFileSync(jobsConfigPath, 'utf8'));
    const names = new Set((config.jobs || []).map((job) => job.functionName));
    expect(names.has('updateProviderCostsJob')).toBe(true);
    expect(names.has('runAnomalyDetection')).toBe(true);
    expect(names.has('updateBaselines')).toBe(true);
    expect(names.has('runScheduledReports')).toBe(true);
  });

  test('configData routes new collections through dual-source mappings', () => {
    const source = fs.readFileSync(configDataPath, 'utf8');
    expect(source).toContain("aiProviderCosts: 'airtable'");
    expect(source).toContain("costOptimizerConfig: 'airtable'");
    expect(source).toContain("anomalyAlerts: 'airtable'");
    expect(source).toContain("anomalyRules: 'airtable'");
    expect(source).toContain("baselineMetrics: 'airtable'");
    expect(source).toContain("aiProviderCosts: 'v2_AI Provider Costs'");
    expect(source).toContain("costOptimizerConfig: 'v2_Cost Optimizer Config'");
    expect(source).toContain("anomalyAlerts: 'v2_Anomaly Alerts'");
    expect(source).toContain("anomalyRules: 'v2_Anomaly Rules'");
    expect(source).toContain("baselineMetrics: 'v2_Baseline Metrics'");
  });

  test('airtable schema docs exist for new track collections', () => {
    const schemaDir = path.resolve(__dirname, '..', '..', '..', 'docs', 'schemas', 'airtable');
    const expected = [
      'v2_AI_Provider_Costs.md',
      'v2_Cost_Optimizer_Config.md',
      'v2_Anomaly_Alerts.md',
      'v2_Anomaly_Rules.md',
      'v2_Baseline_Metrics.md',
      'v2_Compliance_Reports.md',
      'v2_Scheduled_Reports.md'
    ];
    expected.forEach((file) => {
      expect(fs.existsSync(path.join(schemaDir, file))).toBe(true);
    });
  });
});
