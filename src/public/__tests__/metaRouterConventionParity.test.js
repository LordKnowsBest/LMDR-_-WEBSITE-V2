jest.mock('backend/aiRouterService', () => ({
  routeAIRequest: jest.fn()
}));

jest.mock('backend/agentConversationService', () => ({
  createConversation: jest.fn(),
  addTurn: jest.fn(),
  getRecentContext: jest.fn()
}));

jest.mock('backend/dataAccess', () => ({}));

jest.mock('backend/agentRunLedgerService', () => ({
  startRun: jest.fn(),
  logStep: jest.fn(),
  createGate: jest.fn(),
  resolveGate: jest.fn(),
  completeRun: jest.fn()
}));

const { ACTION_REGISTRY, ROUTER_DEFINITIONS } = require('backend/agentService');

const TARGET_ROUTERS = [
  'recruiter_paid_media',
  'recruiter_paid_media_analytics',
  'admin_meta_ads_governance',
  'cross_role_paid_media_pipeline'
];

describe('meta router convention parity', () => {
  test('router names follow snake_case and use action/params input schema', () => {
    for (const routerName of TARGET_ROUTERS) {
      expect(routerName).toMatch(/^[a-z0-9_]+$/);

      const routerDef = ROUTER_DEFINITIONS[routerName];
      expect(routerDef).toBeDefined();
      expect(routerDef.name).toBe(routerName);
      expect(routerDef.input_schema).toBeDefined();
      expect(routerDef.input_schema.type).toBe('object');
      expect(routerDef.input_schema.properties).toHaveProperty('action');
      expect(routerDef.input_schema.properties).toHaveProperty('params');
      expect(Array.isArray(routerDef.input_schema.properties.action.enum)).toBe(true);
    }
  });

  test('action names are snake_case and aligned between registry and router enum', () => {
    for (const routerName of TARGET_ROUTERS) {
      const actionRegistry = ACTION_REGISTRY[routerName] || {};
      const registryActions = Object.keys(actionRegistry);
      const enumActions =
        (ROUTER_DEFINITIONS[routerName] &&
          ROUTER_DEFINITIONS[routerName].input_schema &&
          ROUTER_DEFINITIONS[routerName].input_schema.properties &&
          ROUTER_DEFINITIONS[routerName].input_schema.properties.action &&
          ROUTER_DEFINITIONS[routerName].input_schema.properties.action.enum) || [];

      for (const action of registryActions) {
        expect(action).toMatch(/^[a-z0-9_]+$/);
        expect(enumActions).toContain(action);
      }
    }
  });
});
