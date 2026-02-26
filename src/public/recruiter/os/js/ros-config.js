// ============================================================================
// ROS-CONFIG — VelocityMatch Recruiter OS Configuration
// Branding, tool registry, color tokens, feature flags
// ============================================================================

window.ROS = window.ROS || {};

ROS.config = {
  // ── Branding ──
  brand: {
    name: 'VelocityMatch',
    logo: 'VM',
    tagline: 'Recruiter Operating System',
    icon: 'hub'
  },

  // ── Color Tokens ──
  colors: {
    primary: '#2563eb',
    primaryDeep: '#1e40af',
    accent: '#fbbf24',
    accentBright: '#F9FF80',
    dark: '#0f172a',
    beige: '#F5F5DC',
    beigeDark: '#E8E0C8',
    tan: '#C8B896',
    ivory: '#FFFFF5',
    success: '#859900',
    danger: '#ef4444'
  },

  // ── Feature Flags ──
  features: {
    NLU_ENABLED: true,         // Claude API intent detection via agentService
    NBA_ENABLED: false,        // Next Best Action chips
    DARK_MODE_ENABLED: true,  // Theme toggle in settings
    VOICE_ENABLED: true,       // VAPI voice integration
    THEME_MODE: 'light'
  },

  // ── Drawer Configs ──
  drawers: [
    {
      id: 'discover',
      label: 'Discover',
      icon: 'explore',
      gradient: 'from-blue-600 to-blue-800',
      iconGradient: 'from-lmdr-blue to-lmdr-deep',
      tools: ['search', 'ai-match', 'alerts', 'job-boards', 'social', 'intel', 'predict']
    },
    {
      id: 'pipe',
      label: 'Pipeline & Engage',
      icon: 'view_kanban',
      gradient: 'from-yellow-300 to-yellow-500',
      iconGradient: 'from-lmdr-yb to-lmdr-yellow',
      tools: ['pipeline', 'messages', 'sms', 'email', 'interview', 'calls', 'automate', 'carriers']
    },
    {
      id: 'onb',
      label: 'Onboard & Comply',
      icon: 'verified',
      gradient: 'from-emerald-500 to-teal-600',
      iconGradient: 'from-emerald-500 to-teal-600',
      tools: ['onboard', 'docs', 'bg-check', 'drug-test', 'orient', 'comply']
    },
    {
      id: 'anl',
      label: 'Analytics',
      icon: 'insights',
      gradient: 'from-slate-800 to-slate-900',
      iconGradient: 'from-lmdr-dark to-slate-700',
      tools: ['funnel', 'cost-hire', 'source', 'lifecycle', 'retention']
    },
    {
      id: 'rank',
      label: 'Rank & Compete',
      icon: 'emoji_events',
      gradient: 'from-amber-400 to-orange-500',
      iconGradient: 'from-amber-400 to-orange-500',
      tools: ['leaderboard', 'badges', 'gamification']
    }
  ],

  // ── Dock Items ──
  dock: [
    { id: 'home', icon: 'grid_view', label: 'Home', view: 'home' },
    { id: 'pipeline', icon: 'calendar_today', label: 'Pipeline', view: 'pipeline' },
    { id: 'messages', icon: 'chat_bubble_outline', label: 'Messages', view: 'messages', badge: true },
    { id: 'search', icon: 'folder_open', label: 'Drivers', view: 'search' },
    { id: 'funnel', icon: 'insights', label: 'Analytics', view: 'funnel' }
  ]
};

// ── 27-Tool Registry ──
// status: 'ready' = has backend handler, 'consolidate' = needs page code addition, 'future' = Coming Soon
ROS.TOOL_REGISTRY = [
  // ── Discover (6) ──
  { id: 'search', name: 'Search', desc: 'AI matching', icon: 'person_search', color: '#2563eb', gradient: 'from-lmdr-blue to-lmdr-deep', view: 'search', drawer: 'discover', status: 'ready' },
  { id: 'ai-match', name: 'AI Match', desc: 'Neural matching', icon: 'neurology', color: '#4f46e5', gradient: 'from-blue-500 to-indigo-600', view: 'search', drawer: 'discover', status: 'ready', animate: 'float' },
  { id: 'alerts', name: 'Alerts', desc: 'Saved search alerts', icon: 'bookmark', color: '#6366f1', gradient: 'from-indigo-500 to-violet-600', view: 'search', drawer: 'discover', status: 'ready', badge: true },
  { id: 'job-boards', name: 'Job Boards', desc: 'Indeed, Zip', icon: 'campaign', color: '#0284c7', gradient: 'from-sky-500 to-blue-600', view: 'job-boards', drawer: 'discover', status: 'ready' },
  { id: 'social', name: 'Social', desc: 'Social posting', icon: 'share', color: '#0284c7', gradient: 'from-sky-400 to-blue-500', view: 'social', drawer: 'discover', status: 'ready' },
  { id: 'intel', name: 'Intel', desc: 'Competitor intel', icon: 'visibility', color: '#6366f1', gradient: 'from-violet-500 to-purple-600', view: 'intel', drawer: 'discover', status: 'consolidate' },
  { id: 'predict', name: 'Predict', desc: 'ML forecasts', icon: 'auto_awesome', color: '#7c3aed', gradient: 'from-purple-500 to-fuchsia-600', view: 'predict', drawer: 'discover', status: 'consolidate' },

  // ── Pipeline & Engage (8) ──
  { id: 'pipeline', name: 'Pipeline', desc: 'Kanban board', icon: 'view_column', color: '#f59e0b', gradient: 'from-lmdr-yb to-amber-500', view: 'pipeline', drawer: 'pipe', status: 'ready' },
  { id: 'messages', name: 'Messages', desc: 'Driver comms', icon: 'chat', color: '#f97316', gradient: 'from-amber-400 to-orange-500', view: 'messages', drawer: 'pipe', status: 'ready' },
  { id: 'sms', name: 'SMS', desc: 'SMS campaigns', icon: 'sms', color: '#f97316', gradient: 'from-emerald-500 to-green-600', view: 'sms', drawer: 'pipe', status: 'ready' },
  { id: 'email', name: 'Email', desc: 'Email drips', icon: 'forward_to_inbox', color: '#eab308', gradient: 'from-amber-400 to-orange-500', view: 'email', drawer: 'pipe', status: 'ready' },
  { id: 'interview', name: 'Interview', desc: 'Video booking', icon: 'videocam', color: '#f59e0b', gradient: 'from-amber-500 to-yellow-600', view: 'telemetry', drawer: 'pipe', status: 'ready' },
  { id: 'calls', name: 'Calls', desc: 'Telemetry', icon: 'phone_in_talk', color: '#f97316', gradient: 'from-orange-500 to-amber-600', view: 'telemetry', drawer: 'pipe', status: 'ready' },
  { id: 'automate', name: 'Automate', desc: 'Workflow rules', icon: 'bolt', color: '#eab308', gradient: 'from-yellow-400 to-lmdr-yellow', view: 'automate', drawer: 'pipe', status: 'ready' },
  { id: 'carriers', name: 'Carriers', desc: 'DOT portfolio', icon: 'local_shipping', color: '#d97706', gradient: 'from-amber-600 to-orange-700', view: 'carriers', drawer: 'pipe', status: 'ready' },

  // ── Onboard & Comply (6) ──
  { id: 'onboard', name: 'Onboard', desc: 'Post-hire', icon: 'task_alt', color: '#059669', gradient: 'from-emerald-400 to-teal-500', view: 'onboard', drawer: 'onb', status: 'consolidate' },
  { id: 'docs', name: 'Docs', desc: 'CDL, medical', icon: 'folder_supervised', color: '#0d9488', gradient: 'from-teal-400 to-cyan-600', view: 'docs', drawer: 'onb', status: 'ready' },
  { id: 'bg-check', name: 'BG Check', desc: 'Background check', icon: 'shield_person', color: '#0891b2', gradient: 'from-cyan-500 to-blue-600', view: 'bg-check', drawer: 'onb', status: 'ready' },
  { id: 'drug-test', name: 'Drug Test', desc: 'Quest/LabCorp', icon: 'biotech', color: '#059669', gradient: 'from-emerald-500 to-green-600', view: 'drug-test', drawer: 'onb', status: 'ready' },
  { id: 'orient', name: 'Orient.', desc: 'Calendar', icon: 'event_available', color: '#16a34a', gradient: 'from-green-500 to-emerald-600', view: 'orient', drawer: 'onb', status: 'ready' },
  { id: 'comply', name: 'Comply', desc: 'Regulatory', icon: 'gavel', color: '#0d9488', gradient: 'from-teal-600 to-emerald-700', view: 'comply', drawer: 'onb', status: 'ready' },

  // ── Analytics (5) ──
  { id: 'funnel', name: 'Funnel', desc: 'Conversion', icon: 'filter_alt', color: '#475569', gradient: 'from-slate-700 to-lmdr-dark', view: 'funnel', drawer: 'anl', status: 'consolidate', iconColor: 'text-lmdr-yellow' },
  { id: 'cost-hire', name: 'Cost/Hire', desc: 'Budget', icon: 'payments', color: '#475569', gradient: 'from-slate-600 to-slate-800', view: 'cost-analysis', drawer: 'anl', status: 'ready', iconColor: 'text-lmdr-yellow' },
  { id: 'source', name: 'Source', desc: 'Attribution', icon: 'pie_chart', color: '#475569', gradient: 'from-lmdr-dark to-blue-900', view: 'attribution', drawer: 'anl', status: 'future', iconColor: 'text-lmdr-yellow' },
  { id: 'lifecycle', name: 'Lifecycle', desc: 'Driver health', icon: 'monitoring', color: '#475569', gradient: 'from-slate-800 to-slate-900', view: 'lifecycle', drawer: 'anl', status: 'future', iconColor: 'text-emerald-400' },
  { id: 'retention', name: 'Retain', desc: 'Risk signals', icon: 'shield', color: '#dc2626', gradient: 'from-red-600 to-rose-700', view: 'retention', drawer: 'anl', status: 'consolidate' },

  // ── Rank & Compete (3) ──
  { id: 'leaderboard', name: 'Leaderboard', desc: 'Rankings', icon: 'leaderboard', color: '#f59e0b', gradient: 'from-amber-400 to-orange-500', view: 'leaderboard', drawer: 'rank', status: 'ready' },
  { id: 'badges', name: 'Badges', desc: 'Achievements', icon: 'stars', color: '#f97316', gradient: 'from-orange-400 to-red-500', view: 'leaderboard', drawer: 'rank', status: 'ready' },
  { id: 'gamification', name: 'Gamify', desc: 'XP & Streaks', icon: 'emoji_events', color: '#f59e0b', gradient: 'from-amber-400 to-yellow-500', view: 'gamification', drawer: 'rank', status: 'ready' }
];

// ── Intent Map (for chat routing) ──
ROS.INTENT_MAP = [
  { keys: ['match', 'top match', 'best driver', 'find driver'], view: 'search', msg: 'Loading your top matches in the workspace...' },
  { keys: ['pipeline', 'kanban', 'candidates'], view: 'pipeline', msg: 'Opening your candidate pipeline...' },
  { keys: ['funnel', 'analytics', 'report', 'conversion', 'cost'], view: 'funnel', msg: 'Running analytics dashboard...' },
  { keys: ['onboard', 'orientation', 'compliance', 'bg check', 'drug test'], view: 'onboard', msg: 'Loading onboarding dashboard...' },
  { keys: ['message', 'sms', 'email', 'inbox', 'text'], view: 'messages', msg: 'Opening messaging center...' },
  { keys: ['carrier', 'fleet', 'dot', 'trucking'], view: 'carriers', msg: 'Loading carrier portfolio...' },
  { keys: ['leaderboard', 'rank', 'badge', 'xp', 'score'], view: 'leaderboard', msg: 'Pulling up the leaderboard...' },
  { keys: ['predict', 'forecast', 'attrition', 'risk'], view: 'predict', msg: 'Running AI predictions...' },
  { keys: ['intel', 'competitor', 'market', 'pay rate'], view: 'intel', msg: 'Loading competitor intelligence...' },
  { keys: ['search', 'cdl', 'driver', 'hazmat', 'endorsement'], view: 'search', msg: 'Opening driver search...' },
  { keys: ['retain', 'retention', 'at-risk', 'churn'], view: 'retention', msg: 'Loading retention dashboard...' },
  { keys: ['telemetry', 'call', 'phone'], view: 'telemetry', msg: 'Opening call telemetry...' },
  { keys: ['job board', 'indeed', 'ziprecruiter', 'posting'], view: 'job-boards', msg: 'Opening job board distribution...' },
  { keys: ['sms', 'text message', 'text campaign'], view: 'sms', msg: 'Opening SMS campaigns...' },
  { keys: ['email', 'drip', 'sequence', 'newsletter'], view: 'email', msg: 'Opening email campaigns...' },
  { keys: ['social', 'facebook', 'linkedin', 'instagram', 'post'], view: 'social', msg: 'Opening social posting...' }
];

// ── NBA Chips (future — architectured but disabled) ──
ROS.NBA_CHIPS = [];

// Helper: get tool by ID
ROS.getTool = function (id) {
  return ROS.TOOL_REGISTRY.find(t => t.id === id);
};

// Helper: get tools for a drawer
ROS.getDrawerTools = function (drawerId) {
  return ROS.TOOL_REGISTRY.filter(t => t.drawer === drawerId);
};
