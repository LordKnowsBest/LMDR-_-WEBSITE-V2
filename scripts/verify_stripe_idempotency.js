// scripts/verify_stripe_idempotency.js

// Mock dataAccess
const dataAccess = {
  db: [],
  queryRecords: async function(collection, options) {
    if (collection !== 'stripeEvents') return { items: [] };
    const eventId = options.filters.event_id;
    const items = this.db.filter(item => item.event_id === eventId);
    return { items };
  },
  insertRecord: async function(collection, item) {
    if (collection === 'stripeEvents') {
      this.db.push(item);
    }
  }
};

const CONFIG = {
  stripeEventsKey: 'stripeEvents'
};

// --- COPIED FROM src/backend/stripeService.jsw ---

async function isEventProcessed(eventId) {
  try {
    const result = await dataAccess.queryRecords(CONFIG.stripeEventsKey, { filters: { event_id: eventId }, limit: 1, suppressAuth: true });
    return (result.items?.length || 0) > 0;
  } catch (e) { return false; }
}

async function logStripeEvent(eventId, eventType, data = {}) {
  try {
    await dataAccess.insertRecord(CONFIG.stripeEventsKey, { event_id: eventId, event_type: eventType, processed_at: new Date() }, { suppressAuth: true });
  } catch (e) { }
}

// --- END COPIED CODE ---

async function runTests() {
  console.log('Starting Stripe Idempotency Tests...');
  let passed = 0;
  let failed = 0;

  const eventId = 'evt_test_123';

  // Test 1: New Event (Should not be processed)
  const isProcessed1 = await isEventProcessed(eventId);
  if (isProcessed1 === false) {
    console.log('PASS: New event is not processed');
    passed++;
  } else {
    console.error('FAIL: New event should not be processed');
    failed++;
  }

  // Test 2: Log Event
  await logStripeEvent(eventId, 'checkout.session.completed', { status: 'success' });
  // Verify it's in the db
  if (dataAccess.db.find(item => item.event_id === eventId)) {
    console.log('PASS: Event logged successfully');
    passed++;
  } else {
    console.error('FAIL: Event was not logged');
    failed++;
  }

  // Test 3: Existing Event (Should be processed)
  const isProcessed2 = await isEventProcessed(eventId);
  if (isProcessed2 === true) {
    console.log('PASS: Existing event is processed');
    passed++;
  } else {
    console.error('FAIL: Existing event should be processed');
    failed++;
  }

  console.log(`\nSummary: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests();
