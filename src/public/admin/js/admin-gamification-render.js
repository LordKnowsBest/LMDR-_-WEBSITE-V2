/* =========================================
   ADMIN GAMIFICATION ANALYTICS — Render Module
   Depends on: GamificationConfig
   DOM rendering functions
   ========================================= */
var GamificationRender = (function () {
  'use strict';

  var fmt = GamificationConfig.formatNumber;

  function updateDashboard(data) {
    if (!data || !data.success) {
      console.error('Failed to load metrics:', data && data.error);
      return;
    }

    var metrics = data.metrics;
    document.getElementById('lastUpdated').textContent = new Date(data.timestamp).toLocaleString();

    if (metrics.economy) renderEconomy(metrics.economy);
    if (metrics.achievements) renderAchievements(metrics.achievements);
    if (metrics.challenges) renderChallenges(metrics.challenges);
    if (metrics.engagement) renderEngagement(metrics.engagement);
    if (metrics.events) renderEvents(metrics.events);
  }

  function renderEconomy(economy) {
    var drivers = economy.drivers || {};
    var recruiters = economy.recruiters || {};
    var health = economy.healthIndicators || {};

    document.getElementById('totalDrivers').textContent = fmt(drivers.totalUsers || 0);
    document.getElementById('totalXP').textContent = fmt(drivers.totalXPInCirculation || 0);
    document.getElementById('avgXP').textContent = fmt(drivers.averageXP || 0);
    document.getElementById('dailyXPRate').textContent = '+' + fmt(drivers.dailyXPEarnRate || 0) + '/day';

    document.getElementById('totalRecruiters').textContent = fmt(recruiters.totalUsers || 0);
    document.getElementById('totalPoints').textContent = fmt(recruiters.totalPointsInCirculation || 0);
    document.getElementById('avgPoints').textContent = fmt(recruiters.averagePoints || 0);
    document.getElementById('dailyPointsRate').textContent = '+' + fmt(recruiters.dailyPointsEarnRate || 0) + '/day';

    document.getElementById('levelHealth').innerHTML = GamificationConfig.getHealthBadge(health.levelProgressionHealth);
    document.getElementById('rankHealth').innerHTML = GamificationConfig.getHealthBadge(health.rankProgressionHealth);
  }

  function renderAchievements(ach) {
    var drivers = ach.drivers || {};
    var recruiters = ach.recruiters || {};

    document.getElementById('driverAchievements').textContent = fmt(drivers.totalUnlocks || 0);
    document.getElementById('driverAchievementRate').textContent = drivers.averagePerUser || 0;
    document.getElementById('recruiterBadges').textContent = fmt(recruiters.totalUnlocks || 0);
    document.getElementById('recruiterBadgeRate').textContent = recruiters.averagePerUser || 0;

    var topList = (drivers.unlockRates || []).slice(0, 5);
    var html = '';
    for (var i = 0; i < topList.length; i++) {
      html +=
        '<div class="flex justify-between items-center text-sm">' +
          '<span class="text-slate-700">' + topList[i].achievementId + '</span>' +
          '<span class="text-slate-500">' + topList[i].unlockRate + '%</span>' +
        '</div>';
    }
    document.getElementById('topAchievements').innerHTML = html || '<div class="text-slate-400 text-sm">No data</div>';
  }

  function renderChallenges(ch) {
    var drivers = ch.drivers || {};
    var recruiters = ch.recruiters || {};

    document.getElementById('driverChallengeRate').textContent = (drivers.completionRate || 0) + '%';
    document.getElementById('driverChallengesCompleted').textContent = fmt(drivers.completed || 0);
    document.getElementById('recruiterChallengeRate').textContent = (recruiters.completionRate || 0) + '%';
    document.getElementById('recruiterChallengesCompleted').textContent = fmt(recruiters.completed || 0);

    var byType = drivers.byType || [];
    var html = '';
    for (var i = 0; i < byType.length; i++) {
      html +=
        '<div class="flex justify-between items-center text-sm">' +
          '<span class="text-slate-700">' + byType[i].type + '</span>' +
          '<span class="text-slate-500">' + byType[i].completionRate + '% (' + byType[i].completed + '/' + byType[i].total + ')</span>' +
        '</div>';
    }
    document.getElementById('challengesByType').innerHTML = html || '<div class="text-slate-400 text-sm">No data</div>';
  }

  function renderEngagement(eng) {
    var activeUsers = eng.activeUsers || {};
    var referrals = eng.referrals || {};
    var matchQuality = eng.matchQuality || {};
    var byTier = matchQuality.byTier || {};

    document.getElementById('dailyActive').textContent = fmt(activeUsers.daily || 0);
    document.getElementById('weeklyActive').textContent = fmt(activeUsers.weekly || 0);
    document.getElementById('monthlyActive').textContent = fmt(activeUsers.monthly || 0);
    document.getElementById('stickiness').textContent = (activeUsers.stickinessRatio || 0) + '%';

    document.getElementById('totalReferrals').textContent = fmt(referrals.total || 0);
    document.getElementById('successfulReferrals').textContent = fmt(referrals.successful || 0);
    document.getElementById('referralConversion').textContent = (referrals.conversionRate || 0) + '%';

    document.getElementById('totalBonuses').textContent = fmt(matchQuality.totalBonuses || 0);
    document.getElementById('excellentBonuses').textContent = fmt(byTier.excellent || 0);
    document.getElementById('greatBonuses').textContent = fmt(byTier.great || 0);
    document.getElementById('goodBonuses').textContent = fmt(byTier.good || 0);
  }

  function renderEvents(ev) {
    var summary = ev.summary || {};
    var events = ev.events || [];

    document.getElementById('totalEvents').textContent = summary.totalEvents || 0;
    document.getElementById('activeEvents').textContent = summary.activeEvents || 0;
    document.getElementById('completedEvents').textContent = summary.completedEvents || 0;
    document.getElementById('totalParticipants').textContent = fmt(summary.totalParticipants || 0);

    var html = '';
    for (var i = 0; i < events.length; i++) {
      var e = events[i];
      html +=
        '<tr class="border-b border-slate-100">' +
          '<td class="px-4 py-3 font-medium">' + e.name + '</td>' +
          '<td class="px-4 py-3">' + GamificationConfig.getStatusBadge(e.status) + '</td>' +
          '<td class="px-4 py-3 text-right">' + fmt(e.participants) + '</td>' +
          '<td class="px-4 py-3 text-right">' + fmt(e.totalXPEarned) + '</td>' +
          '<td class="px-4 py-3 text-right">' + fmt(e.avgXPPerUser) + '</td>' +
        '</tr>';
    }
    document.getElementById('eventsTableBody').innerHTML = html ||
      '<tr><td colspan="5" class="px-4 py-8 text-center text-slate-400">No events</td></tr>';
  }

  function displayAbuseReport(data) {
    var container = document.getElementById('abuseContent');
    if (!data || !data.success) {
      container.innerHTML =
        '<div class="text-center text-red-500 py-8">' +
          '<i class="fa-solid fa-exclamation-triangle text-2xl mb-2"></i>' +
          '<p>Failed to run analysis: ' + ((data && data.error) || 'Unknown error') + '</p>' +
        '</div>';
      return;
    }

    var summary = data.summary;
    var suspiciousUsers = data.suspiciousUsers;

    var html =
      '<div class="mb-4">' +
        '<div class="text-sm text-slate-500 mb-2">Analysis Period: ' + data.period + ' | Users Analyzed: ' + data.totalUsersAnalyzed + '</div>' +
        '<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">' +
          '<div class="bg-red-50 rounded-lg p-3"><div class="text-2xl font-bold text-red-600">' + summary.highRisk + '</div><div class="text-xs text-red-500">High Risk</div></div>' +
          '<div class="bg-yellow-50 rounded-lg p-3"><div class="text-2xl font-bold text-yellow-600">' + summary.mediumRisk + '</div><div class="text-xs text-yellow-500">Medium Risk</div></div>' +
          '<div class="bg-green-50 rounded-lg p-3"><div class="text-2xl font-bold text-green-600">' + summary.lowRisk + '</div><div class="text-xs text-green-500">Low Risk</div></div>' +
        '</div>' +
      '</div>';

    if (suspiciousUsers.length === 0) {
      html += '<div class="text-center text-green-600 py-4"><i class="fa-solid fa-check-circle mr-2"></i>No suspicious activity detected</div>';
    } else {
      html += '<div class="text-sm font-medium text-slate-700 mb-2">Suspicious Users</div><div class="space-y-3">';
      for (var i = 0; i < suspiciousUsers.length; i++) {
        var user = suspiciousUsers[i];
        var rc = user.riskLevel === 'high' ? 'red' : user.riskLevel === 'medium' ? 'yellow' : 'green';
        var flagsHtml = '';
        for (var j = 0; j < user.flags.length; j++) {
          var f = user.flags[j];
          flagsHtml += '<span class="inline-block bg-white px-2 py-0.5 rounded mr-1 mb-1">' + f.type + ': ' + f.value + ' (threshold: ' + f.threshold + ')</span>';
        }
        html +=
          '<div class="border border-' + rc + '-200 bg-' + rc + '-50 rounded-lg p-3">' +
            '<div class="flex justify-between items-start mb-2">' +
              '<span class="font-mono text-xs">' + user.userId + '</span>' +
              '<span class="px-2 py-0.5 rounded text-xs font-medium bg-' + rc + '-100 text-' + rc + '-700">' + user.riskLevel.toUpperCase() + '</span>' +
            '</div>' +
            '<div class="text-xs text-slate-600 mb-2">' + user.eventCount + ' events | ' + user.totalXP + ' XP | ' + user.totalPoints + ' points</div>' +
            '<div class="text-xs">' + flagsHtml + '</div>' +
          '</div>';
      }
      html += '</div>';
    }

    container.innerHTML = html;
  }

  return {
    updateDashboard: updateDashboard,
    displayAbuseReport: displayAbuseReport
  };
})();
