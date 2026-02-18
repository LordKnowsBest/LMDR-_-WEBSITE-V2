// ============================================================================
// TCPA GUARD - Quiet Hours Enforcement
// Plain .js (not .jsw) to avoid async wrapping
// ============================================================================

/**
 * TCPA quiet hours: calls/texts only allowed 9 AM - 8 PM in target timezone.
 * Defaults to America/Chicago (Central Time) per FCC guidance.
 */

/**
 * Check if outbound contact is currently allowed
 * @param {string} timezone - IANA timezone (default: 'America/Chicago')
 * @returns {boolean} true if within allowed calling window
 */
export function isTCPACompliant(timezone = 'America/Chicago') {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false
    });
    const hour = parseInt(formatter.format(now), 10);
    return hour >= 9 && hour < 20; // 9 AM - 8 PM
  } catch (err) {
    // If timezone parsing fails, default to conservative block
    console.warn('[tcpaGuard] Timezone parse error, blocking contact:', err.message);
    return false;
  }
}

/**
 * Get next allowed contact window
 * @param {string} timezone - IANA timezone
 * @returns {{ canSendAt: string, reason: string }}
 */
export function getNextAllowedWindow(timezone = 'America/Chicago') {
  if (isTCPACompliant(timezone)) {
    return { canSendAt: new Date().toISOString(), reason: 'Currently within allowed window' };
  }

  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false
    });
    const currentHour = parseInt(formatter.format(now), 10);

    // If before 9 AM, next window is today at 9 AM
    // If after 8 PM, next window is tomorrow at 9 AM
    let hoursUntilOpen;
    if (currentHour < 9) {
      hoursUntilOpen = 9 - currentHour;
    } else {
      // After 8 PM — next window is tomorrow 9 AM
      hoursUntilOpen = (24 - currentHour) + 9;
    }

    const canSendAt = new Date(now.getTime() + hoursUntilOpen * 60 * 60 * 1000);
    return {
      canSendAt: canSendAt.toISOString(),
      reason: `TCPA quiet hours — next window opens at 9:00 AM ${timezone}`
    };
  } catch (err) {
    return {
      canSendAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      reason: 'TCPA quiet hours — defaulting to 12h delay'
    };
  }
}
