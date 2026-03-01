// ai-matching-state.js
// Central browser-side state with global proxies for legacy HTML modules.

(function (root) {
  const state = {
    currentMatches: [],
    driverPrefs: {},
    userStatus: { loggedIn: false, isPremium: false, tier: 'free' },
    appliedCarrierDOTs: new Set(),
    mutualInterestMap: new Map(),
    pendingInterestCarrier: null,
    driverProfile: null,
    pendingApplicationData: null,
    currentSort: 'score',
    filterMutualOnly: false,
    allMatches: [],
    currentApplicationCarrier: null,
    appOcrTimeout: null,
    appProfileTimeout: null,
    uploadedFiles: {
      cdlFront: null,
      cdlBack: null,
      medCard: null,
      resume: null
    }
  };

  const proxiedKeys = Object.keys(state);

  proxiedKeys.forEach((key) => {
    Object.defineProperty(root, key, {
      configurable: true,
      enumerable: false,
      get: function () {
        return state[key];
      },
      set: function (value) {
        state[key] = value;
      }
    });
  });

  root.AIMatchingState = {
    get: function (key) {
      return state[key];
    },
    set: function (key, value) {
      state[key] = value;
      return value;
    },
    snapshot: function () {
      return state;
    },
    resetCoreState: function () {
      state.currentMatches = [];
      state.driverPrefs = {};
      state.userStatus = { loggedIn: false, isPremium: false, tier: 'free' };
      state.appliedCarrierDOTs = new Set();
      state.mutualInterestMap = new Map();
      state.pendingInterestCarrier = null;
      state.driverProfile = null;
      state.pendingApplicationData = null;
      state.currentSort = 'score';
      state.filterMutualOnly = false;
      state.allMatches = [];
    },
    resetApplicationState: function () {
      state.currentApplicationCarrier = null;
      state.appOcrTimeout = null;
      state.appProfileTimeout = null;
      state.uploadedFiles = {
        cdlFront: null,
        cdlBack: null,
        medCard: null,
        resume: null
      };
    }
  };
}(typeof globalThis !== 'undefined' ? globalThis : this));
