import { Router } from 'express';
import { insertLog } from '../../db/bigquery.js';
import profileRouter from './profile.js';
import matchingRouter from './matching.js';
import cockpitRouter from './cockpit.js';
import gamificationRouter from './gamification.js';
import lifecycleRouter from './lifecycle.js';
import communityRouter from './community.js';
import wellnessRouter from './wellness.js';
import financialRouter from './financial.js';
import scorecardRouter from './scorecard.js';
import retentionRouter from './retention.js';
import documentsRouter from './documents.js';
import ocrRouter from './ocr.js';

const router = Router();

// ── Layer 1: Implicit engagement logging ──
router.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    try {
      insertLog({
        service: 'driver-engagement',
        level: 'INFO',
        message: `${req.method} ${req.originalUrl}`,
        data: {
          driver_id: req.auth?.driverId || req.params?.id || 'anonymous',
          endpoint: req.originalUrl,
          method: req.method,
          status_code: res.statusCode,
          response_ms: Date.now() - start,
          session_id: req.headers['x-session-id'] || null,
          user_agent: req.headers['user-agent']?.substring(0, 100) || null,
        },
      });
    } catch { /* non-blocking */ }
  });
  next();
});

// No requireAdmin() — any authenticated user can access driver routes

// Mount sub-routers
router.use('/profile', profileRouter);
router.use('/matching', matchingRouter);
router.use('/cockpit', cockpitRouter);
router.use('/gamification', gamificationRouter);
router.use('/lifecycle', lifecycleRouter);
router.use('/community', communityRouter);
router.use('/wellness', wellnessRouter);
router.use('/financial', financialRouter);
router.use('/scorecard', scorecardRouter);
router.use('/retention', retentionRouter);
router.use('/documents', documentsRouter);
router.use('/ocr', ocrRouter);

// ── GET /driver/manifest — AI tool definitions ──
const TOOL_DEFINITIONS = [
  // Profile (6 tools)
  { name: 'driver_get_profile', description: 'Get a driver profile by ID with completeness score', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/profile/:id' } },
  { name: 'driver_update_profile', description: 'Update driver profile fields (name, CDL, preferences)', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, fields: { type: 'object' } }, required: ['driverId'] }, endpoint: { method: 'PUT', path: '/v1/driver/profile/:id' } },
  { name: 'driver_get_strength', description: 'Get profile completeness score and missing fields', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/profile/:id/strength' } },
  { name: 'driver_set_visibility', description: 'Toggle whether recruiters can find this driver', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, visible: { type: 'boolean' } }, required: ['driverId', 'visible'] }, endpoint: { method: 'PUT', path: '/v1/driver/profile/:id/visibility' } },
  { name: 'driver_get_activity', description: 'Get driver activity stats (applications, views, matches)', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/profile/:id/activity' } },
  { name: 'driver_who_viewed_me', description: 'Show which recruiters viewed this driver profile', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, limit: { type: 'number', default: 10 } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/profile/:id/views' } },

  // Matching (5 tools)
  { name: 'driver_find_jobs', description: 'Find matching carrier jobs for a driver based on profile and preferences', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, limit: { type: 'number', default: 10 } }, required: ['driverId'] }, endpoint: { method: 'POST', path: '/v1/driver/matching/find-jobs' } },
  { name: 'driver_explain_match', description: 'Explain why a driver matched with a specific carrier', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, carrierDot: { type: 'string' } }, required: ['driverId', 'carrierDot'] }, endpoint: { method: 'GET', path: '/v1/driver/matching/explain/:driverId/:carrierDot' } },
  { name: 'driver_search_jobs', description: 'Search available job postings with filters', input_schema: { type: 'object', properties: { cdlClass: { type: 'string' }, state: { type: 'string' }, jobType: { type: 'string' } } }, endpoint: { method: 'GET', path: '/v1/driver/matching/search/jobs' } },
  { name: 'driver_detect_mutual', description: 'Check if driver and carrier have mutual interest', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, carrierDot: { type: 'string' } }, required: ['driverId', 'carrierDot'] }, endpoint: { method: 'POST', path: '/v1/driver/matching/detect-mutual' } },
  { name: 'driver_get_model_info', description: 'Get current matching model version and weights', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/driver/matching/model-info' } },

  // Cockpit (5 tools)
  { name: 'driver_get_dashboard', description: 'Get driver dashboard summary (match count, applications, saved jobs)', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/cockpit/:id/dashboard' } },
  { name: 'driver_apply_job', description: 'Submit a job application for a driver', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, jobId: { type: 'string' } }, required: ['driverId', 'jobId'] }, endpoint: { method: 'POST', path: '/v1/driver/cockpit/:id/apply/:jobId' } },
  { name: 'driver_get_applications', description: 'List driver job applications with status', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/cockpit/:id/applications' } },
  { name: 'driver_withdraw_app', description: 'Withdraw a job application', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, appId: { type: 'string' } }, required: ['driverId', 'appId'] }, endpoint: { method: 'POST', path: '/v1/driver/cockpit/:id/withdraw/:appId' } },
  { name: 'driver_get_notifications', description: 'Get driver notification queue', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/cockpit/:id/notifications' } },

  // Gamification (4 tools)
  { name: 'driver_get_progression', description: 'Get driver XP, level, streak, and multiplier', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/gamification/:id/progression' } },
  { name: 'driver_get_achievements', description: 'Get all achievements with earned status and progress', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/gamification/:id/achievements' } },
  { name: 'driver_get_streak', description: 'Get streak status (days, freeze availability, next milestone)', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/gamification/:id/streak' } },
  { name: 'driver_get_leaderboard', description: 'Get top drivers by XP', input_schema: { type: 'object', properties: { limit: { type: 'number', default: 10 } } }, endpoint: { method: 'GET', path: '/v1/driver/gamification/leaderboard' } },

  // Lifecycle (2 tools)
  { name: 'driver_get_timeline', description: 'Get driver lifecycle timeline (status changes, milestones)', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/lifecycle/:id/timeline' } },
  { name: 'driver_update_disposition', description: 'Update driver disposition (actively_looking, hired, etc.)', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, disposition: { type: 'string', enum: ['actively_looking', 'passively_open', 'not_looking', 'hired'] } }, required: ['driverId', 'disposition'] }, endpoint: { method: 'PUT', path: '/v1/driver/lifecycle/:id/disposition' } },

  // Community (3 tools)
  { name: 'driver_get_forums', description: 'Get forum categories with thread counts', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/driver/community/forums' } },
  { name: 'driver_get_announcements', description: 'Get carrier announcements for driver', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/driver/community/announcements' } },
  { name: 'driver_get_surveys', description: 'Get pending surveys for driver', input_schema: { type: 'object', properties: {} }, endpoint: { method: 'GET', path: '/v1/driver/community/surveys' } },

  // Wellness (2 tools)
  { name: 'driver_search_pet_friendly', description: 'Search pet-friendly truck stops near a location', input_schema: { type: 'object', properties: { lat: { type: 'number' }, lng: { type: 'number' }, radiusMiles: { type: 'number', default: 50 } } }, endpoint: { method: 'GET', path: '/v1/driver/wellness/pets/nearby' } },
  { name: 'driver_get_health_resources', description: 'Get trucker health and wellness resources by category', input_schema: { type: 'object', properties: { category: { type: 'string' } } }, endpoint: { method: 'GET', path: '/v1/driver/wellness/health' } },

  // Financial (2 tools)
  { name: 'driver_log_expense', description: 'Log a driver expense (fuel, tolls, meals, etc.)', input_schema: { type: 'object', properties: { driverId: { type: 'string' }, amount: { type: 'number' }, category: { type: 'string' }, description: { type: 'string' } }, required: ['driverId', 'amount', 'category'] }, endpoint: { method: 'POST', path: '/v1/driver/financial/:id/expenses' } },
  { name: 'driver_get_expenses', description: 'Get driver expense history', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/financial/:id/expenses' } },

  // Retention (1 tool)
  { name: 'driver_get_risk_score', description: 'Get driver retention risk assessment', input_schema: { type: 'object', properties: { driverId: { type: 'string' } }, required: ['driverId'] }, endpoint: { method: 'GET', path: '/v1/driver/retention/:id/risk' } },

  // Knowledge / RAG (1 tool) — calls AI service internally
  { name: 'driver_search_knowledge', description: 'Search the LMDR knowledge base for answers about trucking regulations, CDL requirements, FMCSA rules, carrier policies, and platform features', input_schema: { type: 'object', properties: { question: { type: 'string', description: 'The question to search for in the knowledge base' }, context: { type: 'string', description: 'Optional additional context to improve search relevance' } }, required: ['question'] }, endpoint: { method: 'POST', path: '/ai/rag/query' } },
];

router.get('/manifest', (req, res) => {
  return res.json({ tools: TOOL_DEFINITIONS, version: '1.0.0', generatedAt: new Date().toISOString() });
});

export default router;
