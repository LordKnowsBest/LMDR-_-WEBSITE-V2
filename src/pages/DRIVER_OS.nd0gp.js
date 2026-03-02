// ============================================================================
// DRIVER OS — Page Code
// Single iframe bridge for the unified DriverOS mobile shell.
//
// All backend calls go through driverOSFacade.jsw to prevent the Wix bundler
// from choking on 40+ direct imports (which silently kills $w.onReady).
// FEATURE_FLAGS routed through facade — configData.js is non-.jsw (R15).
// ============================================================================

import {
  dosFindMatches, dosGetCarrierDetail, dosGetMatchExplanation,
  dosSearchJobs, dosGetJobDetails, dosApplyToJob, dosSaveJob, dosGetSavedJobs,
  dosGetDashboardSummary, dosGetNotifications,
  dosGetOrCreateProfile, dosUpdateProfile, dosUpdatePreferences,
  dosUpdateQualifications, dosGetProfileStrength, dosGetProfileSuggestions,
  dosSetDiscoverability, dosGetWhoViewedMe, dosGetActivityStats,
  dosUpdateDocuments,
  dosLogInterest, dosGetInterests, dosRemoveInterest,
  dosGetTimeline, dosUpdateDisposition, dosGetScorecard,
  dosGetPlayerState, dosAwardXP, dosGetBadges, dosCheckBadgeProgress,
  dosGetAchievements, dosGetAchievementProgress,
  dosGetStreakState, dosRecordLogin, dosUseStreakFreeze,
  dosGetForumCategories, dosGetThreadsByCategory, dosGetThread,
  dosCreateThread, dosGetThreadReplies, dosReplyToThread, dosLikePost,
  dosGetAnnouncements, dosMarkAnnouncementRead, dosGetAnnouncementDetail,
  dosAddAnnouncementComment,
  dosGetSurveys, dosSubmitSurvey,
  dosGetHealthResources, dosSubmitHealthTip, dosGetApprovedTips,
  dosSearchPetFriendly, dosSubmitPetReview, dosGetPetLocation,
  dosGetMentors, dosGetMentorProfile, dosRequestMentorSession,
  dosGetPolicies, dosGetFMCSAAlerts,
  dosGetRetentionDashboard,
  dosLogExpense, dosGetExpenses, dosGetExpenseSummary,
  dosHandleAgentTurn, dosGetRecentContext, dosGetVoiceConfig,
  dosGetMarketContext, dosGetPayAdjustmentFactor,
  dosGetFeatureFlags
} from 'backend/driverOSFacade.jsw';

// #html8 is the HTML iframe component on this page.
// Standard IDs included as fallback.
const HTML_COMPONENT_IDS = ['#html8', '#html1', '#html2', '#html3', '#html4', '#html5', '#html6', '#htmlEmbed1'];

let _connectedComponents = [];
let _driverId = null;
let _carrierId = null;

// FEATURE_FLAGS routed through facade (.jsw server-side) to avoid
// configData.js client-side bundling which kills the Wix page bundler.
let FEATURE_FLAGS = {};

$w.onReady(async function () {
  console.log('[DriverOS] Page ready');

  try { FEATURE_FLAGS = await dosGetFeatureFlags() || {}; } catch (e) { /* fallback to empty */ }

  // Register onMessage on every standard HTML component ID.
  // Mirrors RecruiterOS pattern — no .rendered check, capability guard only.
  HTML_COMPONENT_IDS.forEach(function(id) {
    try {
      const el = $w(id);
      if (el && el.onMessage) {
        el.onMessage(function(event) {
          routeMessage(el, event?.data);
        });
        _connectedComponents.push(el);
        console.log('[DriverOS] onMessage attached to', id);
      }
    } catch (e) {
      // Element not on this page
    }
  });

  // Proactively ping the HTML after a short delay.
  // The HTML iframe may have already sent 'ready' before $w.onReady fired,
  // so that message was lost. This kickstarts the handshake from the Velo side.
  if (_connectedComponents.length > 0) {
    setTimeout(function() {
      _connectedComponents.forEach(function(comp) {
        try {
          comp.postMessage({ action: 'ping', payload: { from: 'velo' } });
          console.log('[DriverOS] Sent proactive ping to HTML');
        } catch (e) { /* component may not be ready yet */ }
      });
    }, 500);

    // Pre-load driver profile and push init data without waiting for HTML to ask.
    setTimeout(async function() {
      try {
        const profile = await dosGetOrCreateProfile();
        if (profile) {
          _driverId = profile._id || profile.driver_id;
          _connectedComponents.forEach(function(comp) {
            safeSend(comp, { action: 'pageReady', payload: { profile: profile, featureFlags: FEATURE_FLAGS } });
          });
          console.log('[DriverOS] Pushed init data to HTML');
        }
      } catch (e) {
        console.error('[DriverOS] Failed to pre-load profile:', e.message);
      }
    }, 1000);
  } else {
    console.warn('[DriverOS] No HTML components found on page');
  }
});

function safeSend(component, data) {
  try { component.postMessage(data); } catch (e) { /* detached element */ }
}

async function routeMessage(component, message) {
  if (!message?.action) return;

  try {
    switch (message.action) {

      // ═══ Lifecycle ═══
      case 'ping': {
        safeSend(component, { action: 'pong' });
        break;
      }
      case 'carrierMatchingReady':
      case 'dashboardReady':
      case 'driverMyCareerReady':
      case 'documentUploadReady':
      case 'surveysReady':
      case 'roadUtilitiesReady':
      case 'announcementsReady':
      case 'policiesReady':
      case 'retentionReady':
      case 'gamificationReady':
      case 'badgesReady':
      case 'challengesReady':
      case 'forumsReady':
      case 'healthReady':
      case 'petFriendlyReady':
      case 'mentorsReady':
      case 'mentorProfileReady':
      case 'opportunitiesReady':
      case 'jobsReady': {
        const profile = await dosGetOrCreateProfile(null);
        _driverId = profile?._id || profile?.id || null;
        _carrierId = profile?.carrier_dot || null;
        safeSend(component, {
          action: 'pageReady',
          payload: {
            userStatus: { memberId: _driverId, loggedIn: true },
            driverProfile: profile,
            featureFlags: FEATURE_FLAGS
          }
        });
        break;
      }

      // ═══ Discovery & Matching ═══
      case 'findMatches': {
        const matches = await dosFindMatches(message.payload || message);
        safeSend(component, { action: 'matchResults', payload: { carriers: matches } });
        break;
      }
      case 'getCarrierDetail': {
        const detail = await dosGetCarrierDetail(message.dot || message.payload?.dot);
        safeSend(component, { action: 'carrierDetailLoaded', payload: detail });
        break;
      }
      case 'getMatchExplanation': {
        const explanation = await dosGetMatchExplanation(_driverId, message.carrierDot || message.payload?.carrierDot);
        safeSend(component, { action: 'matchExplanationLoaded', payload: explanation });
        break;
      }
      case 'logInterest': {
        await dosLogInterest(message.payload || message);
        safeSend(component, { action: 'interestLogged', payload: { success: true } });
        break;
      }
      case 'getOpportunities': {
        const opps = await dosFindMatches({ driverId: _driverId, recommended: true });
        safeSend(component, { action: 'opportunitiesLoaded', payload: { opportunities: opps } });
        break;
      }

      // ═══ Jobs ═══
      case 'searchJobs': {
        const jobs = await dosSearchJobs(_driverId, message.filters || message.payload);
        safeSend(component, { action: 'jobsLoaded', payload: { jobs: jobs } });
        break;
      }
      case 'getJobDetails': {
        const job = await dosGetJobDetails(message.jobId || message.payload?.jobId, _driverId);
        safeSend(component, { action: 'jobDetailLoaded', payload: job });
        break;
      }
      case 'applyToJob': {
        const result = await dosApplyToJob(_driverId, message.jobId || message.payload?.jobId, message.payload);
        safeSend(component, { action: 'jobApplied', payload: result });
        break;
      }
      case 'saveJob': {
        await dosSaveJob(_driverId, message.jobId || message.payload?.jobId);
        safeSend(component, { action: 'jobSaved', payload: { success: true } });
        break;
      }
      case 'getSavedJobs': {
        const saved = await dosGetSavedJobs(_driverId, message.filters || {});
        safeSend(component, { action: 'savedJobsLoaded', payload: { jobs: saved } });
        break;
      }

      // ═══ Dashboard ═══
      case 'refreshDashboard': {
        const dashboard = await dosGetDashboardSummary(_driverId);
        safeSend(component, { action: 'dashboardData', payload: dashboard });
        break;
      }
      case 'getProfileStrength': {
        const strength = await dosGetProfileStrength(_driverId);
        safeSend(component, { action: 'profileStrengthLoaded', payload: strength });
        break;
      }
      case 'getNotifications': {
        const notifs = await dosGetNotifications(_driverId, message.filters || {});
        safeSend(component, { action: 'notificationsLoaded', payload: { notifications: notifs } });
        break;
      }
      case 'setDiscoverability': {
        await dosSetDiscoverability(message.isDiscoverable ?? message.payload?.isDiscoverable);
        safeSend(component, { action: 'discoverabilityUpdated', payload: { success: true } });
        break;
      }
      case 'getUnreadCount': {
        const notifs = await dosGetNotifications(_driverId, { unread: true });
        const count = Array.isArray(notifs) ? notifs.length : (notifs?.totalCount || 0);
        safeSend(component, { action: 'unreadCountData', payload: { count } });
        break;
      }

      // ═══ Profile & Career ═══
      case 'getDriverProfile': {
        const profile = await dosGetOrCreateProfile(null);
        safeSend(component, { action: 'driverProfileLoaded', payload: profile });
        break;
      }
      case 'updateProfile': {
        await dosUpdateProfile(_driverId, message.profileData || message.payload);
        safeSend(component, { action: 'profileUpdated', payload: { success: true } });
        break;
      }
      case 'updatePreferences': {
        await dosUpdatePreferences(message.preferences || message.payload);
        safeSend(component, { action: 'preferencesUpdated', payload: { success: true } });
        break;
      }
      case 'updateQualifications': {
        await dosUpdateQualifications(message.qualifications || message.payload);
        safeSend(component, { action: 'qualificationsUpdated', payload: { success: true } });
        break;
      }
      case 'getProfileSuggestions': {
        const suggestions = await dosGetProfileSuggestions(_driverId);
        safeSend(component, { action: 'profileSuggestionsLoaded', payload: suggestions });
        break;
      }
      case 'getWhoViewedMe': {
        const views = await dosGetWhoViewedMe(message.limit || 10);
        safeSend(component, { action: 'whoViewedMeLoaded', payload: { views } });
        break;
      }

      // ═══ Documents ═══
      case 'getDocuments': {
        const profile = await dosGetOrCreateProfile(null);
        safeSend(component, { action: 'documentList', payload: { documents: profile?.documents || [] } });
        break;
      }
      case 'uploadDocument': {
        await dosUpdateDocuments(message.payload || message);
        safeSend(component, { action: 'uploadResult', payload: { success: true } });
        break;
      }

      // ═══ Gamification ═══
      case 'getGamificationState': {
        const state = await dosGetPlayerState(_driverId);
        safeSend(component, { action: 'gamificationStateLoaded', payload: state });
        break;
      }
      case 'getBadges': {
        const badges = await dosGetBadges(_driverId);
        safeSend(component, { action: 'badgesLoaded', payload: badges });
        break;
      }
      case 'getChallenges': {
        const achievements = await dosGetAchievements(_driverId);
        safeSend(component, { action: 'challengesLoaded', payload: achievements });
        break;
      }
      case 'joinChallenge': {
        await dosAwardXP(_driverId, 'challenge_joined', { challengeId: message.challengeId || message.payload?.challengeId });
        safeSend(component, { action: 'challengeJoined', payload: { success: true } });
        break;
      }
      case 'getStreakState': {
        const streak = await dosGetStreakState(_driverId);
        safeSend(component, { action: 'streakStateLoaded', payload: streak });
        break;
      }
      case 'recordDailyLogin': {
        const result = await dosRecordLogin(_driverId);
        safeSend(component, { action: 'loginRecorded', payload: result });
        break;
      }

      // ═══ Forums ═══
      case 'getForumThreads': {
        const categoryId = message.categoryId || message.payload?.categoryId;
        const threads = categoryId
          ? await dosGetThreadsByCategory(categoryId, message.payload)
          : await dosGetForumCategories();
        safeSend(component, { action: 'forumThreadsLoaded', payload: { threads } });
        break;
      }
      case 'getThreadReplies': {
        const replies = await dosGetThreadReplies(message.threadId || message.payload?.threadId, message.payload);
        safeSend(component, { action: 'threadRepliesLoaded', payload: { replies } });
        break;
      }
      case 'createThread': {
        const thread = await dosCreateThread(message.payload || message);
        safeSend(component, { action: 'threadCreated', payload: thread });
        break;
      }
      case 'replyToThread': {
        const post = await dosReplyToThread(message.payload || message);
        safeSend(component, { action: 'replyPosted', payload: post });
        break;
      }
      case 'likePost': {
        await dosLikePost(message.postId || message.payload?.postId);
        safeSend(component, { action: 'postLiked', payload: { success: true } });
        break;
      }

      // ═══ Announcements ═══
      case 'getAnnouncements': {
        const announcements = await dosGetAnnouncements(_driverId, _carrierId, message.payload);
        safeSend(component, { action: 'announcementsLoaded', payload: { announcements } });
        break;
      }
      case 'markAnnouncementRead': {
        await dosMarkAnnouncementRead(message.announcementId || message.payload?.announcementId, _driverId);
        safeSend(component, { action: 'announcementMarkedRead', payload: { success: true } });
        break;
      }
      case 'getAnnouncementDetail': {
        const detail = await dosGetAnnouncementDetail(message.announcementId || message.payload?.announcementId, _carrierId);
        safeSend(component, { action: 'announcementDetailLoaded', payload: detail });
        break;
      }

      // ═══ Surveys ═══
      case 'getSurveys': {
        const surveys = await dosGetSurveys(_driverId, message.surveyType || 'all');
        safeSend(component, { action: 'surveysLoaded', payload: { surveys } });
        break;
      }
      case 'submitSurvey': {
        await dosSubmitSurvey(_driverId, message.surveyId || message.payload?.surveyId, message.answers || message.payload?.answers);
        safeSend(component, { action: 'surveySubmitted', payload: { success: true } });
        break;
      }

      // ═══ Road & Wellness ═══
      case 'searchParking':
      case 'searchFuel':
      case 'getWeather':
      case 'searchWeighStations':
      case 'searchRestAreas':
      case 'getRoadConditions': {
        // Road utilities share a single bridge pattern — route by toolType
        safeSend(component, { action: 'roadDataLoaded', payload: { toolType: message.action, results: [], status: 'coming_soon' } });
        break;
      }
      case 'getHealthResources': {
        const resources = await dosGetHealthResources(message.category || message.payload?.category);
        safeSend(component, { action: 'healthResourcesLoaded', payload: { resources } });
        break;
      }
      case 'submitHealthTip': {
        await dosSubmitHealthTip(message.payload || message);
        safeSend(component, { action: 'healthTipSubmitted', payload: { success: true } });
        break;
      }
      case 'searchPetFriendly': {
        const locations = await dosSearchPetFriendly(message.filters || message.payload);
        safeSend(component, { action: 'petFriendlyLocationsLoaded', payload: { locations } });
        break;
      }
      case 'submitPetReview': {
        await dosSubmitPetReview(message.locationId || message.payload?.locationId, message.payload);
        safeSend(component, { action: 'petReviewSubmitted', payload: { success: true } });
        break;
      }
      case 'getReviews': {
        const loc = await dosGetPetLocation(message.locationId || message.payload?.locationId);
        safeSend(component, { action: 'reviewsLoaded', payload: { reviews: loc?.reviews || [] } });
        break;
      }

      // ═══ Compliance / Policies ═══
      case 'getDriverPolicies': {
        const policies = await dosGetPolicies();
        safeSend(component, { action: 'driverPoliciesLoaded', payload: { policies } });
        break;
      }
      case 'getPolicyContent': {
        // Policy detail — use same compliance service
        safeSend(component, { action: 'policyContentLoaded', payload: { content: '', status: 'coming_soon' } });
        break;
      }
      case 'acknowledgePolicy': {
        safeSend(component, { action: 'policyAcknowledged', payload: { success: true } });
        break;
      }

      // ═══ Mentorship ═══
      case 'getMentors': {
        const mentors = await dosGetMentors(message.filters || message.payload, message.limit, message.offset);
        safeSend(component, { action: 'mentorsLoaded', payload: { mentors } });
        break;
      }
      case 'getMentorProfile': {
        const mentor = await dosGetMentorProfile(message.mentorId || message.payload?.mentorId);
        safeSend(component, { action: 'mentorProfileLoaded', payload: mentor });
        break;
      }
      case 'requestMentorSession': {
        await dosRequestMentorSession(message.mentorId || message.payload?.mentorId, message.payload);
        safeSend(component, { action: 'sessionRequested', payload: { success: true } });
        break;
      }

      // ═══ Retention ═══
      case 'getRetentionData':
      case 'getRetentionFramework': {
        const retention = _carrierId ? await dosGetRetentionDashboard(_carrierId) : {};
        safeSend(component, { action: 'retentionDataLoaded', payload: retention });
        break;
      }

      // ═══ Financial ═══
      case 'logExpense': {
        await dosLogExpense(_driverId, message.payload || message);
        safeSend(component, { action: 'expenseLogged', payload: { success: true } });
        break;
      }
      case 'getExpenses': {
        const expenses = await dosGetExpenses(_driverId, message.filters || {}, message.pagination || {});
        safeSend(component, { action: 'expensesLoaded', payload: expenses });
        break;
      }
      case 'getExpenseSummary': {
        const summary = await dosGetExpenseSummary(_driverId, message.period || 'current_month');
        safeSend(component, { action: 'expenseSummaryLoaded', payload: summary });
        break;
      }

      // ═══ Agent + Voice ═══
      case 'agentMessage': {
        const response = await dosHandleAgentTurn('driver', _driverId, message.text || message.payload?.text, message.context || message.payload?.context);
        safeSend(component, { action: 'agentResponse', payload: response });
        break;
      }
      case 'getAgentContext': {
        const context = await dosGetRecentContext(message.conversationId || message.payload?.conversationId);
        safeSend(component, { action: 'agentContextLoaded', payload: context });
        break;
      }
      case 'getVoiceConfig': {
        const config = await dosGetVoiceConfig();
        safeSend(component, { action: 'voiceReady', payload: config });
        break;
      }

      // ═══ Market + Intelligence ═══
      case 'getMarketSignals': {
        const market = await dosGetMarketContext();
        safeSend(component, { action: 'marketSignalsLoaded', payload: market });
        break;
      }
      case 'getProactiveInsights': {
        // Proactive insights assembled from multiple signals
        const [market, strength] = await Promise.all([
          dosGetMarketContext(),
          dosGetProfileStrength(_driverId)
        ]);
        const insights = [];
        if (market?.condition === 'HOT') insights.push({ icon: 'trending_up', text: 'Market is hot — carriers are hiring aggressively.' });
        if (strength?.score < 70) insights.push({ icon: 'person', text: 'Complete your profile to get better matches.' });
        safeSend(component, { action: 'proactiveInsightsLoaded', payload: { insights } });
        break;
      }

      // ═══ Navigation ═══
      case 'viewChanged': {
        // Track view changes for context
        break;
      }

      default:
        console.warn('[DriverOS] Unknown action:', message.action);
    }
  } catch (error) {
    console.error('[DriverOS] Error handling', message.action, ':', error.message);
    safeSend(component, { action: 'actionError', payload: { message: error.message, action: message.action } });
  }
}
