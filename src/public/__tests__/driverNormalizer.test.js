/* eslint-disable */
/**
 * UNIT TESTS: Driver Normalizer & Parsing Utilities
 * ==================================================
 * Tests the parsing utilities and normalizer functions used to convert
 * external driver sources (Legacy Leads, Applications, FB Campaign,
 * Scored Drivers) into the common shape expected by the scoring engine.
 *
 * @module public/__tests__/driverNormalizer.test.js
 */

// =============================================================================
// PARSING UTILITIES (copied from driverMatching.jsw for unit testing)
// =============================================================================

function parseCdlClass(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toUpperCase();
  const match = s.match(/(?:CLASS\s+)?([ABC])/);
  return match ? match[1] : null;
}

function parseFBCdlType(raw) {
  if (!raw) return null;
  const match = String(raw).trim().toLowerCase().match(/cdl_([abc])/);
  return match ? match[1].toUpperCase() : null;
}

function parseEndorsements(raw, flags = {}) {
  const result = [];
  if (raw && typeof raw === 'string') {
    const lower = raw.toLowerCase();
    if (lower.includes('hazmat') || lower.includes('haz')) result.push('H');
    if (lower.includes('tanker') || lower.includes('tank')) result.push('T');
    if (lower.includes('doubles') || lower.includes('triple')) result.push('T');
    if (lower.includes('passenger')) result.push('P');
    if (lower.includes('school')) result.push('S');
  }
  if (flags.has_hazmat === 1 || flags.has_hazmat === true) {
    if (!result.includes('H')) result.push('H');
  }
  if (flags.has_tanker === 1 || flags.has_tanker === true) {
    if (!result.includes('T')) result.push('T');
  }
  return result;
}

function parseYearsExperience(raw) {
  if (raw == null) return null;
  if (typeof raw === 'number') return raw;
  const s = String(raw);
  const moreMatch = s.match(/more\s+than\s+(\d+)/i);
  if (moreMatch) return parseInt(moreMatch[1], 10);
  const rangeMatch = s.match(/(\d+)\s*[-\u2013]\s*(\d+)/);
  if (rangeMatch) return parseInt(rangeMatch[1], 10);
  const simpleMatch = s.match(/(\d+)/);
  if (simpleMatch) return parseInt(simpleMatch[1], 10);
  return null;
}

function mapAvailabilityText(raw) {
  if (!raw) return null;
  const lower = String(raw).trim().toLowerCase();
  if (lower === 'immediate' || lower === 'yes' || lower === 'now') return 'immediate';
  if (lower.includes('7') || lower.includes('14') || lower.includes('2 week') || lower.includes('two week')) return '2_week';
  if (lower.includes('30') || lower.includes('month') || lower.includes('notice')) return '30_day';
  return null;
}

function parseFullName(fullName) {
  if (!fullName) return { firstName: '', lastName: '' };
  const parts = String(fullName).trim().split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || ''
  };
}

function cleanFBPhone(raw) {
  if (!raw) return null;
  return String(raw).replace(/^p:\s*/i, '').trim() || null;
}

// =============================================================================
// SOURCE CONSTANTS
// =============================================================================

const SOURCE_PRIORITY = {
  driver_profiles: 5, scored_drivers: 4, applications: 3,
  fb_campaign: 2, legacy_leads: 1
};

const SOURCE_LABELS = {
  driver_profiles: 'Profile', scored_drivers: 'Scored',
  applications: 'Application', fb_campaign: 'FB Campaign',
  legacy_leads: 'Legacy Lead'
};

// =============================================================================
// NORMALIZER FUNCTIONS (copied from driverMatching.jsw)
// =============================================================================

function normalizeLegacyLead(record) {
  return {
    _id: record._id || record.id || `legacy_${Date.now()}`,
    first_name: record['First Name'] || '',
    last_name: record['Last Name'] || '',
    email: record['Email 1'] || null,
    phone: record['Formatted Phone Number 1'] || record['Phone 1'] || null,
    cdl_class: null,
    endorsements: [],
    years_experience: null,
    home_zip: null,
    city: null,
    state: null,
    zip_code: null,
    availability: null,
    equipment_experience: [],
    last_active_date: record['Created At (UTC+0)'] || null,
    profile_completeness_score: 10,
    is_searchable: true,
    visibility_level: 'visible',
    _source: 'legacy_leads',
    _source_label: SOURCE_LABELS.legacy_leads,
    _source_priority: SOURCE_PRIORITY.legacy_leads
  };
}

function normalizeApplication(record) {
  const cdlRaw = record['CDL Class'];
  const endorseRaw = record['Endorsements?'];
  const yearsRaw = record['Years of Experience'] || record['YearsExpNum'];
  const availRaw = record['When can you start?'];
  const stateRaw = record['State of Issue'];

  return {
    _id: record._id || record.id || `app_${Date.now()}`,
    first_name: (record['First Name'] || '').trim(),
    last_name: (record['Last Name'] || '').trim(),
    email: record['Email'] || null,
    phone: record['Phone Number'] || null,
    cdl_class: parseCdlClass(cdlRaw),
    endorsements: parseEndorsements(endorseRaw, {
      has_hazmat: record['HasHazmatEndorsement'],
      has_tanker: record['HasTankerEndorsement']
    }),
    years_experience: parseYearsExperience(yearsRaw),
    home_zip: null,
    city: null,
    state: stateRaw || null,
    zip_code: null,
    availability: mapAvailabilityText(availRaw),
    equipment_experience: [],
    last_active_date: record['Submission Date'] || null,
    profile_completeness_score: 40,
    is_searchable: true,
    visibility_level: 'visible',
    _source: 'applications',
    _source_label: SOURCE_LABELS.applications,
    _source_priority: SOURCE_PRIORITY.applications
  };
}

function normalizeFBCampaign(record) {
  const fullNameRaw = record['full_name'] || '';
  const { firstName, lastName } = parseFullName(fullNameRaw);
  const cdlTypeRaw = record['what_type_of_cdl_do_you_currently_hold?'];
  const canStartRaw = record['are_you_able_to_start_within_the_next_7\u201314_days?'];
  const phoneRaw = record['Phone (E164)'] || record['phone'];

  return {
    _id: record._id || record.id || `fb_${Date.now()}`,
    first_name: firstName,
    last_name: lastName,
    email: record['email'] || null,
    phone: cleanFBPhone(phoneRaw),
    cdl_class: parseFBCdlType(cdlTypeRaw),
    endorsements: [],
    years_experience: null,
    home_zip: null,
    city: null,
    state: record['State (from Area Code)'] || null,
    zip_code: null,
    availability: canStartRaw && String(canStartRaw).toLowerCase() === 'yes' ? 'immediate' : '2_week',
    equipment_experience: [],
    last_active_date: record['created_time'] || null,
    profile_completeness_score: 20,
    is_searchable: true,
    visibility_level: 'visible',
    _source: 'fb_campaign',
    _source_label: SOURCE_LABELS.fb_campaign,
    _source_priority: SOURCE_PRIORITY.fb_campaign
  };
}

function normalizeScoredDriver(record) {
  const cdlRaw = record['cdl_class'];
  const endorseRaw = record['endorsements'];
  const yearsRaw = record['years_experience'];
  const availRaw = record['Start Date Availability'];

  return {
    _id: record._id || record['Driver ID'] || `scored_${Date.now()}`,
    first_name: (record['First name'] || '').trim(),
    last_name: (record['Last Name'] || '').trim(),
    email: record['Email'] || null,
    phone: record['Phone'] || null,
    cdl_class: parseCdlClass(cdlRaw),
    endorsements: parseEndorsements(endorseRaw),
    years_experience: parseYearsExperience(yearsRaw),
    home_zip: null,
    city: null,
    state: record['State of Issue'] || null,
    zip_code: null,
    availability: mapAvailabilityText(availRaw),
    equipment_experience: [],
    last_active_date: record['Last Date Modified'] || null,
    profile_completeness_score: 35,
    is_searchable: true,
    visibility_level: 'visible',
    _source: 'scored_drivers',
    _source_label: SOURCE_LABELS.scored_drivers,
    _source_priority: SOURCE_PRIORITY.scored_drivers
  };
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('Parsing Utilities', () => {

  describe('parseCdlClass', () => {
    it('parses "Class A" → "A"', () => {
      expect(parseCdlClass('Class A')).toBe('A');
    });

    it('parses "class c" (lowercase) → "C"', () => {
      expect(parseCdlClass('class c')).toBe('C');
    });

    it('parses bare letter "B" → "B"', () => {
      expect(parseCdlClass('B')).toBe('B');
    });

    it('returns null for null/undefined', () => {
      expect(parseCdlClass(null)).toBeNull();
      expect(parseCdlClass(undefined)).toBeNull();
    });

    it('returns null for unrecognizable input', () => {
      expect(parseCdlClass('Permit Only')).toBeNull();
    });
  });

  describe('parseFBCdlType', () => {
    it('parses "cdl_a" → "A"', () => {
      expect(parseFBCdlType('cdl_a')).toBe('A');
    });

    it('parses "cdl_b" → "B"', () => {
      expect(parseFBCdlType('cdl_b')).toBe('B');
    });

    it('returns null for null', () => {
      expect(parseFBCdlType(null)).toBeNull();
    });

    it('returns null for unrecognizable input', () => {
      expect(parseFBCdlType('other')).toBeNull();
    });
  });

  describe('parseEndorsements', () => {
    it('parses "Hazmat" → ["H"]', () => {
      expect(parseEndorsements('Hazmat')).toEqual(['H']);
    });

    it('parses "None" → []', () => {
      expect(parseEndorsements('None')).toEqual([]);
    });

    it('merges binary flags with text', () => {
      const result = parseEndorsements('None', { has_hazmat: 1, has_tanker: 0 });
      expect(result).toEqual(['H']);
    });

    it('deduplicates when text and flag both indicate hazmat', () => {
      const result = parseEndorsements('Hazmat', { has_hazmat: 1 });
      expect(result).toEqual(['H']);
    });

    it('handles null input', () => {
      expect(parseEndorsements(null)).toEqual([]);
    });

    it('handles tanker from text', () => {
      expect(parseEndorsements('Tanker')).toEqual(['T']);
    });
  });

  describe('parseYearsExperience', () => {
    it('parses "More than 10 years" → 10', () => {
      expect(parseYearsExperience('More than 10 years')).toBe(10);
    });

    it('parses "3-5 years" → 3', () => {
      expect(parseYearsExperience('3-5 years')).toBe(3);
    });

    it('parses "1 year" → 1', () => {
      expect(parseYearsExperience('1 year')).toBe(1);
    });

    it('returns number directly if already numeric', () => {
      expect(parseYearsExperience(5)).toBe(5);
    });

    it('returns null for null/undefined', () => {
      expect(parseYearsExperience(null)).toBeNull();
      expect(parseYearsExperience(undefined)).toBeNull();
    });
  });

  describe('mapAvailabilityText', () => {
    it('"Immediate" → "immediate"', () => {
      expect(mapAvailabilityText('Immediate')).toBe('immediate');
    });

    it('"yes" → "immediate"', () => {
      expect(mapAvailabilityText('yes')).toBe('immediate');
    });

    it('"30 days" → "30_day"', () => {
      expect(mapAvailabilityText('30 days')).toBe('30_day');
    });

    it('"2 weeks notice" → "2_week"', () => {
      expect(mapAvailabilityText('2 weeks notice')).toBe('2_week');
    });

    it('returns null for null', () => {
      expect(mapAvailabilityText(null)).toBeNull();
    });
  });

  describe('parseFullName', () => {
    it('"John Doe" → { firstName: "John", lastName: "Doe" }', () => {
      expect(parseFullName('John Doe')).toEqual({ firstName: 'John', lastName: 'Doe' });
    });

    it('"John" → { firstName: "John", lastName: "" }', () => {
      expect(parseFullName('John')).toEqual({ firstName: 'John', lastName: '' });
    });

    it('"John Michael Doe" → { firstName: "John", lastName: "Michael Doe" }', () => {
      expect(parseFullName('John Michael Doe')).toEqual({ firstName: 'John', lastName: 'Michael Doe' });
    });

    it('handles null', () => {
      expect(parseFullName(null)).toEqual({ firstName: '', lastName: '' });
    });
  });

  describe('cleanFBPhone', () => {
    it('removes "p:" prefix', () => {
      expect(cleanFBPhone('p:+15551234567')).toBe('+15551234567');
    });

    it('handles phone without prefix', () => {
      expect(cleanFBPhone('+15551234567')).toBe('+15551234567');
    });

    it('returns null for null', () => {
      expect(cleanFBPhone(null)).toBeNull();
    });
  });
});

describe('Normalizer Functions', () => {

  describe('normalizeLegacyLead', () => {
    it('normalizes a full Legacy Driver Leads record', () => {
      const record = {
        _id: 'rec123',
        'First Name': 'Howard',
        'Last Name': 'Stewart',
        'Email 1': 'howard@example.com',
        'Phone 1': '+15733554632',
        'Formatted Phone Number 1': '+15733554632',
        'Created At (UTC+0)': '12/1/21 13:06'
      };

      const result = normalizeLegacyLead(record);

      expect(result._id).toBe('rec123');
      expect(result.first_name).toBe('Howard');
      expect(result.last_name).toBe('Stewart');
      expect(result.email).toBe('howard@example.com');
      expect(result.phone).toBe('+15733554632');
      expect(result.cdl_class).toBeNull();
      expect(result.endorsements).toEqual([]);
      expect(result.profile_completeness_score).toBe(10);
      expect(result._source).toBe('legacy_leads');
      expect(result._source_label).toBe('Legacy Lead');
      expect(result._source_priority).toBe(1);
    });

    it('handles empty record without crashing', () => {
      const result = normalizeLegacyLead({});
      expect(result._source).toBe('legacy_leads');
      expect(result.first_name).toBe('');
      expect(result.email).toBeNull();
    });
  });

  describe('normalizeApplication', () => {
    it('normalizes a full Applications record', () => {
      const record = {
        _id: 'rec456',
        'First Name': 'Kenneth',
        'Last Name': 'Patterson',
        'Phone Number': '2812260482',
        'Email': 'ken@example.com',
        'CDL Class': 'Class A',
        'Years of Experience': 'More than 10 years',
        'State of Issue': 'Texas',
        'Endorsements?': 'Hazmat',
        'HasHazmatEndorsement': 1,
        'HasTankerEndorsement': 0,
        'When can you start?': 'Immediate',
        'Total_Score': 117,
        'Submission Date': '2025-10-06T18:36:18.793Z'
      };

      const result = normalizeApplication(record);

      expect(result._id).toBe('rec456');
      expect(result.first_name).toBe('Kenneth');
      expect(result.cdl_class).toBe('A');
      expect(result.years_experience).toBe(10);
      expect(result.endorsements).toEqual(['H']);
      expect(result.availability).toBe('immediate');
      expect(result.state).toBe('Texas');
      expect(result.profile_completeness_score).toBe(40);
      expect(result._source).toBe('applications');
      expect(result._source_label).toBe('Application');
    });

    it('handles "None" endorsements', () => {
      const record = { 'Endorsements?': 'None', 'HasHazmatEndorsement': 0, 'HasTankerEndorsement': 0 };
      const result = normalizeApplication(record);
      expect(result.endorsements).toEqual([]);
    });
  });

  describe('normalizeFBCampaign', () => {
    it('normalizes a full FB Campaign record', () => {
      const record = {
        _id: 'rec789',
        'full_name': 'Ramiro Aleman',
        'email': 'ramiro@example.com',
        'phone': 'p:+19568733317',
        'Phone (E164)': '+19568733317',
        'what_type_of_cdl_do_you_currently_hold?': 'cdl_a',
        'are_you_able_to_start_within_the_next_7\u201314_days?': 'yes',
        'created_time': '2025-10-27T22:45:04.000Z',
        'State (from Area Code)': 'TX'
      };

      const result = normalizeFBCampaign(record);

      expect(result.first_name).toBe('Ramiro');
      expect(result.last_name).toBe('Aleman');
      expect(result.email).toBe('ramiro@example.com');
      expect(result.phone).toBe('+19568733317');
      expect(result.cdl_class).toBe('A');
      expect(result.availability).toBe('immediate');
      expect(result.state).toBe('TX');
      expect(result.profile_completeness_score).toBe(20);
      expect(result._source).toBe('fb_campaign');
    });

    it('handles "no" for start availability', () => {
      const record = {
        'full_name': 'Test Driver',
        'are_you_able_to_start_within_the_next_7\u201314_days?': 'no'
      };
      const result = normalizeFBCampaign(record);
      expect(result.availability).toBe('2_week');
    });

    it('cleans phone with p: prefix', () => {
      const record = { 'phone': 'p: +15551234567' };
      const result = normalizeFBCampaign(record);
      expect(result.phone).toBe('+15551234567');
    });
  });

  describe('normalizeScoredDriver', () => {
    it('normalizes a full Scored Drivers record', () => {
      const record = {
        _id: 'recABC',
        'First name': 'Carl',
        'Last Name': 'Harris',
        'Email': 'carl@example.com',
        'Phone': '+12148767078',
        'cdl_class': 'Class C',
        'endorsements': 'None',
        'years_experience': 5,
        'State of Issue': 'TX',
        'Start Date Availability': 'Immediate',
        'Priority Score': 43,
        'Driver ID': 'driver123',
        'Last Date Modified': '2025-05-07T04:24:33.000Z'
      };

      const result = normalizeScoredDriver(record);

      expect(result.first_name).toBe('Carl');
      expect(result.last_name).toBe('Harris');
      expect(result.cdl_class).toBe('C');
      expect(result.years_experience).toBe(5);
      expect(result.endorsements).toEqual([]);
      expect(result.availability).toBe('immediate');
      expect(result.state).toBe('TX');
      expect(result.profile_completeness_score).toBe(35);
      expect(result._source).toBe('scored_drivers');
      expect(result._source_label).toBe('Scored');
    });

    it('uses Driver ID as fallback _id', () => {
      const record = { 'Driver ID': 'custom_id_123' };
      const result = normalizeScoredDriver(record);
      expect(result._id).toBe('custom_id_123');
    });
  });
});

describe('Deduplication Logic', () => {
  it('keeps higher-priority source when same email appears twice', () => {
    const drivers = [
      { _id: 'legacy1', email: 'john@example.com', _source: 'legacy_leads', _source_priority: 1 },
      { _id: 'app1', email: 'john@example.com', _source: 'applications', _source_priority: 3 },
      { _id: 'profile1', email: 'JOHN@EXAMPLE.COM', _source: 'driver_profiles', _source_priority: 5 }
    ];

    // Simulate dedup logic from queryAllDriverSources
    const emailMap = new Map();
    for (const driver of drivers) {
      const key = driver.email
        ? driver.email.toLowerCase().trim()
        : `__no_email_${driver._id}`;
      const existing = emailMap.get(key);
      if (!existing || (driver._source_priority || 0) > (existing._source_priority || 0)) {
        emailMap.set(key, driver);
      }
    }

    const deduped = Array.from(emailMap.values());
    expect(deduped.length).toBe(1);
    expect(deduped[0]._source).toBe('driver_profiles');
    expect(deduped[0]._id).toBe('profile1');
  });

  it('keeps drivers with null email as separate entries', () => {
    const drivers = [
      { _id: 'a1', email: null, _source: 'legacy_leads', _source_priority: 1 },
      { _id: 'a2', email: null, _source: 'fb_campaign', _source_priority: 2 }
    ];

    const emailMap = new Map();
    for (const driver of drivers) {
      const key = driver.email
        ? driver.email.toLowerCase().trim()
        : `__no_email_${driver._id}`;
      const existing = emailMap.get(key);
      if (!existing || (driver._source_priority || 0) > (existing._source_priority || 0)) {
        emailMap.set(key, driver);
      }
    }

    const deduped = Array.from(emailMap.values());
    expect(deduped.length).toBe(2);
  });
});
