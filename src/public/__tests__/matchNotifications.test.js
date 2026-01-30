/**
 * Match Notifications Service - Logic Verification
 *
 * Tests notification preference handling, tier gating, SMS graceful degradation,
 * driver scanning logic, and notification logging.
 */

// =============================================================================
// REPLICATED LOGIC FROM matchNotifications.jsw
// =============================================================================

const NOTIFICATION_CHANNELS = {
  PROFILE_VIEWED: 'profile_viewed',
  CONTACTED: 'contacted',
  NEW_MATCH: 'new_match'
};

const NOTIFICATION_TYPES = {
  EMAIL: 'email',
  SMS: 'sms',
  IN_APP: 'in_app'
};

const DEFAULT_NOTIFICATION_PREFERENCES = {
  profile_viewed: true,
  contacted: true
};

function shouldNotifyDriver(preferences, channel) {
  const prefs = preferences || DEFAULT_NOTIFICATION_PREFERENCES;
  return !!prefs[channel];
}

function isEnterpriseTier(subscription) {
  if (!subscription) return false;
  const tier = (subscription.tier || subscription.plan || '').toLowerCase();
  return tier === 'enterprise';
}

function buildMatchDigest(matchingDrivers) {
  if (!matchingDrivers || matchingDrivers.length === 0) return null;
  return {
    count: matchingDrivers.length,
    topMatches: matchingDrivers
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5)
      .map(d => ({
        name: d.first_name ? `${d.first_name} ${(d.last_name || '').charAt(0)}.` : 'Driver',
        score: d.score || 0,
        experience: d.years_experience || 0,
        location: d.state || 'N/A'
      }))
  };
}

function filterNewSearchableDrivers(drivers, cutoffDate) {
  if (!drivers || !Array.isArray(drivers)) return [];
  const cutoff = new Date(cutoffDate).getTime();
  return drivers.filter(d => {
    if (!d.is_searchable) return false;
    const lastActive = new Date(d.last_active || d.last_active_date || 0).getTime();
    return lastActive > cutoff;
  });
}

function buildNotificationLog(data) {
  return {
    carrier_dot: data.carrier_dot || '',
    driver_id: data.driver_id || '',
    notification_type: data.notification_type || 'in_app',
    channel: data.channel || '',
    recipient_id: data.recipient_id || '',
    sent_at: data.sent_at || new Date().toISOString(),
    status: data.status || 'sent',
    error_message: data.error_message || '',
    metadata: typeof data.metadata === 'string' ? data.metadata : JSON.stringify(data.metadata || {})
  };
}

function validateNotificationPreferences(preferences) {
  if (!preferences || typeof preferences !== 'object') {
    return { valid: false, error: 'Preferences must be an object' };
  }
  const allowed = ['profile_viewed', 'contacted'];
  const keys = Object.keys(preferences);
  for (const key of keys) {
    if (!allowed.includes(key)) {
      return { valid: false, error: `Unknown preference key: ${key}` };
    }
    if (typeof preferences[key] !== 'boolean') {
      return { valid: false, error: `Preference ${key} must be boolean` };
    }
  }
  return { valid: true };
}

// SMS graceful degradation logic
function canSendSMS(secrets) {
  return !!(secrets.TWILIO_ACCOUNT_SID && secrets.TWILIO_AUTH_TOKEN && secrets.TWILIO_PHONE_NUMBER);
}

// =============================================================================
// TEST SUITE
// =============================================================================

describe('Match Notifications Service', () => {

  // ---------------------------------------------------------------------------
  // notifyDriverProfileViewed — preference handling
  // ---------------------------------------------------------------------------
  describe('notifyDriverProfileViewed - preference handling', () => {
    test('sends notification when profile_viewed preference is enabled', () => {
      const prefs = { profile_viewed: true, contacted: true };
      expect(shouldNotifyDriver(prefs, NOTIFICATION_CHANNELS.PROFILE_VIEWED)).toBe(true);
    });

    test('skips notification when profile_viewed preference is disabled', () => {
      const prefs = { profile_viewed: false, contacted: true };
      expect(shouldNotifyDriver(prefs, NOTIFICATION_CHANNELS.PROFILE_VIEWED)).toBe(false);
    });

    test('defaults to enabled when preferences are null', () => {
      expect(shouldNotifyDriver(null, NOTIFICATION_CHANNELS.PROFILE_VIEWED)).toBe(true);
    });

    test('defaults to enabled when preferences are undefined', () => {
      expect(shouldNotifyDriver(undefined, NOTIFICATION_CHANNELS.PROFILE_VIEWED)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // notifyDriverContacted — preference handling
  // ---------------------------------------------------------------------------
  describe('notifyDriverContacted - preference handling', () => {
    test('sends notification when contacted preference is enabled', () => {
      const prefs = { profile_viewed: true, contacted: true };
      expect(shouldNotifyDriver(prefs, NOTIFICATION_CHANNELS.CONTACTED)).toBe(true);
    });

    test('skips notification when contacted preference is disabled', () => {
      const prefs = { profile_viewed: true, contacted: false };
      expect(shouldNotifyDriver(prefs, NOTIFICATION_CHANNELS.CONTACTED)).toBe(false);
    });

    test('defaults to enabled when preferences not set', () => {
      expect(shouldNotifyDriver(null, NOTIFICATION_CHANNELS.CONTACTED)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // notifyCarrierNewMatches — Enterprise tier gating
  // ---------------------------------------------------------------------------
  describe('notifyCarrierNewMatches - Enterprise tier gating', () => {
    test('allows notification for Enterprise tier', () => {
      expect(isEnterpriseTier({ tier: 'enterprise' })).toBe(true);
    });

    test('allows notification for Enterprise tier (uppercase)', () => {
      expect(isEnterpriseTier({ tier: 'Enterprise' })).toBe(true);
    });

    test('allows notification when plan field used instead of tier', () => {
      expect(isEnterpriseTier({ plan: 'enterprise' })).toBe(true);
    });

    test('blocks notification for Pro tier', () => {
      expect(isEnterpriseTier({ tier: 'pro' })).toBe(false);
    });

    test('blocks notification for Free tier', () => {
      expect(isEnterpriseTier({ tier: 'free' })).toBe(false);
    });

    test('blocks notification for null subscription', () => {
      expect(isEnterpriseTier(null)).toBe(false);
    });

    test('blocks notification for undefined subscription', () => {
      expect(isEnterpriseTier(undefined)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // scanForNewMatchingDrivers — filtering logic
  // ---------------------------------------------------------------------------
  describe('scanForNewMatchingDrivers - filtering logic', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    test('includes drivers who became active in last 24 hours', () => {
      const drivers = [
        { is_searchable: true, last_active: now.toISOString(), first_name: 'John' },
        { is_searchable: true, last_active: twoDaysAgo.toISOString(), first_name: 'Old' }
      ];
      const result = filterNewSearchableDrivers(drivers, yesterday.toISOString());
      expect(result).toHaveLength(1);
      expect(result[0].first_name).toBe('John');
    });

    test('excludes non-searchable drivers even if recently active', () => {
      const drivers = [
        { is_searchable: false, last_active: now.toISOString(), first_name: 'Hidden' }
      ];
      const result = filterNewSearchableDrivers(drivers, yesterday.toISOString());
      expect(result).toHaveLength(0);
    });

    test('handles empty driver list', () => {
      const result = filterNewSearchableDrivers([], yesterday.toISOString());
      expect(result).toHaveLength(0);
    });

    test('handles null driver list', () => {
      const result = filterNewSearchableDrivers(null, yesterday.toISOString());
      expect(result).toHaveLength(0);
    });

    test('supports last_active_date field name', () => {
      const drivers = [
        { is_searchable: true, last_active_date: now.toISOString(), first_name: 'Alt' }
      ];
      const result = filterNewSearchableDrivers(drivers, yesterday.toISOString());
      expect(result).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Match digest builder
  // ---------------------------------------------------------------------------
  describe('buildMatchDigest', () => {
    test('returns null for empty array', () => {
      expect(buildMatchDigest([])).toBeNull();
    });

    test('returns null for null input', () => {
      expect(buildMatchDigest(null)).toBeNull();
    });

    test('builds digest with correct count', () => {
      const drivers = [
        { first_name: 'John', last_name: 'Doe', score: 85, years_experience: 5, state: 'TX' },
        { first_name: 'Jane', last_name: 'Smith', score: 92, years_experience: 8, state: 'CA' }
      ];
      const digest = buildMatchDigest(drivers);
      expect(digest.count).toBe(2);
      expect(digest.topMatches).toHaveLength(2);
    });

    test('sorts by score descending and limits to top 5', () => {
      const drivers = Array.from({ length: 8 }, (_, i) => ({
        first_name: `Driver${i}`, last_name: 'Test', score: (i + 1) * 10, state: 'TX'
      }));
      const digest = buildMatchDigest(drivers);
      expect(digest.topMatches).toHaveLength(5);
      expect(digest.topMatches[0].score).toBe(80);
      expect(digest.topMatches[4].score).toBe(40);
    });

    test('formats driver name correctly (first + last initial)', () => {
      const drivers = [{ first_name: 'John', last_name: 'Doe', score: 85, state: 'TX' }];
      const digest = buildMatchDigest(drivers);
      expect(digest.topMatches[0].name).toBe('John D.');
    });

    test('handles missing first_name', () => {
      const drivers = [{ score: 85, state: 'TX' }];
      const digest = buildMatchDigest(drivers);
      expect(digest.topMatches[0].name).toBe('Driver');
    });
  });

  // ---------------------------------------------------------------------------
  // sendMatchAlertSMS — graceful degradation
  // ---------------------------------------------------------------------------
  describe('sendMatchAlertSMS - graceful degradation', () => {
    test('returns false when Twilio secrets not configured', () => {
      expect(canSendSMS({})).toBe(false);
    });

    test('returns false when only SID is configured', () => {
      expect(canSendSMS({ TWILIO_ACCOUNT_SID: 'ACxxx' })).toBe(false);
    });

    test('returns false when auth token missing', () => {
      expect(canSendSMS({
        TWILIO_ACCOUNT_SID: 'ACxxx',
        TWILIO_PHONE_NUMBER: '+15555555555'
      })).toBe(false);
    });

    test('returns true when all Twilio secrets configured', () => {
      expect(canSendSMS({
        TWILIO_ACCOUNT_SID: 'ACxxx',
        TWILIO_AUTH_TOKEN: 'authxxx',
        TWILIO_PHONE_NUMBER: '+15555555555'
      })).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Notification logging to Airtable
  // ---------------------------------------------------------------------------
  describe('Notification logging', () => {
    test('builds correct log record structure', () => {
      const log = buildNotificationLog({
        carrier_dot: '123456',
        driver_id: 'driver_abc',
        notification_type: 'email',
        channel: 'new_match',
        recipient_id: 'carrier_xyz',
        status: 'sent'
      });

      expect(log.carrier_dot).toBe('123456');
      expect(log.driver_id).toBe('driver_abc');
      expect(log.notification_type).toBe('email');
      expect(log.channel).toBe('new_match');
      expect(log.recipient_id).toBe('carrier_xyz');
      expect(log.status).toBe('sent');
      expect(log.error_message).toBe('');
      expect(log.sent_at).toBeDefined();
    });

    test('defaults notification_type to in_app', () => {
      const log = buildNotificationLog({ channel: 'profile_viewed' });
      expect(log.notification_type).toBe('in_app');
    });

    test('serializes metadata object to JSON string', () => {
      const log = buildNotificationLog({
        metadata: { carrierName: 'Test Carrier', score: 85 }
      });
      const parsed = JSON.parse(log.metadata);
      expect(parsed.carrierName).toBe('Test Carrier');
      expect(parsed.score).toBe(85);
    });

    test('keeps metadata as-is when already a string', () => {
      const log = buildNotificationLog({ metadata: '{"test":true}' });
      expect(log.metadata).toBe('{"test":true}');
    });

    test('handles failed notification log', () => {
      const log = buildNotificationLog({
        carrier_dot: '123456',
        status: 'failed',
        error_message: 'Email delivery failed'
      });
      expect(log.status).toBe('failed');
      expect(log.error_message).toBe('Email delivery failed');
    });
  });

  // ---------------------------------------------------------------------------
  // Notification preference validation
  // ---------------------------------------------------------------------------
  describe('validateNotificationPreferences', () => {
    test('accepts valid preferences', () => {
      const result = validateNotificationPreferences({
        profile_viewed: true,
        contacted: false
      });
      expect(result.valid).toBe(true);
    });

    test('accepts partial preferences', () => {
      const result = validateNotificationPreferences({ profile_viewed: true });
      expect(result.valid).toBe(true);
    });

    test('rejects null preferences', () => {
      const result = validateNotificationPreferences(null);
      expect(result.valid).toBe(false);
    });

    test('rejects non-object preferences', () => {
      const result = validateNotificationPreferences('invalid');
      expect(result.valid).toBe(false);
    });

    test('rejects unknown preference keys', () => {
      const result = validateNotificationPreferences({ unknown_key: true });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('unknown_key');
    });

    test('rejects non-boolean values', () => {
      const result = validateNotificationPreferences({ profile_viewed: 'yes' });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('boolean');
    });
  });
});
