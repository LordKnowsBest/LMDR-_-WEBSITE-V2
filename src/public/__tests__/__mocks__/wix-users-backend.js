/* eslint-disable */
/**
 * Mock for wix-users-backend module
 * Used in Jest tests to simulate Wix Users API
 */

let mockCurrentUser = null;

const currentUser = {
  id: null,
  loggedIn: false,
  role: 'Visitor'
};

const wixUsersBackend = {
  currentUser: {
    getUser: jest.fn(async () => mockCurrentUser),
    getRoles: jest.fn(async () => []),
    loggedIn: jest.fn(() => mockCurrentUser !== null)
  },

  getUser: jest.fn(async (userId) => {
    return {
      id: userId,
      loginEmail: 'test@example.com'
    };
  }),

  emailUser: jest.fn(async (subject, body, userId) => {
    return;
  }),

  // Test helpers
  __setCurrentUser: (user) => {
    mockCurrentUser = user;
  },

  __clearCurrentUser: () => {
    mockCurrentUser = null;
  }
};

module.exports = wixUsersBackend;
