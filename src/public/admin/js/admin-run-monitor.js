// ============================================================================
// ADMIN RUN MONITOR — Agent run monitoring dashboard section
// VelocityMatch branding
// ============================================================================

(function () {
  'use strict';

  const TABS = ['active', 'completed', 'audit', 'trends', 'evaluations'];
  const TAB_LABELS = { active: 'Active Runs', completed: 'Completed Runs', audit: 'Approval Audit', trends: 'Quality Trends', evaluations: 'Evaluations' };
  const TAB_ICONS = { active: 'play_circle', completed: 'check_circle', audit: 'gavel', trends: 'trending_up', evaluations: 'assessment' };

  let currentTab = 'active';
  let completedPage = 0;
  let completedTotal = 0;
  let activeRefreshTimer = null;
  let trendChart = null;

  // ===================== BOOTSTRAP =====================

  document.addEventListener('DOMContentLoaded', function () {
    const container = document.getElementById('runMonitorSection') || createSection();
    if (!container) return;
    renderShell(container);
    switchTab('active');
  });

  window.addEventListener('message', function (event) {
    if (!event.data || event.source !== window.parent) return;
    const { action, payload } = event.data;
    switch (action) {
      case 'agentRunsLoaded': onRunsLoaded(payload); break;
      case 'runDetailLoaded': onRunDetailLoaded(payload); break;
      case 'approvalAuditLoaded': onAuditLoaded(payload); break;
      case 'qualityTrendsLoaded': onTrendsLoaded(payload); break;
      case 'weeklyEvaluationLoaded': onEvaluationLoaded(payload); break;
    }
  });

  // ===================== SECTION SHELL =====================

  function createSection() {
    const anchor = document.getElementById('agentKpiSection');
    const parent = anchor ? anchor.parentNode : (document.querySelector('main') || document.querySelector('.dashboard-content') || document.body);
    const section = document.createElement('div');
    section.id = 'runMonitorSection';
    section.className = 'mt-6 px-4';
    if (anchor && anchor.nextSibling) {
      parent.insertBefore(section, anchor.nextSibling);
    } else {
      parent.appendChild(section);
    }
    return section;
  }

  function renderShell(container) {
    container.innerHTML = `
      <div style="background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:16px;padding:20px;color:white;font-family:'Inter',sans-serif;">
        <!-- Header -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#2563eb,#1e40af);display:flex;align-items:center;justify-content:center;">
              <span class="material-symbols-outlined" style="font-size:18px;color:white;">monitor_heart</span>
            </div>
            <div>
              <div style="font-size:14px;font-weight:600;">Agent Run Monitor</div>
              <div style="font-size:11px;color:rgba(255,255,255,0.5);">Real-time orchestration tracking</div>
            </div>
          </div>
          <button id="rmRefreshBtn" style="background:rgba(37,99,235,0.2);border:1px solid rgba(37,99,235,0.4);border-radius:8px;padding:4px 10px;color:#93c5fd;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:4px;">
            <span class="material-symbols-outlined" style="font-size:14px;">refresh</span> Refresh
          </button>
        </div>

        <!-- Tabs -->
        <div id="rmTabs" style="display:flex;gap:4px;margin-bottom:16px;flex-wrap:wrap;"></div>

        <!-- Content -->
        <div id="rmContent" style="min-height:200px;"></div>

        <div style="margin-top:12px;font-size:10px;color:rgba(255,255,255,0.3);text-align:right;">
          Powered by VelocityMatch Agent Orchestration
        </div>
      </div>
    `;

    // Render tab buttons
    const tabBar = container.querySelector('#rmTabs');
    for (const t of TABS) {
      const btn = document.createElement('button');
      btn.dataset.tab = t;
      btn.style.cssText = 'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:6px 12px;color:rgba(255,255,255,0.6);font-size:12px;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all 0.2s;';
      btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:14px;">${TAB_ICONS[t]}</span>${TAB_LABELS[t]}`;
      btn.addEventListener('click', function () { switchTab(t); });
      tabBar.appendChild(btn);
    }

    container.querySelector('#rmRefreshBtn').addEventListener('click', function () { switchTab(currentTab); });
  }

  function switchTab(tab) {
    currentTab = tab;
    clearInterval(activeRefreshTimer);
    activeRefreshTimer = null;

    // Highlight active tab
    const btns = document.querySelectorAll('#rmTabs button');
    for (const b of btns) {
      const isActive = b.dataset.tab === tab;
      b.style.background = isActive ? 'rgba(37,99,235,0.3)' : 'rgba(255,255,255,0.05)';
      b.style.borderColor = isActive ? 'rgba(37,99,235,0.6)' : 'rgba(255,255,255,0.1)';
      b.style.color = isActive ? '#93c5fd' : 'rgba(255,255,255,0.6)';
    }

    showLoading();

    switch (tab) {
      case 'active':
        requestRuns('running');
        activeRefreshTimer = setInterval(function () { requestRuns('running'); }, 10000);
        break;
      case 'completed':
        completedPage = 0;
        requestRuns('completed');
        break;
      case 'audit':
        send({ action: 'getApprovalAudit', days: 7 });
        break;
      case 'trends':
        send({ action: 'getQualityTrends', days: 7 });
        break;
      case 'evaluations':
        send({ action: 'getWeeklyEvaluation' });
        break;
    }
  }

  function requestRuns(status) {
    send({ action: 'getAgentRuns', status: status, limit: 20, offset: completedPage * 20 });
  }

  function send(msg) {
    if (window.parent) window.parent.postMessage(msg, '*');
  }

  // ===================== LOADING / EMPTY =====================

  function showLoading() {
    var el = document.getElementById('rmContent');
    if (el) el.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.4);font-size:13px;">Loading...</div>';
  }

  function showEmpty(msg) {
    var el = document.getElementById('rmContent');
    if (el) el.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(255,255,255,0.3);font-size:13px;">' + (msg || 'No data available') + '</div>';
  }

  // ===================== STATUS BADGES =====================

  function statusBadge(status) {
    var colors = {
      running: 'background:rgba(59,130,246,0.2);color:#93c5fd;',
      rate_limited: 'background:rgba(245,158,11,0.2);color:#fcd34d;',
      completed: 'background:rgba(16,185,129,0.2);color:#6ee7b7;',
      failed: 'background:rgba(239,68,68,0.2);color:#fca5a5;',
      token_cap: 'background:rgba(245,158,11,0.2);color:#fcd34d;',
      time_cap: 'background:rgba(245,158,11,0.2);color:#fcd34d;',
      aborted: 'background:rgba(239,68,68,0.2);color:#fca5a5;',
      approved: 'background:rgba(16,185,129,0.2);color:#6ee7b7;',
      rejected: 'background:rgba(239,68,68,0.2);color:#fca5a5;',
      pending: 'background:rgba(59,130,246,0.2);color:#93c5fd;',
      timeout: 'background:rgba(245,158,11,0.2);color:#fcd34d;'
    };
    var style = colors[status] || 'background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.6);';
    return '<span style="' + style + 'border-radius:9999px;padding:2px 8px;font-size:11px;font-weight:500;">' + esc(status || 'unknown') + '</span>';
  }

  function roleBadge(role) {
    var colors = {
      driver: '#3b82f6', recruiter: '#a855f7', admin: '#10b981', carrier: '#f59e0b'
    };
    var c = colors[role] || '#6b7280';
    return '<span style="background:' + c + '22;color:' + c + ';border-radius:9999px;padding:2px 8px;font-size:11px;font-weight:500;">' + esc(role || 'unknown') + '</span>';
  }

  function qualityBar(score) {
    var color = score >= 60 ? '#10b981' : score >= 30 ? '#f59e0b' : '#ef4444';
    return '<div style="display:flex;align-items:center;gap:6px;">' +
      '<div style="flex:1;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;min-width:40px;">' +
      '<div style="width:' + score + '%;height:100%;background:' + color + ';border-radius:3px;"></div></div>' +
      '<span style="font-size:11px;color:' + color + ';font-weight:600;min-width:28px;">' + score + '</span></div>';
  }

  function relTime(iso) {
    if (!iso) return '-';
    var diff = Date.now() - new Date(iso).getTime();
    if (diff < 60000) return Math.round(diff / 1000) + 's ago';
    if (diff < 3600000) return Math.round(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.round(diff / 3600000) + 'h ago';
    return Math.round(diff / 86400000) + 'd ago';
  }

  function truncate(str, len) {
    if (!str) return '-';
    return str.length > len ? str.substring(0, len) + '...' : str;
  }

  function esc(str) {
    var d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  // ===================== ACTIVE / COMPLETED RUNS =====================

  function onRunsLoaded(payload) {
    if (!payload) { showEmpty(); return; }
    var runs = payload.runs || [];
    var total = payload.total || 0;
    if (runs.length === 0) { showEmpty('No ' + currentTab + ' runs found'); return; }

    var isCompleted = (currentTab === 'completed');
    completedTotal = total;

    var html = '<div style="overflow-x:auto;">';
    html += '<table style="width:100%;border-collapse:collapse;font-size:12px;">';
    html += '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1);">';
    html += '<th style="padding:8px 6px;text-align:left;color:rgba(255,255,255,0.5);font-weight:500;">Run ID</th>';
    html += '<th style="padding:8px 6px;text-align:left;color:rgba(255,255,255,0.5);font-weight:500;">Role</th>';
    html += '<th style="padding:8px 6px;text-align:left;color:rgba(255,255,255,0.5);font-weight:500;">Goal</th>';
    html += '<th style="padding:8px 6px;text-align:left;color:rgba(255,255,255,0.5);font-weight:500;">Status</th>';
    if (isCompleted) {
      html += '<th style="padding:8px 6px;text-align:left;color:rgba(255,255,255,0.5);font-weight:500;">Quality</th>';
      html += '<th style="padding:8px 6px;text-align:left;color:rgba(255,255,255,0.5);font-weight:500;">Objective</th>';
      html += '<th style="padding:8px 6px;text-align:right;color:rgba(255,255,255,0.5);font-weight:500;">Tokens</th>';
    } else {
      html += '<th style="padding:8px 6px;text-align:right;color:rgba(255,255,255,0.5);font-weight:500;">Steps</th>';
    }
    html += '<th style="padding:8px 6px;text-align:right;color:rgba(255,255,255,0.5);font-weight:500;">Time</th>';
    html += '</tr></thead><tbody>';

    for (var i = 0; i < runs.length; i++) {
      var r = runs[i];
      html += '<tr class="rm-row" data-runid="' + esc(r.run_id || '') + '" style="border-bottom:1px solid rgba(255,255,255,0.05);cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background=\'rgba(37,99,235,0.1)\'" onmouseout="this.style.background=\'transparent\'">';
      html += '<td style="padding:8px 6px;color:rgba(255,255,255,0.7);font-family:monospace;font-size:11px;">' + esc(truncate(r.run_id, 16)) + '</td>';
      html += '<td style="padding:8px 6px;">' + roleBadge(r.role) + '</td>';
      html += '<td style="padding:8px 6px;color:rgba(255,255,255,0.8);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(truncate(r.goal_text, 40)) + '</td>';
      html += '<td style="padding:8px 6px;">' + statusBadge(r.status) + '</td>';
      if (isCompleted) {
        html += '<td style="padding:8px 6px;min-width:80px;">' + qualityBar(r.quality_score || 0) + '</td>';
        html += '<td style="padding:8px 6px;">' + statusBadge(r.objective_met || 'unknown') + '</td>';
        html += '<td style="padding:8px 6px;text-align:right;color:rgba(255,255,255,0.6);">' + (r.total_tokens || 0).toLocaleString() + '</td>';
      } else {
        html += '<td style="padding:8px 6px;text-align:right;color:rgba(255,255,255,0.6);">' + (r.steps_count || 0) + '</td>';
      }
      html += '<td style="padding:8px 6px;text-align:right;color:rgba(255,255,255,0.5);font-size:11px;">' + relTime(isCompleted ? r.completed_at : r.started_at) + '</td>';
      html += '</tr>';
    }

    html += '</tbody></table></div>';

    // Pagination for completed
    if (isCompleted && total > 20) {
      var totalPages = Math.ceil(total / 20);
      html += '<div style="display:flex;justify-content:center;align-items:center;gap:8px;margin-top:12px;">';
      html += '<button id="rmPrevPage" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:4px 10px;color:rgba(255,255,255,0.6);font-size:11px;cursor:pointer;"' + (completedPage === 0 ? ' disabled style="opacity:0.3;cursor:default;"' : '') + '>Prev</button>';
      html += '<span style="color:rgba(255,255,255,0.5);font-size:11px;">Page ' + (completedPage + 1) + ' of ' + totalPages + '</span>';
      html += '<button id="rmNextPage" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:4px 10px;color:rgba(255,255,255,0.6);font-size:11px;cursor:pointer;"' + (completedPage >= totalPages - 1 ? ' disabled style="opacity:0.3;cursor:default;"' : '') + '>Next</button>';
      html += '</div>';
    }

    var el = document.getElementById('rmContent');
    if (el) el.innerHTML = html;

    // Bind row clicks
    var rows = document.querySelectorAll('.rm-row');
    for (var j = 0; j < rows.length; j++) {
      rows[j].addEventListener('click', function () {
        var runId = this.dataset.runid;
        if (runId) {
          send({ action: 'getRunDetail', runId: runId });
          showRunDetailLoading(runId);
        }
      });
    }

    // Bind pagination
    var prevBtn = document.getElementById('rmPrevPage');
    var nextBtn = document.getElementById('rmNextPage');
    if (prevBtn) prevBtn.addEventListener('click', function () { if (completedPage > 0) { completedPage--; requestRuns('completed'); } });
    if (nextBtn) nextBtn.addEventListener('click', function () { if (completedPage < Math.ceil(completedTotal / 20) - 1) { completedPage++; requestRuns('completed'); } });
  }

  // ===================== RUN DETAIL PANEL =====================

  function showRunDetailLoading(runId) {
    var el = document.getElementById('rmContent');
    if (!el) return;
    var detail = document.createElement('div');
    detail.id = 'rmDetailPanel';
    detail.style.cssText = 'margin-top:16px;background:rgba(0,0,0,0.3);border-radius:12px;padding:16px;border:1px solid rgba(37,99,235,0.3);';
    detail.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
      '<span style="color:rgba(255,255,255,0.5);font-size:12px;">Loading run ' + esc(truncate(runId, 20)) + '...</span>' +
      '<button id="rmCloseDetail" style="background:none;border:none;color:rgba(255,255,255,0.4);cursor:pointer;font-size:16px;">✕</button></div>' +
      '<div style="text-align:center;padding:20px;color:rgba(255,255,255,0.3);font-size:12px;">Loading...</div>';
    el.appendChild(detail);
    document.getElementById('rmCloseDetail').addEventListener('click', function () { detail.remove(); });
  }

  function onRunDetailLoaded(payload) {
    if (!payload) return;
    var panel = document.getElementById('rmDetailPanel');
    if (!panel) {
      var el = document.getElementById('rmContent');
      if (!el) return;
      panel = document.createElement('div');
      panel.id = 'rmDetailPanel';
      panel.style.cssText = 'margin-top:16px;background:rgba(0,0,0,0.3);border-radius:12px;padding:16px;border:1px solid rgba(37,99,235,0.3);';
      el.appendChild(panel);
    }

    var run = payload.run || {};
    var steps = payload.steps || [];
    var gates = payload.gates || [];
    var outcome = payload.outcome || {};

    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
      '<div style="display:flex;align-items:center;gap:8px;">' +
      '<span class="material-symbols-outlined" style="font-size:16px;color:#93c5fd;">info</span>' +
      '<span style="font-size:13px;font-weight:600;color:white;">Run Detail</span></div>' +
      '<button id="rmCloseDetail" style="background:none;border:none;color:rgba(255,255,255,0.4);cursor:pointer;font-size:16px;">✕</button></div>';

    // Run header
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:16px;">';
    html += infoCard('Run ID', truncate(run.run_id, 20), 'monospace');
    html += infoCard('Role', run.role || '-');
    html += infoCard('Status', run.status || '-');
    html += infoCard('Quality', (outcome.quality_score != null ? outcome.quality_score : '-'));
    html += infoCard('Objective', outcome.objective_met || '-');
    html += infoCard('Tokens', (run.total_tokens || 0).toLocaleString());
    html += infoCard('Cost', '$' + ((run.total_cost_usd || 0).toFixed(4)));
    html += infoCard('Duration', run.sla_ms ? (run.sla_ms / 1000).toFixed(1) + 's' : '-');
    html += '</div>';

    // Goal
    html += '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:10px;margin-bottom:16px;">' +
      '<div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:4px;">Goal</div>' +
      '<div style="font-size:12px;color:rgba(255,255,255,0.8);">' + esc(run.goal_text || 'No goal specified') + '</div></div>';

    // Steps table
    if (steps.length > 0) {
      html += '<div style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.7);margin-bottom:8px;">Steps (' + steps.length + ')</div>';
      html += '<div style="overflow-x:auto;margin-bottom:16px;"><table style="width:100%;border-collapse:collapse;font-size:11px;">';
      html += '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1);">' +
        '<th style="padding:6px;text-align:left;color:rgba(255,255,255,0.4);">Tool</th>' +
        '<th style="padding:6px;text-align:left;color:rgba(255,255,255,0.4);">Risk</th>' +
        '<th style="padding:6px;text-align:left;color:rgba(255,255,255,0.4);">Status</th>' +
        '<th style="padding:6px;text-align:right;color:rgba(255,255,255,0.4);">Latency</th>' +
        '<th style="padding:6px;text-align:left;color:rgba(255,255,255,0.4);">Result</th></tr></thead><tbody>';
      for (var s = 0; s < steps.length; s++) {
        var st = steps[s];
        html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.03);">';
        html += '<td style="padding:6px;color:rgba(255,255,255,0.7);">' + esc(st.tool_name || '-') + '</td>';
        html += '<td style="padding:6px;">' + statusBadge(st.risk_level) + '</td>';
        html += '<td style="padding:6px;">' + statusBadge(st.status) + '</td>';
        html += '<td style="padding:6px;text-align:right;color:rgba(255,255,255,0.5);">' + (st.latency_ms || 0) + 'ms</td>';
        html += '<td style="padding:6px;color:rgba(255,255,255,0.5);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(truncate(st.result_summary, 60)) + '</td>';
        html += '</tr>';
      }
      html += '</tbody></table></div>';
    }

    // Gates
    if (gates.length > 0) {
      html += '<div style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.7);margin-bottom:8px;">Approval Gates (' + gates.length + ')</div>';
      for (var g = 0; g < gates.length; g++) {
        var gate = gates[g];
        html += '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:8px;margin-bottom:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">';
        html += statusBadge(gate.decision);
        html += '<span style="color:rgba(255,255,255,0.7);font-size:11px;">' + esc(gate.tool_name || '-') + '</span>';
        html += '<span style="color:rgba(255,255,255,0.4);font-size:11px;">' + esc(gate.reason || '') + '</span>';
        if (gate.decided_by) html += '<span style="color:rgba(255,255,255,0.4);font-size:10px;margin-left:auto;">by ' + esc(gate.decided_by) + '</span>';
        html += '</div>';
      }
    }

    // Outcome
    if (outcome.quality_score != null) {
      html += '<div style="margin-top:12px;">';
      html += '<div style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.7);margin-bottom:8px;">Outcome</div>';
      html += '<div style="display:flex;gap:12px;flex-wrap:wrap;">';
      html += '<div style="flex:1;min-width:120px;">' + qualityBar(outcome.quality_score) + '</div>';
      html += '<div>' + statusBadge(outcome.objective_met) + '</div>';
      html += '</div>';
      if (outcome.follow_up_tasks) {
        try {
          var tasks = JSON.parse(outcome.follow_up_tasks);
          if (tasks.length > 0) {
            html += '<div style="margin-top:8px;font-size:11px;color:rgba(255,255,255,0.4);">Follow-up suggestions:</div>';
            for (var f = 0; f < tasks.length; f++) {
              html += '<div style="font-size:11px;color:rgba(255,255,255,0.5);padding:2px 0;">- ' + esc(tasks[f]) + '</div>';
            }
          }
        } catch (e) { /* ignore parse error */ }
      }
      html += '</div>';
    }

    panel.innerHTML = html;
    document.getElementById('rmCloseDetail').addEventListener('click', function () { panel.remove(); });
  }

  function infoCard(label, value, font) {
    var fontStyle = font === 'monospace' ? 'font-family:monospace;font-size:11px;' : 'font-size:14px;';
    return '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:8px;text-align:center;">' +
      '<div style="' + fontStyle + 'font-weight:600;color:white;">' + esc(String(value)) + '</div>' +
      '<div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:2px;">' + esc(label) + '</div></div>';
  }

  // ===================== APPROVAL AUDIT =====================

  function onAuditLoaded(payload) {
    if (!payload) { showEmpty(); return; }
    var gates = payload.gates || [];
    var summary = payload.summary || {};

    if (gates.length === 0) { showEmpty('No approval gates in the last 7 days'); return; }

    var html = '';

    // Summary cards
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:16px;">';
    html += summaryCard(summary.total || 0, 'Total Gates', '#fbbf24');
    html += summaryCard((summary.approval_rate || 0) + '%', 'Approval Rate', '#10b981');
    html += summaryCard(summary.avg_decision_time || '-', 'Avg Decision Time', '#3b82f6');
    html += summaryCard(summary.rejections || 0, 'Rejections', '#ef4444');
    html += '</div>';

    // Gates table
    html += '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:12px;">';
    html += '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1);">';
    html += '<th style="padding:8px 6px;text-align:left;color:rgba(255,255,255,0.5);font-weight:500;">Gate ID</th>';
    html += '<th style="padding:8px 6px;text-align:left;color:rgba(255,255,255,0.5);font-weight:500;">Tool</th>';
    html += '<th style="padding:8px 6px;text-align:left;color:rgba(255,255,255,0.5);font-weight:500;">Risk</th>';
    html += '<th style="padding:8px 6px;text-align:left;color:rgba(255,255,255,0.5);font-weight:500;">Reason</th>';
    html += '<th style="padding:8px 6px;text-align:left;color:rgba(255,255,255,0.5);font-weight:500;">Decision</th>';
    html += '<th style="padding:8px 6px;text-align:left;color:rgba(255,255,255,0.5);font-weight:500;">Decided By</th>';
    html += '<th style="padding:8px 6px;text-align:right;color:rgba(255,255,255,0.5);font-weight:500;">Time</th>';
    html += '</tr></thead><tbody>';

    for (var i = 0; i < gates.length; i++) {
      var g = gates[i];
      html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">';
      html += '<td style="padding:8px 6px;color:rgba(255,255,255,0.6);font-family:monospace;font-size:11px;">' + esc(truncate(g.gate_id, 16)) + '</td>';
      html += '<td style="padding:8px 6px;color:rgba(255,255,255,0.7);">' + esc(g.tool_name || '-') + '</td>';
      html += '<td style="padding:8px 6px;">' + statusBadge(g.risk_level) + '</td>';
      html += '<td style="padding:8px 6px;color:rgba(255,255,255,0.6);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + esc(truncate(g.reason, 50)) + '</td>';
      html += '<td style="padding:8px 6px;">' + statusBadge(g.decision) + '</td>';
      html += '<td style="padding:8px 6px;color:rgba(255,255,255,0.6);">' + esc(g.decided_by || '-') + '</td>';
      html += '<td style="padding:8px 6px;text-align:right;color:rgba(255,255,255,0.5);font-size:11px;">' + relTime(g.decided_at || g.presented_at) + '</td>';
      html += '</tr>';
    }

    html += '</tbody></table></div>';

    var el = document.getElementById('rmContent');
    if (el) el.innerHTML = html;
  }

  function summaryCard(value, label, color) {
    return '<div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:14px;text-align:center;">' +
      '<div style="font-size:22px;font-weight:700;color:' + color + ';">' + esc(String(value)) + '</div>' +
      '<div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:4px;">' + esc(label) + '</div></div>';
  }

  // ===================== QUALITY TRENDS =====================

  function onTrendsLoaded(payload) {
    if (!payload) { showEmpty(); return; }
    var trends = payload.trends || [];
    var costs = payload.costs || {};

    var html = '';

    // Chart canvas
    html += '<div style="position:relative;height:260px;margin-bottom:16px;"><canvas id="rmTrendChart"></canvas></div>';

    // Cost summary
    var byRole = costs.by_role || {};
    var roles = Object.keys(byRole);
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;">';
    html += summaryCard('$' + ((costs.total || 0).toFixed(2)), 'Total Cost (7d)', '#fbbf24');
    for (var r = 0; r < roles.length; r++) {
      var roleColors = { driver: '#3b82f6', recruiter: '#a855f7', admin: '#10b981', carrier: '#f59e0b' };
      html += summaryCard('$' + ((byRole[roles[r]] || 0).toFixed(2)), roles[r] + ' Cost', roleColors[roles[r]] || '#6b7280');
    }
    html += '</div>';

    var el = document.getElementById('rmContent');
    if (el) el.innerHTML = html;

    // Build chart data
    renderTrendChart(trends);
  }

  function renderTrendChart(trends) {
    var canvas = document.getElementById('rmTrendChart');
    if (!canvas || typeof Chart === 'undefined') return;

    // Destroy previous chart
    if (trendChart) { trendChart.destroy(); trendChart = null; }

    // Build datasets by role
    var roleData = {};
    var allDates = [];
    for (var i = 0; i < trends.length; i++) {
      var t = trends[i];
      if (allDates.indexOf(t.date) === -1) allDates.push(t.date);
      if (!roleData[t.role]) roleData[t.role] = {};
      roleData[t.role][t.date] = t.avg_quality;
    }
    allDates.sort();

    var roleColors = {
      driver: { border: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
      recruiter: { border: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
      admin: { border: '#10b981', bg: 'rgba(16,185,129,0.15)' },
      carrier: { border: '#f59e0b', bg: 'rgba(245,158,11,0.15)' }
    };

    var datasets = [];
    var roles = Object.keys(roleData);
    for (var r = 0; r < roles.length; r++) {
      var role = roles[r];
      var data = [];
      for (var d = 0; d < allDates.length; d++) {
        data.push(roleData[role][allDates[d]] || null);
      }
      var colors = roleColors[role] || { border: '#6b7280', bg: 'rgba(107,114,128,0.15)' };
      datasets.push({
        label: role.charAt(0).toUpperCase() + role.slice(1),
        data: data,
        borderColor: colors.border,
        backgroundColor: colors.bg,
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointRadius: 3,
        spanGaps: true
      });
    }

    // Format date labels
    var labels = allDates.map(function (d) {
      var parts = d.split('-');
      return parts[1] + '/' + parts[2];
    });

    trendChart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: { labels: labels, datasets: datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } },
            title: { display: true, text: 'Quality Score', color: 'rgba(255,255,255,0.4)', font: { size: 11 } }
          },
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: 'rgba(255,255,255,0.4)', font: { size: 10 } }
          }
        },
        plugins: {
          legend: {
            labels: { color: 'rgba(255,255,255,0.6)', font: { size: 11 }, usePointStyle: true, pointStyle: 'circle' }
          },
          tooltip: {
            backgroundColor: 'rgba(15,23,42,0.95)',
            titleColor: 'white',
            bodyColor: 'rgba(255,255,255,0.8)',
            borderColor: 'rgba(37,99,235,0.3)',
            borderWidth: 1
          }
        }
      }
    });
  }

  // ===================== EVALUATIONS TAB =====================

  function onEvaluationLoaded(payload) {
    if (!payload || Object.keys(payload).length === 0) { showEmpty('No evaluations available yet'); return; }

    var roles = ['driver', 'recruiter', 'admin', 'carrier'];
    var roleColors = { driver: '#3b82f6', recruiter: '#a855f7', admin: '#10b981', carrier: '#f59e0b' };
    var trendArrows = { improving: '\u2191', declining: '\u2193', stable: '\u2192' };
    var trendColors = { improving: '#10b981', declining: '#ef4444', stable: '#fbbf24' };

    var html = '';

    // Role scorecard cards
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:20px;">';
    for (var i = 0; i < roles.length; i++) {
      var role = roles[i];
      var ev = payload[role];
      var color = roleColors[role] || '#6b7280';

      if (!ev) {
        html += '<div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:16px;border-left:3px solid ' + color + ';">';
        html += '<div style="font-size:13px;font-weight:600;color:' + color + ';text-transform:capitalize;margin-bottom:8px;">' + esc(role) + '</div>';
        html += '<div style="font-size:11px;color:rgba(255,255,255,0.4);">No evaluation data</div></div>';
        continue;
      }

      var trend = ev.trend || 'stable';
      var arrow = trendArrows[trend] || '\u2192';
      var trendColor = trendColors[trend] || '#fbbf24';

      html += '<div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:16px;border-left:3px solid ' + color + ';">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">';
      html += '<div style="font-size:13px;font-weight:600;color:' + color + ';text-transform:capitalize;">' + esc(role) + '</div>';
      html += '<span style="color:' + trendColor + ';font-size:16px;font-weight:700;" title="' + esc(trend) + '">' + arrow + '</span>';
      html += '</div>';

      // Quality score bar
      html += '<div style="margin-bottom:8px;">' + qualityBar(ev.avg_quality_score || 0) + '</div>';

      // Stats row
      html += '<div style="display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,0.5);">';
      html += '<span>Success: ' + (ev.success_rate || 0) + '%</span>';
      html += '<span>Runs: ' + (ev.total_runs || 0) + '</span>';
      html += '<span>$' + ((ev.total_cost || 0).toFixed(2)) + '</span>';
      html += '</div>';

      // Period
      html += '<div style="margin-top:6px;font-size:10px;color:rgba(255,255,255,0.3);">' + esc((ev.period_start || '').substring(0, 10)) + ' \u2014 ' + esc((ev.period_end || '').substring(0, 10)) + '</div>';
      html += '</div>';
    }
    html += '</div>';

    // Regressions table (aggregate across all roles)
    var allRegressions = [];
    for (var r = 0; r < roles.length; r++) {
      var evData = payload[roles[r]];
      if (evData && Array.isArray(evData.tool_regressions)) {
        for (var j = 0; j < evData.tool_regressions.length; j++) {
          var reg = evData.tool_regressions[j];
          if (!allRegressions.find(function (x) { return x.tool === reg.tool; })) {
            allRegressions.push(reg);
          }
        }
      }
    }

    if (allRegressions.length > 0) {
      html += '<div style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.8);margin-bottom:8px;display:flex;align-items:center;gap:6px;">';
      html += '<span class="material-symbols-outlined" style="font-size:16px;color:#ef4444;">warning</span> Tool Regressions</div>';
      html += '<div style="overflow-x:auto;margin-bottom:16px;"><table style="width:100%;border-collapse:collapse;font-size:12px;">';
      html += '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1);">';
      html += '<th style="padding:8px 6px;text-align:left;color:rgba(255,255,255,0.5);font-weight:500;">Tool</th>';
      html += '<th style="padding:8px 6px;text-align:right;color:rgba(255,255,255,0.5);font-weight:500;">Prior Rate</th>';
      html += '<th style="padding:8px 6px;text-align:right;color:rgba(255,255,255,0.5);font-weight:500;">Current Rate</th>';
      html += '<th style="padding:8px 6px;text-align:right;color:rgba(255,255,255,0.5);font-weight:500;">Drop</th>';
      html += '</tr></thead><tbody>';

      for (var k = 0; k < allRegressions.length; k++) {
        var rg = allRegressions[k];
        html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">';
        html += '<td style="padding:8px 6px;color:rgba(255,255,255,0.7);">' + esc(rg.tool || '-') + '</td>';
        html += '<td style="padding:8px 6px;text-align:right;color:rgba(255,255,255,0.6);">' + (rg.prior_rate || 0) + '%</td>';
        html += '<td style="padding:8px 6px;text-align:right;color:rgba(255,255,255,0.6);">' + (rg.current_rate || 0) + '%</td>';
        html += '<td style="padding:8px 6px;text-align:right;color:#ef4444;font-weight:600;">-' + (rg.drop_pct || 0) + '%</td>';
        html += '</tr>';
      }
      html += '</tbody></table></div>';
    }

    // Improvement actions grouped by category
    var allActions = [];
    for (var m = 0; m < roles.length; m++) {
      var evAct = payload[roles[m]];
      if (evAct && Array.isArray(evAct.improvement_actions)) {
        for (var n = 0; n < evAct.improvement_actions.length; n++) {
          allActions.push(evAct.improvement_actions[n]);
        }
      }
    }

    if (allActions.length > 0) {
      var categories = {};
      for (var p = 0; p < allActions.length; p++) {
        var cat = allActions[p].category || 'other';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(allActions[p]);
      }

      var catIcons = { quality: 'star', cost: 'payments', approval: 'gavel', engagement: 'group', regression: 'warning', other: 'info' };
      var catColors = { quality: '#a855f7', cost: '#fbbf24', approval: '#3b82f6', engagement: '#10b981', regression: '#ef4444', other: '#6b7280' };
      var sevColors = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#6b7280' };

      html += '<div style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.8);margin-bottom:8px;display:flex;align-items:center;gap:6px;">';
      html += '<span class="material-symbols-outlined" style="font-size:16px;color:#fbbf24;">lightbulb</span> Improvement Actions</div>';

      var catKeys = Object.keys(categories);
      for (var q = 0; q < catKeys.length; q++) {
        var ck = catKeys[q];
        var items = categories[ck];
        var cIcon = catIcons[ck] || 'info';
        var cColor = catColors[ck] || '#6b7280';

        html += '<div style="margin-bottom:12px;">';
        html += '<div style="display:flex;align-items:center;gap:4px;margin-bottom:6px;">';
        html += '<span class="material-symbols-outlined" style="font-size:14px;color:' + cColor + ';">' + cIcon + '</span>';
        html += '<span style="font-size:12px;font-weight:600;color:' + cColor + ';text-transform:capitalize;">' + esc(ck) + '</span>';
        html += '</div>';

        for (var u = 0; u < items.length; u++) {
          var item = items[u];
          var sColor = sevColors[item.severity] || '#6b7280';
          html += '<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:8px 10px;margin-bottom:4px;display:flex;align-items:start;gap:8px;">';
          html += '<span style="background:' + sColor + '22;color:' + sColor + ';border-radius:9999px;padding:1px 6px;font-size:10px;font-weight:500;white-space:nowrap;margin-top:1px;">' + esc(item.severity || 'info') + '</span>';
          html += '<span style="font-size:12px;color:rgba(255,255,255,0.7);">' + esc(item.action || '') + '</span>';
          html += '</div>';
        }
        html += '</div>';
      }
    }

    if (allRegressions.length === 0 && allActions.length === 0) {
      html += '<div style="text-align:center;padding:20px;color:rgba(255,255,255,0.4);font-size:12px;">No regressions or improvement actions detected.</div>';
    }

    var el = document.getElementById('rmContent');
    if (el) el.innerHTML = html;
  }

})();
