# Testing Implementation: Reverse Matching Engine

## 1. Testing Philosophy

This track follows **strict Test-Driven Development (TDD)**:

1. **Red**: Write failing tests that define expected behavior
2. **Green**: Write minimum code to make tests pass
3. **Refactor**: Improve code while keeping tests green

**Every task in plan.md starts with writing tests before implementation.**

---

## 2. Test File Structure

```
src/
├── backend/
│   ├── driverScoring.js              # Pure scoring functions
│   ├── driverScoring.test.js         # Unit tests for scoring
│   ├── driverMatching.jsw            # Main matching engine
│   ├── driverMatching.test.js        # Unit tests for matching
│   ├── carrierPreferences.jsw        # Hiring criteria CRUD
│   ├── carrierPreferences.test.js    # Unit tests for preferences
│   ├── subscriptionService.jsw       # Tier/quota management
│   ├── subscriptionService.test.js   # Unit tests for subscriptions
│   ├── driverOutreach.jsw            # Contact/pipeline actions
│   ├── driverOutreach.test.js        # Unit tests for outreach
│   └── __snapshots__/
│       └── driverMatching.test.js.snap  # Snapshot for match results
│
├── test/
│   ├── utils.js                      # Shared test utilities (exists)
│   ├── fixtures/
│   │   ├── drivers.js                # Mock driver profiles
│   │   ├── carriers.js               # Mock carrier data
│   │   ├── preferences.js            # Mock hiring preferences
│   │   └── subscriptions.js          # Mock subscription data
│   └── integration/
│       └── reverseMatching.integration.test.js
```

---

## 3. Test Categories

### 3.1 Unit Tests

#### driverScoring.test.js

```javascript
// Test structure for scoring module
describe('Driver Scoring Module', () => {

  describe('scoreQualifications', () => {
    it('should return 100 when driver has all required CDL types', () => {});
    it('should return 0 when driver lacks required CDL type', () => {});
    it('should score partial endorsement matches proportionally', () => {});
    it('should penalize drivers with violations', () => {});
    it('should handle missing CDL data gracefully', () => {});
  });

  describe('scoreExperience', () => {
    it('should return 100 when experience exceeds requirement', () => {});
    it('should return 0 when experience is below minimum', () => {});
    it('should score proportionally for near-match experience', () => {});
    it('should bonus drivers with specific equipment experience', () => {});
  });

  describe('scoreLocation', () => {
    it('should return 100 for exact ZIP match', () => {});
    it('should return 0 when outside max radius', () => {});
    it('should calculate distance-based score within radius', () => {});
    it('should handle multiple terminal locations', () => {});
  });

  describe('scoreAvailability', () => {
    it('should return 100 for immediate availability', () => {});
    it('should return 70 for 2-week notice', () => {});
    it('should return 50 for 30-day notice', () => {});
    it('should match urgency preferences', () => {});
  });

  describe('scoreSalaryFit', () => {
    it('should return 100 when offer exceeds driver expectation', () => {});
    it('should return 0 when offer is far below expectation', () => {});
    it('should score proportionally for near-match salaries', () => {});
  });

  describe('scoreEngagement', () => {
    it('should bonus recently active drivers', () => {});
    it('should penalize inactive drivers', () => {});
    it('should factor in response rate', () => {});
  });

  describe('calculateDriverMatchScore', () => {
    it('should calculate weighted overall score', () => {});
    it('should respect custom weights', () => {});
    it('should generate match rationale', () => {});
    it('should handle missing driver fields', () => {});
    it('should handle missing preference fields', () => {});
  });

  describe('generateDriverMatchRationale', () => {
    it('should explain qualification matches', () => {});
    it('should explain location proximity', () => {});
    it('should note experience strengths', () => {});
    it('should flag potential concerns', () => {});
  });
});
```

#### carrierPreferences.test.js

```javascript
describe('Carrier Preferences Service', () => {

  describe('createHiringPreferences', () => {
    it('should create preferences with valid data', () => {});
    it('should reject if user not logged in', () => {});
    it('should reject if user not authorized for carrier', () => {});
    it('should validate required fields', () => {});
    it('should set default values for optional fields', () => {});
  });

  describe('updateHiringPreferences', () => {
    it('should update existing preferences', () => {});
    it('should reject unauthorized updates', () => {});
    it('should validate field types', () => {});
    it('should track update timestamp', () => {});
  });

  describe('getHiringPreferences', () => {
    it('should return preferences for carrier', () => {});
    it('should return null if none exist', () => {});
    it('should only return active preferences', () => {});
  });

  describe('deactivateHiringPreferences', () => {
    it('should soft-delete preferences', () => {});
    it('should reject unauthorized deactivation', () => {});
  });
});
```

#### subscriptionService.test.js

```javascript
describe('Subscription Service', () => {

  describe('getSubscription', () => {
    it('should return active subscription for carrier', () => {});
    it('should return free tier if no subscription', () => {});
    it('should handle expired subscriptions', () => {});
  });

  describe('checkViewQuota', () => {
    it('should return true when quota available', () => {});
    it('should return false when quota exhausted', () => {});
    it('should return unlimited for enterprise tier', () => {});
    it('should reset quota on billing cycle', () => {});
  });

  describe('recordProfileView', () => {
    it('should increment view count', () => {});
    it('should track view details', () => {});
    it('should not count duplicate views same day', () => {});
    it('should reject if quota exhausted', () => {});
  });

  describe('getUsageStats', () => {
    it('should return current period usage', () => {});
    it('should calculate remaining quota', () => {});
    it('should include days until reset', () => {});
  });

  describe('Tier Enforcement', () => {
    it('should block search for free tier', () => {});
    it('should allow search for pro tier', () => {});
    it('should allow unlimited for enterprise', () => {});
    it('should enforce view limits per tier', () => {});
  });
});
```

#### driverMatching.test.js

```javascript
describe('Driver Matching Service', () => {

  describe('findMatchingDrivers', () => {
    it('should return drivers matching criteria', () => {});
    it('should sort by match score descending', () => {});
    it('should respect subscription tier limits', () => {});
    it('should exclude non-searchable drivers', () => {});
    it('should exclude drivers with visibility=hidden', () => {});
    it('should filter by CDL type', () => {});
    it('should filter by endorsements', () => {});
    it('should filter by location radius', () => {});
    it('should filter by experience years', () => {});
    it('should filter by availability', () => {});
    it('should handle empty results gracefully', () => {});
  });

  describe('getDriverProfile', () => {
    it('should return full profile for paid tier', () => {});
    it('should reject for free tier', () => {});
    it('should decrement view quota', () => {});
    it('should reject when quota exhausted', () => {});
    it('should mask PII for limited visibility drivers', () => {});
    it('should track view in CarrierDriverViews', () => {});
  });

  describe('Access Control', () => {
    it('should reject unauthenticated requests', () => {});
    it('should reject non-recruiter users', () => {});
    it('should verify carrier authorization', () => {});
  });

  describe('Mutual Match Detection', () => {
    it('should flag drivers who expressed interest', () => {});
    it('should boost score for mutual interest', () => {});
    it('should include mutual match in rationale', () => {});
  });
});
```

#### driverOutreach.test.js

```javascript
describe('Driver Outreach Service', () => {

  describe('saveToRecruiterPipeline', () => {
    it('should add driver to recruiter pipeline', () => {});
    it('should prevent duplicate saves', () => {});
    it('should require profile view first', () => {});
  });

  describe('sendMessage', () => {
    it('should create message record', () => {});
    it('should notify driver', () => {});
    it('should require paid subscription', () => {});
    it('should validate message content', () => {});
  });

  describe('scheduleCall', () => {
    it('should create call request', () => {});
    it('should notify driver', () => {});
    it('should integrate with calendly', () => {});
  });

  describe('markAsContacted', () => {
    it('should update outreach status', () => {});
    it('should track contact method', () => {});
    it('should update driver pipeline status', () => {});
  });

  describe('getOutreachHistory', () => {
    it('should return all outreach for carrier', () => {});
    it('should filter by status', () => {});
    it('should include driver details', () => {});
  });
});
```

### 3.2 Integration Tests

#### reverseMatching.integration.test.js

```javascript
describe('Reverse Matching Integration', () => {

  describe('End-to-End Flow: Pro Subscriber', () => {
    it('should complete full search → view → contact flow', async () => {
      // 1. Create carrier with Pro subscription
      // 2. Set hiring preferences
      // 3. Search driver pool
      // 4. View top match profile (uses quota)
      // 5. Send message to driver
      // 6. Verify all records created
    });
  });

  describe('End-to-End Flow: Free User', () => {
    it('should allow seeing interest count but block search', async () => {
      // 1. Create carrier with free tier
      // 2. Verify can see "X drivers interested"
      // 3. Verify search returns upgrade prompt
      // 4. Verify profile view blocked
    });
  });

  describe('Quota Enforcement', () => {
    it('should block views when quota exhausted', async () => {
      // 1. Create carrier with Pro (25 views)
      // 2. Use all 25 views
      // 3. Attempt 26th view
      // 4. Verify rejection with upgrade prompt
    });
  });

  describe('Mutual Match Priority', () => {
    it('should surface mutual matches first', async () => {
      // 1. Driver expresses interest in carrier
      // 2. Carrier searches driver pool
      // 3. Verify interested driver appears with boost
      // 4. Verify "mutual interest" flag in results
    });
  });
});
```

### 3.3 Snapshot Tests

```javascript
describe('Driver Matching Snapshots', () => {

  it('should match expected structure for Pro tier results', () => {
    const result = findMatchingDrivers(mockPreferences, mockDrivers, 'pro');
    expect(result).toMatchSnapshot();
  });

  it('should match expected structure for match rationale', () => {
    const rationale = generateDriverMatchRationale(mockScores, mockDriver, mockPrefs);
    expect(rationale).toMatchSnapshot();
  });
});
```

---

## 4. Test Fixtures

### 4.1 drivers.js

```javascript
export const mockDrivers = [
  {
    _id: 'driver-001',
    _owner: 'member-001',
    display_name: 'John Doe',
    email: 'john@example.com',
    phone: '555-0101',
    home_zip: '75201',
    cdl_class: 'A',
    endorsements: ['hazmat', 'tanker', 'doubles'],
    years_experience: 7,
    equipment_experience: ['Dry Van', 'Reefer', 'Tanker'],
    preferred_route_type: 'OTR',
    min_cpm_expectation: 0.55,
    availability: 'immediate',
    is_searchable: true,
    visibility_level: 'full',
    is_verified: true,
    last_active_date: new Date(),
    profile_completeness_score: 95
  },
  {
    _id: 'driver-002',
    _owner: 'member-002',
    display_name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '555-0102',
    home_zip: '75202',
    cdl_class: 'A',
    endorsements: ['hazmat'],
    years_experience: 4,
    equipment_experience: ['Dry Van', 'Reefer'],
    preferred_route_type: 'Regional',
    min_cpm_expectation: 0.52,
    availability: '2_week',
    is_searchable: true,
    visibility_level: 'full',
    is_verified: true,
    last_active_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    profile_completeness_score: 80
  },
  {
    _id: 'driver-003',
    _owner: 'member-003',
    display_name: 'Bob Wilson',
    email: 'bob@example.com',
    phone: '555-0103',
    home_zip: '90210', // Far away
    cdl_class: 'B',
    endorsements: [],
    years_experience: 2,
    equipment_experience: ['Box Truck'],
    preferred_route_type: 'Local',
    min_cpm_expectation: 0.45,
    availability: '30_day',
    is_searchable: true,
    visibility_level: 'limited',
    is_verified: false,
    last_active_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    profile_completeness_score: 60
  },
  {
    _id: 'driver-004',
    _owner: 'member-004',
    display_name: 'Hidden Driver',
    is_searchable: false, // Opted out
    visibility_level: 'hidden'
  }
];

export const mockDriverWithInterest = {
  ...mockDrivers[0],
  _id: 'driver-interested',
  hasExpressedInterest: true,
  interestDate: new Date()
};
```

### 4.2 preferences.js

```javascript
export const mockHiringPreferences = {
  _id: 'pref-001',
  carrier_dot: '123456',
  recruiter_id: 'recruiter-001',
  required_cdl_types: ['A'],
  required_endorsements: ['hazmat', 'tanker'],
  min_experience_years: 3,
  max_experience_years: null,
  target_zip_codes: ['75201', '75202', '75203'],
  target_radius_miles: 100,
  target_states: ['TX', 'OK'],
  offered_pay_min: 0.52,
  offered_pay_max: 0.62,
  route_types: ['OTR', 'Regional'],
  equipment_types: ['Dry Van', 'Reefer', 'Tanker'],
  urgency: 'immediate',
  positions_open: 5,
  is_active: true
};

export const mockMinimalPreferences = {
  _id: 'pref-002',
  carrier_dot: '789012',
  recruiter_id: 'recruiter-002',
  required_cdl_types: ['A'],
  target_radius_miles: 200,
  is_active: true
};
```

### 4.3 subscriptions.js

```javascript
export const mockSubscriptions = {
  free: {
    _id: 'sub-free',
    carrier_dot: '111111',
    plan_type: 'free',
    monthly_view_quota: 0,
    views_used_this_month: 0,
    is_active: true
  },
  pro: {
    _id: 'sub-pro',
    carrier_dot: '222222',
    plan_type: 'pro',
    monthly_view_quota: 25,
    views_used_this_month: 18,
    quota_reset_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    stripe_customer_id: 'cus_xxx',
    stripe_subscription_id: 'sub_xxx',
    is_active: true
  },
  proExhausted: {
    _id: 'sub-pro-exhausted',
    carrier_dot: '333333',
    plan_type: 'pro',
    monthly_view_quota: 25,
    views_used_this_month: 25, // Used all
    quota_reset_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    is_active: true
  },
  enterprise: {
    _id: 'sub-enterprise',
    carrier_dot: '444444',
    plan_type: 'enterprise',
    monthly_view_quota: -1, // Unlimited
    views_used_this_month: 150,
    is_active: true
  }
};
```

---

## 5. Mock Utilities

### Extended createMockQuery

Add to `src/test/utils.js`:

```javascript
/**
 * Create mock query with advanced filtering simulation
 */
export function createMockQueryWithFilters(items, options = {}) {
  const { totalCount = items.length } = options;
  let filteredItems = [...items];
  let appliedFilters = [];

  const mockQuery = {
    eq: jest.fn((field, value) => {
      appliedFilters.push({ type: 'eq', field, value });
      filteredItems = filteredItems.filter(item => item[field] === value);
      return mockQuery;
    }),
    ne: jest.fn((field, value) => {
      appliedFilters.push({ type: 'ne', field, value });
      filteredItems = filteredItems.filter(item => item[field] !== value);
      return mockQuery;
    }),
    hasSome: jest.fn((field, values) => {
      appliedFilters.push({ type: 'hasSome', field, values });
      filteredItems = filteredItems.filter(item =>
        values.some(v =>
          Array.isArray(item[field])
            ? item[field].includes(v)
            : item[field] === v
        )
      );
      return mockQuery;
    }),
    hasAll: jest.fn((field, values) => {
      appliedFilters.push({ type: 'hasAll', field, values });
      filteredItems = filteredItems.filter(item =>
        Array.isArray(item[field]) && values.every(v => item[field].includes(v))
      );
      return mockQuery;
    }),
    ge: jest.fn((field, value) => {
      appliedFilters.push({ type: 'ge', field, value });
      filteredItems = filteredItems.filter(item => item[field] >= value);
      return mockQuery;
    }),
    le: jest.fn((field, value) => {
      appliedFilters.push({ type: 'le', field, value });
      filteredItems = filteredItems.filter(item => item[field] <= value);
      return mockQuery;
    }),
    ascending: jest.fn((field) => {
      filteredItems.sort((a, b) => a[field] - b[field]);
      return mockQuery;
    }),
    descending: jest.fn((field) => {
      filteredItems.sort((a, b) => b[field] - a[field]);
      return mockQuery;
    }),
    limit: jest.fn((n) => {
      filteredItems = filteredItems.slice(0, n);
      return mockQuery;
    }),
    skip: jest.fn((n) => {
      filteredItems = filteredItems.slice(n);
      return mockQuery;
    }),
    find: jest.fn(() => Promise.resolve({
      items: filteredItems,
      totalCount,
      length: filteredItems.length,
      hasNext: () => false,
      appliedFilters // For test assertions
    })),
    count: jest.fn(() => Promise.resolve(filteredItems.length))
  };

  return mockQuery;
}
```

---

## 6. Coverage Requirements

| Module | Minimum Coverage |
|--------|------------------|
| `driverScoring.js` | 95% |
| `driverMatching.jsw` | 90% |
| `carrierPreferences.jsw` | 90% |
| `subscriptionService.jsw` | 95% |
| `driverOutreach.jsw` | 85% |

### Running Coverage

```bash
# Run with coverage
CI=true npm test -- --coverage --collectCoverageFrom='src/backend/driver*.{js,jsw}' --collectCoverageFrom='src/backend/*Subscription*.{js,jsw}' --collectCoverageFrom='src/backend/carrier*.{js,jsw}'

# Generate HTML report
CI=true npm test -- --coverage --coverageReporters=html
```

---

## 7. Test Commands

```bash
# Run all reverse matching tests
CI=true npm test -- --testPathPattern='driver|subscription|carrierPreferences|Outreach'

# Run specific test file
CI=true npm test -- src/backend/driverScoring.test.js

# Run in watch mode (development)
npm test -- --watch --testPathPattern='driverScoring'

# Run with verbose output
CI=true npm test -- --verbose --testPathPattern='driverMatching'

# Update snapshots
CI=true npm test -- --updateSnapshot --testPathPattern='driverMatching'
```

---

## 8. Continuous Integration

Tests should run on every commit. Add to CI pipeline:

```yaml
# .github/workflows/test.yml (example)
test-reverse-matching:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: CI=true npm test -- --coverage --testPathPattern='driver|subscription|carrierPreferences'
    - name: Check coverage threshold
      run: |
        COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
        if (( $(echo "$COVERAGE < 85" | bc -l) )); then
          echo "Coverage $COVERAGE% is below 85% threshold"
          exit 1
        fi
```

---

## 9. Testing Checklist

Before marking any phase complete:

- [ ] All unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Coverage meets requirements (>85%)
- [ ] Snapshots updated if structure changed
- [ ] Edge cases covered (null, undefined, empty arrays)
- [ ] Error cases covered (auth failures, validation errors)
- [ ] Mock data is realistic and comprehensive
- [ ] No flaky tests (run 3x to verify)
