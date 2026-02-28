// ============================================================================
// ADMIN AGENT KPIs — Agent orchestration metrics dashboard card
// VelocityMatch branding
// ============================================================================

(function() {
  'use strict';

  // Wait for DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    // Find or create container
    const container = document.getElementById('agentKpiSection') || createKpiSection();
    if (!container) return;

    // Request KPI data from page code
    if (window.parent) {
      window.parent.postMessage({ action: 'getAgentKpis', days: 7 }, '*');
    }
  });

  // Listen for KPI data from page code
  window.addEventListener('message', function(event) {
    if (!event.data || event.source !== window.parent) return;
    if (event.data.action === 'agentKpisLoaded' && event.data.payload) {
      renderKpis(event.data.payload);
    }
  });

  function createKpiSection() {
    // Try to find a main content container to append to
    const main = document.querySelector('main') || document.querySelector('.dashboard-content') || document.body;
    const section = document.createElement('div');
    section.id = 'agentKpiSection';
    section.className = 'mt-6 px-4';
    main.appendChild(section);
    return section;
  }

  function renderKpis(stats) {
    const section = document.getElementById('agentKpiSection');
    if (!section) return;

    const successColor = stats.success_rate >= 70 ? '#859900' : stats.success_rate >= 40 ? '#f59e0b' : '#ef4444';
    const qualityColor = stats.avg_quality_score >= 60 ? '#859900' : stats.avg_quality_score >= 30 ? '#f59e0b' : '#ef4444';
    const parallelColor = stats.parallel_run_rate >= 40 ? '#10b981' : stats.parallel_run_rate >= 15 ? '#f59e0b' : '#94a3b8';

    section.innerHTML = `
      <div style="background: linear-gradient(135deg, #0f172a, #1e293b); border-radius: 16px; padding: 20px; color: white; font-family: 'Inter', sans-serif;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
          <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #2563eb, #1e40af); display: flex; align-items: center; justify-content: center;">
            <span class="material-symbols-outlined" style="font-size: 18px; color: white;">smart_toy</span>
          </div>
          <div>
            <div style="font-size: 14px; font-weight: 600;">Agent Orchestration KPIs</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.5);">Last ${stats.period_days || 7} days</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px;">
          <!-- Total Runs -->
          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 14px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: #fbbf24;">${stats.total_runs || 0}</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 4px;">Total Runs</div>
          </div>

          <!-- Success Rate -->
          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 14px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: ${successColor};">${stats.success_rate || 0}%</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 4px;">Success Rate</div>
          </div>

          <!-- Quality Score -->
          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 14px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: ${qualityColor};">${stats.avg_quality_score || 0}</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 4px;">Avg Quality</div>
          </div>

          <!-- Partial Rate -->
          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 14px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${stats.partial_rate || 0}%</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 4px;">Partial</div>
          </div>

          <!-- Failure Rate -->
          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 14px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: #ef4444;">${stats.failure_rate || 0}%</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 4px;">Failure Rate</div>
          </div>

          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 14px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: ${parallelColor};">${stats.parallel_run_rate || 0}%</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 4px;">Parallelized</div>
          </div>

          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 14px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: #60a5fa;">${stats.avg_branch_count || 0}</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 4px;">Avg Branches</div>
          </div>

          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 14px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: #f97316;">${stats.degraded_run_rate || 0}%</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 4px;">Degraded Runs</div>
          </div>

          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 14px; text-align: center;">
            <div style="font-size: 24px; font-weight: 700; color: #c084fc;">${stats.avg_approval_wait || '-'}</div>
            <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 4px;">Avg Gate Wait</div>
          </div>
        </div>

        <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 8px;">
          ${renderExecutionMix(stats.execution_model_mix || {})}
        </div>

        <div style="margin-top: 12px; font-size: 10px; color: rgba(255,255,255,0.3); text-align: right;">
          Powered by VelocityMatch Agent Orchestration
        </div>
      </div>
    `;
  }

  function renderExecutionMix(mix) {
    const keys = Object.keys(mix || {});
    if (keys.length === 0) return '';
    return keys.map((key) => {
      return `<div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 9999px; padding: 6px 10px; font-size: 11px; color: rgba(255,255,255,0.75);">
        ${key}: <span style="color: white; font-weight: 600;">${mix[key]}</span>
      </div>`;
    }).join('');
  }

})();
