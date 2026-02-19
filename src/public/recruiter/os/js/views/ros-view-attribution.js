// ============================================================================
// ROS-VIEW-ATTRIBUTION — Paid Media Analytics + Async Reports
// ============================================================================

(function() {
  'use strict';

  const VIEW_ID = 'attribution';
  const MESSAGES = [
    'paidMediaInsightsLoaded',
    'paidMediaReportJobCreated',
    'paidMediaReportStatusLoaded',
    'paidMediaReportDownloaded',
    'paidMediaSuggestionsLoaded'
  ];

  let insights = null;
  let suggestions = null;
  let reportJob = null;
  let statusTimer = null;

  function render() {
    return `
      <div class="p-4 md:p-6 space-y-4 h-full overflow-auto">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-lmdr-dark">Paid Media Analytics</h2>
            <p class="text-sm text-lmdr-dark/60 mt-0.5">Campaign performance, breakdowns, and export jobs</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="ROS.views._attribution.refresh()"
              class="px-3 py-2 rounded-xl border border-beige-d text-xs font-semibold text-lmdr-dark hover:bg-beige">
              Refresh
            </button>
            <button onclick="ROS.views._attribution.createReportJob()"
              class="px-3 py-2 rounded-xl bg-gradient-to-r from-lmdr-blue to-lmdr-deep text-white text-xs font-semibold">
              Export Report
            </button>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="neu-s rounded-xl p-4">
            <div class="text-[10px] uppercase tracking-wide text-tan font-semibold">Spend</div>
            <div id="attr-spend" class="text-2xl font-black text-lmdr-dark mt-1">$0</div>
          </div>
          <div class="neu-s rounded-xl p-4">
            <div class="text-[10px] uppercase tracking-wide text-tan font-semibold">Reach</div>
            <div id="attr-reach" class="text-2xl font-black text-lmdr-dark mt-1">0</div>
          </div>
          <div class="neu-s rounded-xl p-4">
            <div class="text-[10px] uppercase tracking-wide text-tan font-semibold">Results</div>
            <div id="attr-results" class="text-2xl font-black text-sg mt-1">0</div>
          </div>
          <div class="neu-s rounded-xl p-4">
            <div class="text-[10px] uppercase tracking-wide text-tan font-semibold">CPL</div>
            <div id="attr-cpl" class="text-2xl font-black text-lmdr-blue mt-1">$0</div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="neu-s rounded-xl p-4">
            <div class="text-[10px] uppercase tracking-wide text-tan font-semibold">CPL to Hire</div>
            <div id="attr-cpl-hire" class="text-2xl font-black text-lmdr-dark mt-1">$0</div>
            <div id="attr-cpl-hire-meta" class="text-[11px] text-tan mt-1">No trend data yet</div>
          </div>
          <div class="neu-s rounded-xl p-4">
            <div class="text-[10px] uppercase tracking-wide text-tan font-semibold">Best Source Quality</div>
            <div id="attr-best-source" class="text-sm font-black text-sg mt-1">-</div>
            <div id="attr-best-source-meta" class="text-[11px] text-tan mt-1">No source-quality data yet</div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="neu rounded-2xl p-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold text-lmdr-dark">Placement Breakdown</h3>
              <span class="text-[10px] text-tan">Latest period</span>
            </div>
            <div id="attr-breakdown-list" class="space-y-2">
              <div class="text-xs text-tan py-6 text-center">Loading breakdown...</div>
            </div>
          </div>

          <div class="neu rounded-2xl p-4">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-bold text-lmdr-dark">Optimization Suggestions</h3>
              <span class="text-[10px] text-tan">Rule-driven</span>
            </div>
            <div id="attr-suggestions-list" class="space-y-2">
              <div class="text-xs text-tan py-6 text-center">Loading suggestions...</div>
            </div>
          </div>
        </div>

        <div class="neu rounded-2xl p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-lmdr-dark">Campaign Performance</h3>
            <span id="attr-campaign-count" class="text-[10px] text-tan">0 campaigns</span>
          </div>
          <div id="attr-campaign-table" class="space-y-2">
            <div class="text-xs text-tan py-6 text-center">Loading campaigns...</div>
          </div>
        </div>

        <div class="neu rounded-2xl p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-lmdr-dark">Source Quality</h3>
            <span class="text-[10px] text-tan">Paid Media -> Pipeline</span>
          </div>
          <div id="attr-source-quality-list" class="space-y-2">
            <div class="text-xs text-tan py-6 text-center">Loading source quality...</div>
          </div>
        </div>

        <div class="neu rounded-2xl p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-lmdr-dark">Async Report Job</h3>
            <span id="attr-report-status" class="text-[10px] px-2 py-1 rounded-full bg-slate-200 text-slate-600">idle</span>
          </div>
          <div id="attr-report-meta" class="text-xs text-tan mb-3">No report job created yet.</div>
          <div class="flex items-center gap-2">
            <button onclick="ROS.views._attribution.checkReportStatus()"
              class="px-3 py-2 rounded-xl border border-beige-d text-xs font-semibold text-lmdr-dark hover:bg-beige">
              Check Status
            </button>
            <button onclick="ROS.views._attribution.downloadReport()"
              class="px-3 py-2 rounded-xl bg-lmdr-blue/10 text-lmdr-blue text-xs font-semibold hover:bg-lmdr-blue/20">
              Download
            </button>
          </div>
        </div>
      </div>`;
  }

  function onMount() {
    ROS.views._attribution.refresh();
  }

  function onUnmount() {
    if (statusTimer) {
      clearInterval(statusTimer);
      statusTimer = null;
    }
    insights = null;
    suggestions = null;
    reportJob = null;
  }

  function onMessage(type, data) {
    if (type === 'paidMediaInsightsLoaded') {
      insights = data || null;
      renderInsights();
      return;
    }
    if (type === 'paidMediaSuggestionsLoaded') {
      suggestions = data || null;
      renderSuggestions();
      return;
    }
    if (type === 'paidMediaReportJobCreated') {
      if (data && data.success) {
        reportJob = data.job || null;
        setReportStatus('queued');
        setReportMeta(`Job ${reportJob.job_id || reportJob.jobId || 'created'} queued`);
        startPolling();
      } else {
        setReportStatus('error');
        setReportMeta(`Failed to create report job: ${data?.error || 'Unknown error'}`);
      }
      return;
    }
    if (type === 'paidMediaReportStatusLoaded') {
      if (!data || !data.success) {
        setReportStatus('error');
        setReportMeta(`Report status error: ${data?.error || 'Unknown error'}`);
        return;
      }
      const job = data.job || {};
      reportJob = { ...reportJob, ...job };
      setReportStatus(job.status || 'queued');
      setReportMeta(`Rows: ${job.rowCount || 0} · Requested: ${job.requestedAt || '-'}`);
      if (job.status === 'completed' && statusTimer) {
        clearInterval(statusTimer);
        statusTimer = null;
      }
      return;
    }
    if (type === 'paidMediaReportDownloaded') {
      if (!data || !data.success) {
        setReportMeta(`Download failed: ${data?.error || 'Unknown error'}`);
        return;
      }
      setReportMeta(`Downloaded ${data.rowCount || 0} rows (${data.format || 'json'})`);
    }
  }

  function renderInsights() {
    const totals = insights?.campaign?.totals || {};
    const cplTrend = insights?.pipeline?.cplTrend || {};
    const bestSource = insights?.pipeline?.sourceQuality?.bestSource || null;
    setText('attr-spend', `$${formatNumber(totals.spend || 0)}`);
    setText('attr-reach', formatNumber(totals.reach || 0));
    setText('attr-results', formatNumber(totals.results || 0));
    setText('attr-cpl', `$${formatNumber(totals.cpl || 0)}`);
    setText('attr-cpl-hire', `$${formatNumber(cplTrend?.summary?.cph || 0)}`);
    setText(
      'attr-cpl-hire-meta',
      `CPL $${formatNumber(cplTrend?.summary?.cpl || 0)} · Hires ${formatNumber(cplTrend?.summary?.hires || 0)}`
    );
    setText('attr-best-source', bestSource?.source || '-');
    setText(
      'attr-best-source-meta',
      bestSource ? `Quality ${formatNumber(bestSource.qualityScore)} · CPL $${formatNumber(bestSource.cpl || 0)}` : 'No source-quality data yet'
    );

    const breakdown = insights?.breakdown?.breakdown || [];
    const breakdownList = document.getElementById('attr-breakdown-list');
    if (breakdownList) {
      breakdownList.innerHTML = breakdown.length ? breakdown.map(item => `
        <div class="flex items-center justify-between p-2 rounded-lg bg-white/70">
          <div class="text-xs font-semibold text-lmdr-dark">${escapeHtml(item.key || 'unknown')}</div>
          <div class="text-right text-[11px] text-tan">
            <div>$${formatNumber(item.spend || 0)} spend</div>
            <div>${formatNumber(item.results || 0)} results · CPL $${formatNumber(item.cpl || 0)}</div>
          </div>
        </div>
      `).join('') : '<div class="text-xs text-tan py-4 text-center">No placement data</div>';
    }

    const rows = insights?.campaign?.rows || [];
    setText('attr-campaign-count', `${rows.length} campaigns`);
    const table = document.getElementById('attr-campaign-table');
    if (table) {
      table.innerHTML = rows.length ? rows.slice(0, 10).map(row => {
        const parsed = normalizeRow(row);
        return `
          <div class="grid grid-cols-4 gap-2 p-2 rounded-lg bg-white/70 text-[11px]">
            <div class="font-semibold text-lmdr-dark truncate">${escapeHtml(row.entity_id || row.campaign_id || 'campaign')}</div>
            <div class="text-tan">$${formatNumber(parsed.spend)}</div>
            <div class="text-tan">${formatNumber(parsed.results)} results</div>
            <div class="text-lmdr-blue">CPL $${formatNumber(parsed.cpl)}</div>
          </div>`;
      }).join('') : '<div class="text-xs text-tan py-4 text-center">No campaign insight rows</div>';
    }

    const sourceQualityItems = insights?.pipeline?.sourceQuality?.items || [];
    const sourceQualityList = document.getElementById('attr-source-quality-list');
    if (sourceQualityList) {
      sourceQualityList.innerHTML = sourceQualityItems.length ? sourceQualityItems.slice(0, 5).map(item => `
        <div class="grid grid-cols-4 gap-2 p-2 rounded-lg bg-white/70 text-[11px]">
          <div class="font-semibold text-lmdr-dark truncate">${escapeHtml(item.source || 'unknown')}</div>
          <div class="text-tan">Q ${formatNumber(item.qualityScore || 0)}</div>
          <div class="text-tan">CPL $${formatNumber(item.cpl || 0)}</div>
          <div class="text-sg">Hires ${formatNumber(item.hires || 0)}</div>
        </div>
      `).join('') : '<div class="text-xs text-tan py-4 text-center">No source-quality rows</div>';
    }
  }

  function renderSuggestions() {
    const list = document.getElementById('attr-suggestions-list');
    if (!list) return;

    const budget = suggestions?.budget?.suggestions || [];
    const creative = suggestions?.creative?.suggestions || [];
    const audience = suggestions?.audience?.suggestions || [];
    const fatigue = suggestions?.fatigue?.alerts || [];

    const items = [
      ...budget.map(s => `Budget ${s.recommendation} ${s.budgetDeltaPct}% for ${s.campaignId}`),
      ...creative.map(s => `Rotate creative ${s.creativeId} (${s.rationale})`),
      ...audience.filter(s => s.recommendation !== 'keep').map(s => `Narrow ${s.placement} audience`),
      ...fatigue.slice(0, 3).map(s => `Fatigue alert: ${s.campaignId} frequency ${s.frequency}`)
    ];

    list.innerHTML = items.length ? items.map(item => `
      <div class="text-xs p-2 rounded-lg bg-white/70 text-lmdr-dark">${escapeHtml(item)}</div>
    `).join('') : '<div class="text-xs text-tan py-4 text-center">No suggestions right now</div>';
  }

  function startPolling() {
    if (statusTimer) clearInterval(statusTimer);
    statusTimer = setInterval(() => {
      ROS.views._attribution.checkReportStatus();
    }, 10000);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setReportStatus(status) {
    const badge = document.getElementById('attr-report-status');
    if (!badge) return;
    badge.textContent = status || 'unknown';
    badge.className = 'text-[10px] px-2 py-1 rounded-full';
    if (status === 'completed') badge.classList.add('bg-emerald-100', 'text-emerald-700');
    else if (status === 'queued' || status === 'processing') badge.classList.add('bg-amber-100', 'text-amber-700');
    else if (status === 'error') badge.classList.add('bg-rose-100', 'text-rose-700');
    else badge.classList.add('bg-slate-200', 'text-slate-600');
  }

  function setReportMeta(message) {
    const el = document.getElementById('attr-report-meta');
    if (el) el.textContent = message;
  }

  function formatNumber(value) {
    const n = Number(value || 0);
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    if (!Number.isFinite(n)) return '0';
    return n.toFixed(n < 100 ? 2 : 0);
  }

  function normalizeRow(row) {
    const spend = Number(row.spend || 0);
    const results = Number(row.results || row.conversions || 0);
    const cpl = results > 0 ? spend / results : Number(row.cpl || 0);
    return { spend, results, cpl };
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  ROS.views._attribution = {
    refresh: function() {
      ROS.bridge.sendToVelo('getPaidMediaInsights', { dateRange: {} });
      ROS.bridge.sendToVelo('getPaidMediaOptimizationSuggestions', { dateRange: {} });
    },
    createReportJob: function() {
      ROS.bridge.sendToVelo('createPaidMediaReportJob', {
        reportScope: 'campaign',
        format: 'json',
        dateRange: {}
      });
    },
    checkReportStatus: function() {
      const jobId = reportJob?.job_id || reportJob?.jobId || '';
      if (!jobId) {
        setReportMeta('No report job ID available yet.');
        return;
      }
      ROS.bridge.sendToVelo('getPaidMediaReportStatus', { jobId });
    },
    downloadReport: function() {
      const jobId = reportJob?.job_id || reportJob?.jobId || '';
      if (!jobId) {
        setReportMeta('No report job ID available yet.');
        return;
      }
      ROS.bridge.sendToVelo('downloadPaidMediaReport', { jobId });
    }
  };

  ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
