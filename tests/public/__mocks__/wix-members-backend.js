/**
 * Mock for wix-members-backend module
 * Used in Jest tests to simulate Wix Members API
 */

// Mock current member data
let mockCurrentMember = null;

const currentMember = {
  getMember: jest.fn(async (options = {}) => {
    return mockCurrentMember;
  }),

  // Test helper to set current member
  __setMember: (member) => {
    mockCurrentMember = member;
  },

  // Test helper to clear current member
  __clearMember: () => {
    mockCurrentMember = null;
  }
};

// Authentication mock
const authentication = {
  getMemberByEmail: jest.fn(async (email) => {
    return null;
  }),

  register: jest.fn(async (email, password, options = {}) => {
    return {
      member: {
        _id: `member_${Date.now()}`,
        loginEmail: email,
        status: 'APPROVED'
      },
      approvalToken: null
    };
  }),

  login: jest.fn(async (email, password) => {
    return {
      member: {
        _id: `member_${Date.now()}`,
        loginEmail: email
      },
      sessionToken: `session_${Date.now()}`
    };
  }),

  logout: jest.fn(async () => {
    return;
  })
};

// Members mock
const members = {
  getMember: jest.fn(async (memberId, options = {}) => {
    return {
      _id: memberId,
      loginEmail: 'test@example.com',
      contactDetails: {
        firstName: 'Test',
        lastName: 'User',
        customFields: {}
      }
    };
  }),

  listMembers: jest.fn(async (options = {}) => {
    return {
      members: [],
      metadata: { count: 0 }
    };
  }),

  queryMembers: jest.fn(() => {
    return {
      eq: jest.fn().mockReturnThis(),
      find: jest.fn(async () => ({ items: [], totalCount: 0 }))
    };
  })
};

module.exports = {
  currentMember,
  authentication,
  members
};
