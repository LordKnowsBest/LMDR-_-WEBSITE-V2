/**
 * driver-os-config.js
 * ═══════════════════════════════════════════════════════════════════
 * Global configuration for DriverOS shell.
 * VIEW_REGISTRY, NAV_ZONES, SESSION_CONTEXT, FEATURE_FLAGS.
 * ═══════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  var CDN_BASE = 'https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/driver/os/js/views/';

  window.DOS = window.DOS || {};

  DOS.config = {

    VERSION: '2.0.0',

    /* ─── 19 view modules mapped to CDN URLs ─── */
    VIEW_REGISTRY: {
      'matching':       CDN_BASE + 'dos-view-matching.js',
      'opportunities':  CDN_BASE + 'dos-view-opportunities.js',
      'jobs':           CDN_BASE + 'dos-view-jobs.js',
      'dashboard':      CDN_BASE + 'dos-view-dashboard.js',
      'career':         CDN_BASE + 'dos-view-career.js',
      'documents':      CDN_BASE + 'dos-view-documents.js',
      'gamification':   CDN_BASE + 'dos-view-gamification.js',
      'badges':         CDN_BASE + 'dos-view-badges.js',
      'challenges':     CDN_BASE + 'dos-view-challenges.js',
      'forums':         CDN_BASE + 'dos-view-forums.js',
      'announcements':  CDN_BASE + 'dos-view-announcements.js',
      'surveys':        CDN_BASE + 'dos-view-surveys.js',
      'road':           CDN_BASE + 'dos-view-road.js',
      'health':         CDN_BASE + 'dos-view-health.js',
      'pet-friendly':   CDN_BASE + 'dos-view-pet-friendly.js',
      'policies':       CDN_BASE + 'dos-view-policies.js',
      'mentors':        CDN_BASE + 'dos-view-mentors.js',
      'mentor-profile': CDN_BASE + 'dos-view-mentor-profile.js',
      'retention':      CDN_BASE + 'dos-view-retention.js'
    },

    /* ─── 5 bottom nav zones ─── */
    NAV_ZONES: [
      { id: 'match',  label: 'Match',  icon: 'search',         defaultView: 'matching',     views: ['matching', 'opportunities', 'jobs'] },
      { id: 'career', label: 'Career', icon: 'dashboard',      defaultView: 'dashboard',    views: ['dashboard', 'career', 'documents'] },
      { id: 'play',   label: 'Play',   icon: 'emoji_events',   defaultView: 'gamification', views: ['gamification', 'badges', 'challenges'] },
      { id: 'road',   label: 'Road',   icon: 'directions_car', defaultView: 'road',         views: ['road', 'health', 'pet-friendly'] },
      { id: 'agent',  label: 'Agent',  icon: 'smart_toy',      type: 'overlay' }
    ],

    /* ─── Maps each viewId to its nav zone ─── */
    VIEW_CLUSTERS: {
      'matching': 'match', 'opportunities': 'match', 'jobs': 'match',
      'dashboard': 'career', 'career': 'career', 'documents': 'career',
      'gamification': 'play', 'badges': 'play', 'challenges': 'play',
      'road': 'road', 'health': 'road', 'pet-friendly': 'road',
      'forums': 'secondary', 'announcements': 'secondary', 'surveys': 'secondary',
      'policies': 'secondary', 'mentors': 'secondary', 'mentor-profile': 'secondary',
      'retention': 'secondary'
    },

    /* ─── Secondary views (drawer access) ─── */
    SECONDARY_VIEWS: ['forums', 'announcements', 'surveys', 'policies', 'mentors', 'mentor-profile', 'retention'],

    /* ─── Populated by bridge on init ─── */
    SESSION_CONTEXT: {
      driverId: null,
      memberId: null,
      carrierContext: null,
      currentView: null
    },

    /* ─── Per-surface feature flags ─── */
    FEATURE_FLAGS: {
      voice_enabled: true,
      proactive_push: true,
      nba_enabled: true
    }
  };

})();
