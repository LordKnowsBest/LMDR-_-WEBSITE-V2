/* =========================================
   ADMIN MATCHES — Logic Module
   Depends on: AdminMatchesConfig, AdminMatchesBridge, AdminMatchesRender
   Business logic, state, event handlers
   ========================================= */
var AdminMatchesLogic = (function () {
  'use strict';

  var currentTab = 'matches';
  var matchPage = 1;
  var interestPage = 1;
  var trendsChartRef = { instance: null };
  var currentStats = null;

  function init() {
    initTheme();
    setupEventListeners();
    setupBridgeListeners();
  }

  function setupBridgeListeners() {
    AdminMatchesBridge.listen({
      init: function () { loadInitialData(); },
      matchesLoaded: function (payload) { AdminMatchesRender.renderMatches(payload); },
      matchDetailLoaded: function (payload) { AdminMatchesRender.renderMatchDetail(payload); },
      interestsLoaded: function (payload) { AdminMatchesRender.renderInterests(payload); },
      statsLoaded: function (payload) { currentStats = AdminMatchesRender.renderStats(payload); },
      trendsLoaded: function (payload) { AdminMatchesRender.renderTrendsChart(payload, trendsChartRef); },
      topMatchesLoaded: function (payload) { AdminMatchesRender.renderTopMatches(payload); },
      actionListLoaded: function (payload) { AdminMatchesRender.populateActionFilter(payload); },
      exportReady: function (payload) { AdminMatchesRender.downloadCSV(payload, 'matches_export.csv'); },
      actionError: function (payload, message) { AdminMatchesRender.showToast(message, 'error'); }
    });
  }

  function setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { switchTab(btn.dataset.tab); });
    });

    document.getElementById('refreshBtn').addEventListener('click', loadInitialData);

    document.getElementById('filterMatchesBtn').addEventListener('click', function () {
      matchPage = 1;
      loadMatches();
    });

    document.getElementById('filterInterestsBtn').addEventListener('click', function () {
      interestPage = 1;
      loadInterests();
    });

    document.getElementById('matchPrevBtn').addEventListener('click', function () {
      if (matchPage > 1) { matchPage--; loadMatches(); }
    });
    document.getElementById('matchNextBtn').addEventListener('click', function () {
      matchPage++; loadMatches();
    });
    document.getElementById('interestPrevBtn').addEventListener('click', function () {
      if (interestPage > 1) { interestPage--; loadInterests(); }
    });
    document.getElementById('interestNextBtn').addEventListener('click', function () {
      interestPage++; loadInterests();
    });

    document.querySelectorAll('.trend-period-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.trend-period-btn').forEach(function (b) {
          b.classList.remove('bg-blue-100', 'text-blue-700');
          b.classList.add('bg-gray-100', 'text-gray-600');
        });
        btn.classList.remove('bg-gray-100', 'text-gray-600');
        btn.classList.add('bg-blue-100', 'text-blue-700');
        loadTrends(btn.dataset.period);
      });
    });

    document.getElementById('exportBtn').addEventListener('click', exportMatches);
    document.getElementById('backdrop').addEventListener('click', closeDetailSheet);
    document.getElementById('closeDetailBtn').addEventListener('click', closeDetailSheet);
  }

  function loadInitialData() {
    AdminMatchesBridge.getStats();
    AdminMatchesBridge.getActionList();
    loadMatches();
    loadInterests();
    loadTrends('week');
    AdminMatchesBridge.getTopMatches(10);
  }

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    document.querySelectorAll('.tab-content').forEach(function (content) {
      content.classList.add('hidden');
    });
    document.getElementById(tab + 'Tab').classList.remove('hidden');
  }

  function loadMatches() {
    var filters = {
      carrierName: document.getElementById('matchSearch').value,
      minScore: document.getElementById('matchMinScore').value,
      action: document.getElementById('matchAction').value
    };
    AdminMatchesBridge.getMatches(filters, matchPage, 50);
  }

  function loadInterests() {
    var filters = {
      status: document.getElementById('interestStatus').value,
      dateFrom: document.getElementById('interestDateFrom').value,
      dateTo: document.getElementById('interestDateTo').value
    };
    AdminMatchesBridge.getInterests(filters, interestPage, 50);
  }

  function loadTrends(period) {
    AdminMatchesBridge.getTrends(period);
  }

  function openMatchDetail(matchId) {
    AdminMatchesBridge.getMatchDetail(matchId);
    document.getElementById('backdrop').classList.add('open');
    document.getElementById('matchDetailSheet').classList.add('open');
  }

  function closeDetailSheet() {
    document.getElementById('backdrop').classList.remove('open');
    document.getElementById('matchDetailSheet').classList.remove('open');
  }

  function exportMatches() {
    var filters = {
      minScore: document.getElementById('matchMinScore').value
    };
    AdminMatchesBridge.exportMatches(filters);
  }

  // Theme management
  function initTheme() {
    var saved = localStorage.getItem(AdminMatchesConfig.THEME_KEY);
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(theme);
  }

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    updateThemeIcon(theme);
  }

  function toggleTheme() {
    var current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    var newTheme = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(AdminMatchesConfig.THEME_KEY, newTheme);
    applyTheme(newTheme);
  }

  function updateThemeIcon(theme) {
    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.innerHTML = theme === 'dark' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    }
  }

  // Expose globals for onclick handlers in HTML
  function exposeGlobals() {
    window.toggleTheme = toggleTheme;
  }

  return {
    init: init,
    openMatchDetail: openMatchDetail,
    toggleTheme: toggleTheme,
    exposeGlobals: exposeGlobals
  };
})();
