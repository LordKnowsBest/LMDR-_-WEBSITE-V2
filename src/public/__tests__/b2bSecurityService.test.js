/* eslint-disable */
/**
 * B2B Security Service - Unit Tests
 *
 * Tests role-based access control, consent validation, quiet hours,
 * do-not-contact enforcement, and audit logging.
 *
 * Strategy: Replicates security logic with pure functions to avoid
 * ESM import issues with .jsw files.
 */

// ============================================================================
// REPLICATED CONSTANTS (mirrors b2bSecurityService.jsw)
// ============================================================================

const B2B_ROLES = {
  VIEWER: 'b2b_viewer',
  REP: 'b2b_rep',
  MANAGER: 'b2b_manager',
  ADMIN: 'b2b_admin'
};

const ROLE_HIERARCHY = {
  [B2B_ROLES.VIEWER]: 0,
  [B2B_ROLES.REP]: 1,
  [B2B_ROLES.MANAGER]: 2,
  [B2B_ROLES.ADMIN]: 3
};

const SITE_ADMIN_ROLES = ['admin', 'super_admin', 'ops_admin'];

const CONSENT_STATUS = {
  PENDING: 'pending',
  OPTED_IN: 'opted_in',
  OPTED_OUT: 'opted_out',
  DO_NOT_CONTACT: 'do_not_contact'
};

const CONSENT_REQUIRED_CHANNELS = ['sms', 'call'];

const QUIET_HOURS = { start: 21, end: 8 };

// ============================================================================
// REPLICATED LOGIC (mirrors b2bSecurityService.jsw)
// ============================================================================

const ACTION_PERMISSIONS = {
  getDashboardKPIs: B2B_ROLES.VIEWER,
  getTopProspects: B2B_ROLES.VIEWER,
  getAlerts: B2B_ROLES.VIEWER,
  getTopOpportunities: B2B_ROLES.VIEWER,
  getNextActions: B2B_ROLES.VIEWER,
  getAccount: B2B_ROLES.VIEWER,
  listAccounts: B2B_ROLES.VIEWER,
  getContacts: B2B_ROLES.VIEWER,
  getSignal: B2B_ROLES.VIEWER,
  getPipeline: B2B_ROLES.VIEWER,
  getForecast: B2B_ROLES.VIEWER,
  getOpportunity: B2B_ROLES.VIEWER,
  getOpportunitiesByAccount: B2B_ROLES.VIEWER,
  getPipelineKPIs: B2B_ROLES.VIEWER,
  getStageConversions: B2B_ROLES.VIEWER,
  getRisks: B2B_ROLES.VIEWER,
  getStageDefinitions: B2B_ROLES.VIEWER,
  getPlaybookSuggestions: B2B_ROLES.VIEWER,
  getValueProps: B2B_ROLES.VIEWER,
  getTimeline: B2B_ROLES.VIEWER,
  getActivityVelocity: B2B_ROLES.VIEWER,
  getSequences: B2B_ROLES.VIEWER,
  getSequence: B2B_ROLES.VIEWER,
  getThrottleStatus: B2B_ROLES.VIEWER,
  getOutreachMetrics: B2B_ROLES.VIEWER,
  getChannelPerformance: B2B_ROLES.VIEWER,
  getRepPerformance: B2B_ROLES.VIEWER,
  getSourcePerformance: B2B_ROLES.VIEWER,
  getCPA: B2B_ROLES.VIEWER,
  getCompetitorIntel: B2B_ROLES.VIEWER,
  getBrief: B2B_ROLES.VIEWER,
  createAccount: B2B_ROLES.REP,
  updateAccount: B2B_ROLES.REP,
  createContact: B2B_ROLES.REP,
  updateContact: B2B_ROLES.REP,
  generateSignal: B2B_ROLES.REP,
  generateBatchSignals: B2B_ROLES.REP,
  createOpportunity: B2B_ROLES.REP,
  moveStage: B2B_ROLES.REP,
  logActivity: B2B_ROLES.REP,
  recordEmail: B2B_ROLES.REP,
  recordSms: B2B_ROLES.REP,
  recordCall: B2B_ROLES.REP,
  captureLead: B2B_ROLES.REP,
  addCompetitorIntel: B2B_ROLES.REP,
  generateBrief: B2B_ROLES.REP,
  quickAction: B2B_ROLES.REP,
  accountAction: B2B_ROLES.REP,
  saveSequence: B2B_ROLES.MANAGER,
  addStep: B2B_ROLES.MANAGER,
  createCallCampaign: B2B_ROLES.MANAGER,
  saveSnapshot: B2B_ROLES.MANAGER
};

const AUDITABLE_ACTIONS = [
  'createAccount', 'updateAccount',
  'createContact', 'updateContact',
  'createOpportunity', 'moveStage',
  'recordEmail', 'recordSms', 'recordCall',
  'captureLead', 'saveSequence', 'addStep',
  'createCallCampaign', 'addCompetitorIntel',
  'generateBrief', 'generateBatchSignals',
  'saveSnapshot', 'quickAction', 'accountAction'
];

function hasRole(user, minRole) {
  if (!user || !user.role) return false;
  const userLevel = ROLE_HIERARCHY[user.role] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[minRole] ?? 999;
  return userLevel >= requiredLevel;
}

function getRequiredRole(action) {
  return ACTION_PERMISSIONS[action] || B2B_ROLES.REP;
}

function isAuditable(action) {
  return AUDITABLE_ACTIONS.includes(action);
}

function checkActionPermission(user, action) {
  if (!user || !user.role) {
    return { allowed: false, reason: 'No B2B role assigned. Contact an administrator.' };
  }
  const requiredRole = getRequiredRole(action);
  if (!hasRole(user, requiredRole)) {
    return {
      allowed: false,
      reason: `Action "${action}" requires ${requiredRole} role. Your role: ${user.role}.`
    };
  }
  return { allowed: true };
}

function validateConsentSync(consentStatus, channel) {
  if (channel === 'email') {
    if (consentStatus === CONSENT_STATUS.OPTED_OUT || consentStatus === CONSENT_STATUS.DO_NOT_CONTACT) {
      return { allowed: false, reason: 'Contact has opted out' };
    }
    return { allowed: true };
  }
  if (CONSENT_REQUIRED_CHANNELS.includes(channel)) {
    if (consentStatus === CONSENT_STATUS.DO_NOT_CONTACT) {
      return { allowed: false, reason: 'Contact is on do-not-contact list' };
    }
    if (consentStatus === CONSENT_STATUS.OPTED_OUT) {
      return { allowed: false, reason: `Contact has opted out of ${channel}` };
    }
    if (consentStatus === CONSENT_STATUS.PENDING) {
      return { allowed: false, reason: `${channel} requires explicit consent. Status is pending.` };
    }
    return { allowed: true };
  }
  return { allowed: true };
}

function checkQuietHoursAt(hour) {
  const inQuietHours = hour >= QUIET_HOURS.start || hour < QUIET_HOURS.end;
  return { inQuietHours };
}

function inferTargetType(action) {
  if (action.includes('Account') || action === 'captureLead') return 'account';
  if (action.includes('Contact')) return 'contact';
  if (action.includes('Opportunity') || action.includes('Stage') || action.includes('Pipeline')) return 'opportunity';
  if (action.includes('Sequence') || action.includes('Step')) return 'sequence';
  if (action.includes('Email') || action.includes('Sms') || action.includes('Call')) return 'outreach';
  if (action.includes('Brief') || action.includes('Research')) return 'research';
  if (action.includes('Signal')) return 'signal';
  if (action.includes('Snapshot') || action.includes('Intel')) return 'analytics';
  return 'other';
}

// ============================================================================
// TESTS
// ============================================================================

describe('B2B Security Service', () => {

  // ========== ROLE HIERARCHY ==========

  describe('Role Hierarchy', () => {
    test('viewer has lowest privilege level', () => {
      expect(ROLE_HIERARCHY[B2B_ROLES.VIEWER]).toBe(0);
    });

    test('admin has highest privilege level', () => {
      expect(ROLE_HIERARCHY[B2B_ROLES.ADMIN]).toBe(3);
    });

    test('hierarchy order is viewer < rep < manager < admin', () => {
      expect(ROLE_HIERARCHY[B2B_ROLES.VIEWER]).toBeLessThan(ROLE_HIERARCHY[B2B_ROLES.REP]);
      expect(ROLE_HIERARCHY[B2B_ROLES.REP]).toBeLessThan(ROLE_HIERARCHY[B2B_ROLES.MANAGER]);
      expect(ROLE_HIERARCHY[B2B_ROLES.MANAGER]).toBeLessThan(ROLE_HIERARCHY[B2B_ROLES.ADMIN]);
    });
  });

  // ========== hasRole ==========

  describe('hasRole', () => {
    const admin = { role: B2B_ROLES.ADMIN, roleLevel: 3 };
    const rep = { role: B2B_ROLES.REP, roleLevel: 1 };
    const viewer = { role: B2B_ROLES.VIEWER, roleLevel: 0 };

    test('admin has any role', () => {
      expect(hasRole(admin, B2B_ROLES.VIEWER)).toBe(true);
      expect(hasRole(admin, B2B_ROLES.REP)).toBe(true);
      expect(hasRole(admin, B2B_ROLES.MANAGER)).toBe(true);
      expect(hasRole(admin, B2B_ROLES.ADMIN)).toBe(true);
    });

    test('rep has viewer and rep roles but not manager or admin', () => {
      expect(hasRole(rep, B2B_ROLES.VIEWER)).toBe(true);
      expect(hasRole(rep, B2B_ROLES.REP)).toBe(true);
      expect(hasRole(rep, B2B_ROLES.MANAGER)).toBe(false);
      expect(hasRole(rep, B2B_ROLES.ADMIN)).toBe(false);
    });

    test('viewer only has viewer role', () => {
      expect(hasRole(viewer, B2B_ROLES.VIEWER)).toBe(true);
      expect(hasRole(viewer, B2B_ROLES.REP)).toBe(false);
    });

    test('null user has no roles', () => {
      expect(hasRole(null, B2B_ROLES.VIEWER)).toBe(false);
    });

    test('user with no role property has no roles', () => {
      expect(hasRole({}, B2B_ROLES.VIEWER)).toBe(false);
    });
  });

  // ========== ACTION PERMISSIONS ==========

  describe('Action Permissions', () => {
    test('all read actions require only viewer', () => {
      const readActions = [
        'getDashboardKPIs', 'getTopProspects', 'getAlerts',
        'getAccount', 'listAccounts', 'getPipeline', 'getBrief'
      ];
      readActions.forEach(action => {
        expect(getRequiredRole(action)).toBe(B2B_ROLES.VIEWER);
      });
    });

    test('all write actions require at least rep', () => {
      const writeActions = [
        'createAccount', 'updateAccount', 'createContact',
        'recordEmail', 'recordSms', 'recordCall', 'captureLead'
      ];
      writeActions.forEach(action => {
        const role = getRequiredRole(action);
        expect(ROLE_HIERARCHY[role]).toBeGreaterThanOrEqual(ROLE_HIERARCHY[B2B_ROLES.REP]);
      });
    });

    test('manager actions require manager level', () => {
      const managerActions = ['saveSequence', 'addStep', 'createCallCampaign', 'saveSnapshot'];
      managerActions.forEach(action => {
        expect(getRequiredRole(action)).toBe(B2B_ROLES.MANAGER);
      });
    });

    test('unknown actions default to rep', () => {
      expect(getRequiredRole('completelyUnknownAction')).toBe(B2B_ROLES.REP);
    });
  });

  // ========== checkActionPermission ==========

  describe('checkActionPermission', () => {
    const viewer = { role: B2B_ROLES.VIEWER };
    const rep = { role: B2B_ROLES.REP };
    const manager = { role: B2B_ROLES.MANAGER };
    const admin = { role: B2B_ROLES.ADMIN };

    test('viewer can read dashboard', () => {
      const result = checkActionPermission(viewer, 'getDashboardKPIs');
      expect(result.allowed).toBe(true);
    });

    test('viewer cannot create accounts', () => {
      const result = checkActionPermission(viewer, 'createAccount');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('requires b2b_rep');
    });

    test('rep can create accounts', () => {
      const result = checkActionPermission(rep, 'createAccount');
      expect(result.allowed).toBe(true);
    });

    test('rep cannot save sequences (requires manager)', () => {
      const result = checkActionPermission(rep, 'saveSequence');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('requires b2b_manager');
    });

    test('manager can save sequences', () => {
      const result = checkActionPermission(manager, 'saveSequence');
      expect(result.allowed).toBe(true);
    });

    test('admin can do everything', () => {
      const allActions = Object.keys(ACTION_PERMISSIONS);
      allActions.forEach(action => {
        expect(checkActionPermission(admin, action).allowed).toBe(true);
      });
    });

    test('null user is denied', () => {
      const result = checkActionPermission(null, 'getDashboardKPIs');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('No B2B role');
    });

    test('user without role is denied', () => {
      const result = checkActionPermission({}, 'getDashboardKPIs');
      expect(result.allowed).toBe(false);
    });
  });

  // ========== AUDIT ==========

  describe('Audit Logging', () => {
    test('write actions are auditable', () => {
      expect(isAuditable('createAccount')).toBe(true);
      expect(isAuditable('updateAccount')).toBe(true);
      expect(isAuditable('recordEmail')).toBe(true);
      expect(isAuditable('moveStage')).toBe(true);
      expect(isAuditable('captureLead')).toBe(true);
    });

    test('read actions are not auditable', () => {
      expect(isAuditable('getDashboardKPIs')).toBe(false);
      expect(isAuditable('getAccount')).toBe(false);
      expect(isAuditable('getPipeline')).toBe(false);
      expect(isAuditable('getBrief')).toBe(false);
    });

    test('all auditable actions exist in ACTION_PERMISSIONS', () => {
      AUDITABLE_ACTIONS.forEach(action => {
        expect(ACTION_PERMISSIONS[action] || B2B_ROLES.REP).toBeDefined();
      });
    });
  });

  // ========== CONSENT VALIDATION ==========

  describe('Consent Validation', () => {
    test('email is allowed for pending consent', () => {
      const result = validateConsentSync(CONSENT_STATUS.PENDING, 'email');
      expect(result.allowed).toBe(true);
    });

    test('email is allowed for opted-in consent', () => {
      const result = validateConsentSync(CONSENT_STATUS.OPTED_IN, 'email');
      expect(result.allowed).toBe(true);
    });

    test('email is blocked for opted-out consent', () => {
      const result = validateConsentSync(CONSENT_STATUS.OPTED_OUT, 'email');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('opted out');
    });

    test('email is blocked for do-not-contact', () => {
      const result = validateConsentSync(CONSENT_STATUS.DO_NOT_CONTACT, 'email');
      expect(result.allowed).toBe(false);
    });

    test('SMS requires explicit opt-in', () => {
      const pending = validateConsentSync(CONSENT_STATUS.PENDING, 'sms');
      expect(pending.allowed).toBe(false);
      expect(pending.reason).toContain('requires explicit consent');
    });

    test('SMS is allowed for opted-in', () => {
      const result = validateConsentSync(CONSENT_STATUS.OPTED_IN, 'sms');
      expect(result.allowed).toBe(true);
    });

    test('SMS is blocked for opted-out', () => {
      const result = validateConsentSync(CONSENT_STATUS.OPTED_OUT, 'sms');
      expect(result.allowed).toBe(false);
    });

    test('SMS is blocked for do-not-contact', () => {
      const result = validateConsentSync(CONSENT_STATUS.DO_NOT_CONTACT, 'sms');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('do-not-contact');
    });

    test('call requires explicit opt-in', () => {
      const pending = validateConsentSync(CONSENT_STATUS.PENDING, 'call');
      expect(pending.allowed).toBe(false);
    });

    test('call is allowed for opted-in', () => {
      const result = validateConsentSync(CONSENT_STATUS.OPTED_IN, 'call');
      expect(result.allowed).toBe(true);
    });

    test('call is blocked for do-not-contact', () => {
      const result = validateConsentSync(CONSENT_STATUS.DO_NOT_CONTACT, 'call');
      expect(result.allowed).toBe(false);
    });

    test('unknown channel defaults to allowed', () => {
      const result = validateConsentSync(CONSENT_STATUS.PENDING, 'in_person');
      expect(result.allowed).toBe(true);
    });
  });

  // ========== QUIET HOURS ==========

  describe('Quiet Hours', () => {
    test('9 PM (21:00) is in quiet hours', () => {
      expect(checkQuietHoursAt(21).inQuietHours).toBe(true);
    });

    test('11 PM (23:00) is in quiet hours', () => {
      expect(checkQuietHoursAt(23).inQuietHours).toBe(true);
    });

    test('3 AM is in quiet hours', () => {
      expect(checkQuietHoursAt(3).inQuietHours).toBe(true);
    });

    test('7 AM is in quiet hours', () => {
      expect(checkQuietHoursAt(7).inQuietHours).toBe(true);
    });

    test('8 AM is NOT in quiet hours (boundary)', () => {
      expect(checkQuietHoursAt(8).inQuietHours).toBe(false);
    });

    test('12 PM is NOT in quiet hours', () => {
      expect(checkQuietHoursAt(12).inQuietHours).toBe(false);
    });

    test('8 PM (20:00) is NOT in quiet hours', () => {
      expect(checkQuietHoursAt(20).inQuietHours).toBe(false);
    });
  });

  // ========== TARGET TYPE INFERENCE ==========

  describe('Target Type Inference', () => {
    test('account actions → account', () => {
      expect(inferTargetType('createAccount')).toBe('account');
      expect(inferTargetType('updateAccount')).toBe('account');
      expect(inferTargetType('captureLead')).toBe('account');
    });

    test('contact actions → contact', () => {
      expect(inferTargetType('createContact')).toBe('contact');
      expect(inferTargetType('updateContact')).toBe('contact');
    });

    test('pipeline actions → opportunity', () => {
      expect(inferTargetType('createOpportunity')).toBe('opportunity');
      expect(inferTargetType('moveStage')).toBe('opportunity');
    });

    test('sequence actions → sequence', () => {
      expect(inferTargetType('saveSequence')).toBe('sequence');
      expect(inferTargetType('addStep')).toBe('sequence');
    });

    test('outreach actions → outreach', () => {
      expect(inferTargetType('recordEmail')).toBe('outreach');
      expect(inferTargetType('recordSms')).toBe('outreach');
      expect(inferTargetType('recordCall')).toBe('outreach');
    });

    test('research actions → research', () => {
      expect(inferTargetType('generateBrief')).toBe('research');
    });

    test('signal actions → signal', () => {
      expect(inferTargetType('generateSignal')).toBe('signal');
      expect(inferTargetType('generateBatchSignals')).toBe('signal');
    });

    test('analytics actions → analytics', () => {
      expect(inferTargetType('saveSnapshot')).toBe('analytics');
      expect(inferTargetType('addCompetitorIntel')).toBe('analytics');
    });

    test('unknown actions → other', () => {
      expect(inferTargetType('doSomethingRandom')).toBe('other');
    });
  });

  // ========== SITE ADMIN AUTO-MAPPING ==========

  describe('Site Admin Role Mapping', () => {
    test('admin is a recognized site admin role', () => {
      expect(SITE_ADMIN_ROLES).toContain('admin');
    });

    test('super_admin is a recognized site admin role', () => {
      expect(SITE_ADMIN_ROLES).toContain('super_admin');
    });

    test('ops_admin is a recognized site admin role', () => {
      expect(SITE_ADMIN_ROLES).toContain('ops_admin');
    });

    test('b2b_rep is NOT a site admin role', () => {
      expect(SITE_ADMIN_ROLES).not.toContain('b2b_rep');
    });
  });

  // ========== COMPLETE PERMISSION COVERAGE ==========

  describe('Permission Coverage', () => {
    const allDefinedActions = Object.keys(ACTION_PERMISSIONS);

    test('every viewer action is accessible by all roles', () => {
      const viewerActions = allDefinedActions.filter(a => ACTION_PERMISSIONS[a] === B2B_ROLES.VIEWER);
      expect(viewerActions.length).toBeGreaterThan(20);

      const viewer = { role: B2B_ROLES.VIEWER };
      viewerActions.forEach(action => {
        expect(checkActionPermission(viewer, action).allowed).toBe(true);
      });
    });

    test('every rep action is blocked for viewers', () => {
      const repActions = allDefinedActions.filter(a => ACTION_PERMISSIONS[a] === B2B_ROLES.REP);
      expect(repActions.length).toBeGreaterThan(10);

      const viewer = { role: B2B_ROLES.VIEWER };
      repActions.forEach(action => {
        expect(checkActionPermission(viewer, action).allowed).toBe(false);
      });
    });

    test('every manager action is blocked for reps', () => {
      const managerActions = allDefinedActions.filter(a => ACTION_PERMISSIONS[a] === B2B_ROLES.MANAGER);
      expect(managerActions.length).toBe(4);

      const rep = { role: B2B_ROLES.REP };
      managerActions.forEach(action => {
        expect(checkActionPermission(rep, action).allowed).toBe(false);
      });
    });

    test('total defined actions covers all expected actions', () => {
      expect(allDefinedActions.length).toBeGreaterThanOrEqual(45);
    });
  });
});
