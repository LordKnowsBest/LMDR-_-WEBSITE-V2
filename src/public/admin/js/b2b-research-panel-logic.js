/* =========================================
   B2B Research Panel — Logic Module
   Depends on: ResearchBridge
   ========================================= */
var ResearchLogic = (function () {
  'use strict';

  var currentAccountId = null;

  function init() {
    ResearchBridge.listen({
      init: function (d) {
        if (d.accountId) {
          currentAccountId = d.accountId;
          generateBrief(false);
        }
      },
      briefGenerating: function () { showLoading(); },
      briefLoaded: function (d) { renderBrief(d.payload); },
      actionError: function (d) { hideLoading(); showToast(d.message || 'Error', 'error'); }
    });
  }

  function generateBrief(forceRefresh) {
    if (!currentAccountId) { showToast('No account selected', 'error'); return; }
    showLoading();
    ResearchBridge.sendToVelo({ action: 'generateBrief', accountId: currentAccountId, forceRefresh: !!forceRefresh });
  }

  function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('briefContent').classList.add('hidden');
    document.getElementById('refreshBtn').disabled = true;
    setText('refreshBtnText', 'Generating...');
  }

  function hideLoading() {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('refreshBtn').disabled = false;
    setText('refreshBtnText', 'Refresh Brief');
  }

  function copyTalkTrack() {
    var el = document.getElementById('talkTrack');
    if (!el) return;
    var text = el.textContent || '';
    if (!text || text === '\u2014' || text === 'No talk track generated') { showToast('No talk track to copy', 'error'); return; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        setText('copyBtnText', 'Copied!');
        showToast('Talk track copied', 'success');
        setTimeout(function () { setText('copyBtnText', 'Copy'); }, 2000);
      }).catch(function () { fallbackCopy(text); });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setText('copyBtnText', 'Copied!');
      showToast('Talk track copied', 'success');
      setTimeout(function () { setText('copyBtnText', 'Copy'); }, 2000);
    } catch (e) { showToast('Copy failed - select text manually', 'error'); }
  }

  function renderBrief(data) {
    hideLoading();
    if (!data || !data.brief) {
      document.getElementById('emptyState').classList.remove('hidden');
      return;
    }

    var brief = data.brief;
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('briefContent').classList.remove('hidden');

    setText('briefTitle', 'Research: ' + (brief.carrier_name || 'Unknown'));
    var genDate = brief.generated_at ? new Date(brief.generated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown';
    setText('briefMeta', 'Generated: ' + genDate + (brief.carrier_dot ? ' \u00b7 DOT ' + brief.carrier_dot : ''));

    var cacheEl = document.getElementById('cacheIndicator');
    cacheEl.classList.toggle('hidden', !data.cached);

    var confBadge = document.getElementById('confidenceBadge');
    var confidence = brief.confidence || 'medium';
    var confStyles = { high: 'bg-emerald-900/60 text-emerald-300', medium: 'bg-amber-900/60 text-amber-300', low: 'bg-red-900/60 text-red-300' };
    var confIcons = { high: 'verified', medium: 'info', low: 'warning' };
    var confLabels = { high: 'High Confidence', medium: 'Medium Confidence', low: 'Low Confidence' };
    confBadge.className = 'text-xs px-2 py-1 rounded-full font-medium ' + (confStyles[confidence] || confStyles.medium);
    document.getElementById('confidenceIcon').textContent = confIcons[confidence] || 'info';
    setText('confidenceText', confLabels[confidence] || 'Medium Confidence');

    var genBadge = document.getElementById('generatedByBadge');
    var genBy = brief.generated_by || 'research_agent';
    if (genBy === 'llm_claude') {
      genBadge.className = 'text-xs px-2 py-1 rounded-full font-medium bg-blue-900/60 text-blue-300';
      document.getElementById('generatedByIcon').textContent = 'smart_toy';
      setText('generatedByText', 'AI-Powered');
    } else if (genBy === 'template_fallback') {
      genBadge.className = 'text-xs px-2 py-1 rounded-full font-medium bg-slate-800 text-slate-400';
      document.getElementById('generatedByIcon').textContent = 'code';
      setText('generatedByText', 'Template');
    } else {
      genBadge.className = 'text-xs px-2 py-1 rounded-full font-medium bg-slate-800 text-slate-400';
      document.getElementById('generatedByIcon').textContent = 'auto_awesome';
      setText('generatedByText', 'Agent');
    }

    var sig = typeof brief.signals === 'object' ? brief.signals : {};
    setText('sigScore', sig.match_score || '\u2014');
    setText('sigDrivers', sig.driver_count || '\u2014');
    setText('sigFleet', sig.fleet_size || '\u2014');
    setText('sigSafety', sig.safety_rating || '\u2014');

    var highlights = Array.isArray(brief.highlights) ? brief.highlights : [];
    var hlList = document.getElementById('highlightsList');
    if (highlights.length > 0) {
      hlList.innerHTML = highlights.map(function (h) {
        return '<li class="flex items-start gap-2"><span class="material-symbols-outlined text-[16px] text-amber-400 mt-0.5 flex-shrink-0">star</span><span class="text-sm text-slate-200">' + esc(h) + '</span></li>';
      }).join('');
    } else {
      hlList.innerHTML = '<li class="text-sm text-slate-500">No highlights available</li>';
    }

    setText('talkTrack', brief.talk_track || 'No talk track generated');
    setText('copyBtnText', 'Copy');

    var steps = Array.isArray(brief.next_steps) ? brief.next_steps : [];
    var nsList = document.getElementById('nextStepsList');
    if (steps.length > 0) {
      var typeIcons = { call: 'call', email: 'mail', proposal: 'description', sequence: 'autorenew', research: 'search', admin: 'settings' };
      var typeColors = { call: 'text-emerald-400', email: 'text-blue-400', proposal: 'text-purple-400', sequence: 'text-cyan-400', research: 'text-amber-400', admin: 'text-slate-400' };
      nsList.innerHTML = steps.map(function (s, i) {
        var stepText = esc(s.text || s);
        var typeHtml = s.type ? '<span class="inline-flex items-center gap-1 mt-1 text-xs ' + (typeColors[s.type] || 'text-slate-400') + '"><span class="material-symbols-outlined text-[14px]">' + (typeIcons[s.type] || 'circle') + '</span>' + esc(s.type) + '</span>' : '';
        return '<div class="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-800/50"><span class="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">' + (i + 1) + '</span><div class="flex-1"><p class="text-sm text-slate-200">' + stepText + '</p>' + typeHtml + '</div></div>';
      }).join('');
    } else {
      nsList.innerHTML = '<p class="text-sm text-slate-500">No recommendations</p>';
    }

    var sources = Array.isArray(brief.sources) ? brief.sources : [];
    var srcList = document.getElementById('sourcesList');
    var srcCountBadge = document.getElementById('sourceCountBadge');
    if (sources.length > 0) {
      srcList.innerHTML = sources.map(function (s) { return '<span class="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-400">' + esc(s) + '</span>'; }).join('');
      srcCountBadge.textContent = sources.length;
      srcCountBadge.classList.remove('hidden');
    } else {
      srcList.innerHTML = '<span class="text-xs text-slate-500">No sources</span>';
      srcCountBadge.classList.add('hidden');
    }
  }

  function setText(id, t) { var el = document.getElementById(id); if (el) el.textContent = t; }
  function esc(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
  function showToast(m, t) {
    t = t || 'info';
    var c = document.getElementById('toastContainer');
    var cl = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-blue-600' };
    var el = document.createElement('div');
    el.className = 'toast ' + (cl[t] || cl.info) + ' text-white text-sm px-4 py-3 rounded-lg shadow-lg';
    el.textContent = m;
    c.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(function () { el.remove(); }, 300); }, 3000);
  }

  function exposeGlobals() {
    window.generateBrief = generateBrief;
    window.copyTalkTrack = copyTalkTrack;
  }

  return {
    init: init,
    exposeGlobals: exposeGlobals
  };
})();
