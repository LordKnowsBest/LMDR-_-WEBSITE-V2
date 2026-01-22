/**
 * Jest Setup File
 * Runs before all tests to configure the test environment
 */

// Import mocks
const wixData = require('./__mocks__/wix-data');
const wixMembersBackend = require('./__mocks__/wix-members-backend');

// Reset all data before each test
beforeEach(() => {
  // Clear mock data stores
  wixData.__resetAll();

  // Clear mock member
  wixMembersBackend.currentMember.__clearMember();

  // Clear all mock function calls
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  // Generate a mock driver profile
  createMockDriver: (overrides = {}) => ({
    _id: `driver_${Date.now()}`,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '555-123-4567',
    cdl_class: 'A',
    cdl_state: 'TX',
    years_experience: 5,
    status: 'active',
    _owner: `member_${Date.now()}`,
    ...overrides
  }),

  // Generate a mock carrier
  createMockCarrier: (overrides = {}) => ({
    _id: `carrier_${Date.now()}`,
    company_name: 'Test Trucking Co',
    dot_number: 1234567,
    mc_number: 987654,
    contact_email: 'contact@testtruck.com',
    contact_phone: '555-987-6543',
    fleet_size: 50,
    ...overrides
  }),

  // Generate a mock recruiter
  createMockRecruiter: (overrides = {}) => ({
    _id: `recruiter_${Date.now()}`,
    member_id: `member_${Date.now()}`,
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane.smith@recruiting.com',
    carrier_ids: [],
    ...overrides
  }),

  // Generate a mock workflow
  createMockWorkflow: (overrides = {}) => ({
    _id: `workflow_${Date.now()}`,
    driver_id: `driver_${Date.now()}`,
    carrier_id: `carrier_${Date.now()}`,
    recruiter_id: `recruiter_${Date.now()}`,
    status: 'PENDING',
    created_date: new Date(),
    updated_date: new Date(),
    ...overrides
  }),

  // Generate a mock document request
  createMockDocumentRequest: (overrides = {}) => ({
    _id: `doc_${Date.now()}`,
    workflow_id: `workflow_${Date.now()}`,
    driver_id: `driver_${Date.now()}`,
    document_type: 'cdl_front',
    display_name: 'CDL (Front)',
    status: 'REQUESTED',
    is_required: true,
    created_date: new Date(),
    ...overrides
  }),

  // Wait helper for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  // Seed test data helper
  seedTestData: async (collections) => {
    for (const [collectionName, items] of Object.entries(collections)) {
      wixData.__seedData(collectionName, items);
    }
  }
};

// Console log filtering (optional - reduces noise in tests)
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

if (process.env.SUPPRESS_CONSOLE !== 'false') {
  console.log = jest.fn();
  console.warn = jest.fn();
  // Keep console.error for actual errors
}

// Restore console after all tests
afterAll(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});
