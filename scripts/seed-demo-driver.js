#!/usr/bin/env node
/**
 * Seed demo driver data via Cloud Run API.
 * Uses collection keys (not table names) via POST /v1/:collection
 * Falls back to PUT /v1/:collection/:id if record already exists (409).
 *
 * Usage: node scripts/seed-demo-driver.js
 */

const API = process.env.LMDR_API_URL || 'https://lmdr-api-140035137711.us-central1.run.app';
const KEY = process.env.LMDR_INTERNAL_KEY || 'e4b9a8c0f8d0c0d1c2f0e2c3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3';

async function api(method, path, body) {
  const opts = {
    method,
    headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

/** Insert a record; if 409 conflict, update via PUT instead. */
async function upsert(collectionKey, record) {
  const { _id, ...rest } = record;
  let r = await api('POST', `/v1/${collectionKey}`, record);
  if (r.status === 409) {
    r = await api('PUT', `/v1/${collectionKey}/${_id}`, rest);
    console.log(`  PUT ${collectionKey}/${_id} → ${r.status} (updated)`);
  } else {
    console.log(`  POST ${collectionKey} → ${r.status}${r.status === 201 ? ' (created)' : ` ERROR: ${JSON.stringify(r.data)}`}`);
  }
  return r;
}

async function main() {
  const DRIVER_ID = 'demo-driver-001';
  const now = new Date().toISOString();

  console.log('\n=== Seeding Demo Driver: Marcus Thompson ===\n');

  // 1. Driver Profile
  console.log('1. Driver Profile');
  await upsert('driverProfiles', {
    _id: DRIVER_ID,
    data: {
      first_name: 'Marcus',
      last_name: 'Thompson',
      email: 'marcus.thompson@demo.lastmiledr.app',
      phone: '(555) 867-5309',
      city: 'Phoenix',
      state: 'AZ',
      zip_code: '85001',
      cdl_class: 'A',
      endorsements: 'Hazmat, Tanker, Doubles/Triples',
      years_experience: 8,
      preferred_route_type: 'OTR',
      preferred_truck_type: 'Dry Van',
      min_pay: 75000,
      is_discoverable: 'Yes',
      is_searchable: 'Yes',
      status: 'active',
      bio: 'Veteran OTR driver with 8 years and 900K+ safe miles. Hazmat and tanker endorsed. Looking for a carrier that values safety and home time.',
      clean_mvr: 'Yes',
      docs_complete: 'Yes',
      member_since: '2026-01-15',
      last_active: now,
    }
  });

  // 2. Carrier records for matching
  console.log('\n2. Carrier Records');
  const carriers = [
    { _id: 'carrier-swift-001', dot_number: '185775', company_name: 'Swift Transportation', city: 'Phoenix', state: 'AZ', equipment_types: 'Dry Van, Reefer, Flatbed', solo_pay_min: 65000, solo_pay_max: 92000, safety_rating: 'Satisfactory', driver_count: 23000 },
    { _id: 'carrier-werner-001', dot_number: '135113', company_name: 'Werner Enterprises', city: 'Omaha', state: 'NE', equipment_types: 'Dry Van, Reefer, Flatbed', solo_pay_min: 68000, solo_pay_max: 95000, safety_rating: 'Satisfactory', driver_count: 13000 },
    { _id: 'carrier-schneider-001', dot_number: '296820', company_name: 'Schneider National', city: 'Green Bay', state: 'WI', equipment_types: 'Dry Van, Intermodal, Bulk', solo_pay_min: 70000, solo_pay_max: 98000, safety_rating: 'Satisfactory', driver_count: 15000 },
    { _id: 'carrier-jbhunt-001', dot_number: '517076', company_name: 'J.B. Hunt Transport', city: 'Lowell', state: 'AR', equipment_types: 'Intermodal, Dry Van, Reefer', solo_pay_min: 72000, solo_pay_max: 100000, safety_rating: 'Satisfactory', driver_count: 18000 },
    { _id: 'carrier-heartland-001', dot_number: '370866', company_name: 'Heartland Express', city: 'North Liberty', state: 'IA', equipment_types: 'Dry Van', solo_pay_min: 60000, solo_pay_max: 85000, safety_rating: 'Satisfactory', driver_count: 5000 },
  ];
  for (const c of carriers) {
    await upsert('carriers', { _id: c._id, data: c });
  }

  // 3. Driver-carrier interests (applications)
  console.log('\n3. Driver Interests / Applications');
  const interests = [
    { _id: `int-${DRIVER_ID}-swift`, driver_id: DRIVER_ID, carrier_dot: '185775', carrier_name: 'Swift Transportation', status: 'applied', match_score: 94, created_at: '2026-03-08T10:00:00Z' },
    { _id: `int-${DRIVER_ID}-werner`, driver_id: DRIVER_ID, carrier_dot: '135113', carrier_name: 'Werner Enterprises', status: 'interviewing', match_score: 87, created_at: '2026-03-06T14:30:00Z' },
    { _id: `int-${DRIVER_ID}-schneider`, driver_id: DRIVER_ID, carrier_dot: '296820', carrier_name: 'Schneider National', status: 'saved', match_score: 79, created_at: '2026-03-09T09:15:00Z' },
  ];
  for (const i of interests) {
    await upsert('driverCarrierInterests', { _id: i._id, data: i });
  }

  // 4. Gamification progression
  console.log('\n4. Gamification');
  await upsert('driverProgression', {
    _id: `prog-${DRIVER_ID}`,
    data: {
      driver_id: DRIVER_ID,
      total_xp: 310,
      level: 3,
      level_title: 'Mile Maker',
      login_streak: 5,
      longest_streak: 12,
      last_activity: now,
      badges_earned: 4,
    }
  });

  const gamEvents = [
    { _id: `gev-${DRIVER_ID}-1`, driver_id: DRIVER_ID, event_type: 'profile_complete', xp_earned: 50, description: 'Completed profile', created_at: '2026-01-15T10:00:00Z' },
    { _id: `gev-${DRIVER_ID}-2`, driver_id: DRIVER_ID, event_type: 'first_match', xp_earned: 100, description: 'First carrier match', created_at: '2026-01-20T14:00:00Z' },
    { _id: `gev-${DRIVER_ID}-3`, driver_id: DRIVER_ID, event_type: 'application_sent', xp_earned: 30, description: 'Applied to Swift Transportation', created_at: '2026-03-08T10:00:00Z' },
    { _id: `gev-${DRIVER_ID}-4`, driver_id: DRIVER_ID, event_type: 'daily_login', xp_earned: 10, description: 'Daily login streak', created_at: now },
  ];
  for (const e of gamEvents) {
    await upsert('gamificationEvents', { _id: e._id, data: e });
  }

  // 5. Achievements
  console.log('\n5. Achievements');
  const achievements = [
    { _id: 'ach-profile-pro', name: 'Profile Pro', description: 'Complete your profile to 100%', icon: 'verified', xp_reward: 50, category: 'onboarding' },
    { _id: 'ach-first-match', name: 'First Match', description: 'Get your first carrier match', icon: 'handshake', xp_reward: 100, category: 'matching' },
    { _id: 'ach-road-warrior', name: 'Road Warrior', description: 'Log in 7 days in a row', icon: 'local_fire_department', xp_reward: 75, category: 'engagement' },
    { _id: 'ach-five-apps', name: 'Go-Getter', description: 'Apply to 5 carriers', icon: 'rocket_launch', xp_reward: 100, category: 'matching' },
  ];
  for (const a of achievements) {
    await upsert('achievementDefinitions', { _id: a._id, data: a });
  }

  const driverAchievements = [
    { _id: `da-${DRIVER_ID}-1`, driver_id: DRIVER_ID, achievement_id: 'ach-profile-pro', earned_at: '2026-01-16T10:00:00Z' },
    { _id: `da-${DRIVER_ID}-2`, driver_id: DRIVER_ID, achievement_id: 'ach-first-match', earned_at: '2026-01-20T14:00:00Z' },
    { _id: `da-${DRIVER_ID}-3`, driver_id: DRIVER_ID, achievement_id: 'ach-road-warrior', earned_at: '2026-02-01T08:00:00Z' },
  ];
  for (const da of driverAchievements) {
    await upsert('driverAchievements', { _id: da._id, data: da });
  }

  // 6. Documents
  console.log('\n6. Documents');
  const docs = [
    { _id: `doc-${DRIVER_ID}-cdl`, driver_id: DRIVER_ID, doc_type: 'CDL', file_name: 'cdl-front.pdf', status: 'verified', expiration_date: '2028-06-15', uploaded_at: '2026-01-15T10:00:00Z' },
    { _id: `doc-${DRIVER_ID}-medical`, driver_id: DRIVER_ID, doc_type: 'Medical Card', file_name: 'medical-cert.pdf', status: 'verified', expiration_date: '2027-01-15', uploaded_at: '2026-01-15T10:30:00Z' },
    { _id: `doc-${DRIVER_ID}-mvr`, driver_id: DRIVER_ID, doc_type: 'MVR', file_name: 'mvr-report.pdf', status: 'verified', expiration_date: '2027-03-10', uploaded_at: '2026-01-16T09:00:00Z' },
    { _id: `doc-${DRIVER_ID}-hazmat`, driver_id: DRIVER_ID, doc_type: 'Hazmat Endorsement', file_name: 'hazmat-cert.pdf', status: 'pending_review', expiration_date: '2028-06-15', uploaded_at: '2026-03-01T11:00:00Z' },
  ];
  for (const d of docs) {
    await upsert('qualificationFiles', { _id: d._id, data: d });
  }

  // 7. Saved jobs
  console.log('\n7. Saved Jobs');
  const savedJobs = [
    { _id: `sj-${DRIVER_ID}-1`, driver_id: DRIVER_ID, job_id: 'job-swift-otr-001', carrier_name: 'Swift Transportation', title: 'OTR Dry Van Driver', pay_range: '$65K-$92K', saved_at: '2026-03-07T16:00:00Z' },
    { _id: `sj-${DRIVER_ID}-2`, driver_id: DRIVER_ID, job_id: 'job-jbhunt-inter-001', carrier_name: 'J.B. Hunt Transport', title: 'Intermodal Driver', pay_range: '$72K-$100K', saved_at: '2026-03-09T11:00:00Z' },
  ];
  for (const sj of savedJobs) {
    await upsert('savedJobs', { _id: sj._id, data: sj });
  }

  // 8. Match events
  console.log('\n8. Match Events');
  const matchEvents = [
    { _id: `me-${DRIVER_ID}-1`, driver_id: DRIVER_ID, carrier_dot: '185775', carrier_name: 'Swift Transportation', match_score: 94, event_type: 'match_created', created_at: '2026-03-05T08:00:00Z' },
    { _id: `me-${DRIVER_ID}-2`, driver_id: DRIVER_ID, carrier_dot: '135113', carrier_name: 'Werner Enterprises', match_score: 87, event_type: 'match_created', created_at: '2026-03-05T08:00:00Z' },
    { _id: `me-${DRIVER_ID}-3`, driver_id: DRIVER_ID, carrier_dot: '296820', carrier_name: 'Schneider National', match_score: 79, event_type: 'match_created', created_at: '2026-03-05T08:00:00Z' },
    { _id: `me-${DRIVER_ID}-4`, driver_id: DRIVER_ID, carrier_dot: '517076', carrier_name: 'J.B. Hunt Transport', match_score: 91, event_type: 'match_created', created_at: '2026-03-06T08:00:00Z' },
    { _id: `me-${DRIVER_ID}-5`, driver_id: DRIVER_ID, carrier_dot: '370866', carrier_name: 'Heartland Express', match_score: 72, event_type: 'match_created', created_at: '2026-03-07T08:00:00Z' },
  ];
  for (const me of matchEvents) {
    await upsert('matchEvents', { _id: me._id, data: me });
  }

  // 9. Notifications
  console.log('\n9. Notifications');
  const notifs = [
    { _id: `notif-${DRIVER_ID}-1`, driver_id: DRIVER_ID, title: 'New Match!', body: 'J.B. Hunt Transport matched you at 91%', type: 'match', read: false, created_at: '2026-03-10T09:00:00Z' },
    { _id: `notif-${DRIVER_ID}-2`, driver_id: DRIVER_ID, title: 'Interview Scheduled', body: 'Werner Enterprises wants to talk — check your cockpit', type: 'application', read: false, created_at: '2026-03-09T14:00:00Z' },
    { _id: `notif-${DRIVER_ID}-3`, driver_id: DRIVER_ID, title: 'Achievement Unlocked!', body: 'You earned the Road Warrior badge', type: 'gamification', read: true, created_at: '2026-02-01T08:00:00Z' },
  ];
  for (const n of notifs) {
    await upsert('driverNotifications', { _id: n._id, data: n });
  }

  // 10. Scorecard
  console.log('\n10. Scorecard');
  await upsert('driverScores', {
    _id: `score-${DRIVER_ID}`,
    data: {
      driver_id: DRIVER_ID,
      safety_score: 92,
      compliance_score: 88,
      performance_score: 85,
      engagement_score: 78,
      overall_score: 86,
      period: 'monthly',
      month: '2026-03',
      updated_at: now,
    }
  });

  // 11. Retention / Performance
  console.log('\n11. Retention & Performance');
  await upsert('driverPerformance', {
    _id: `perf-${DRIVER_ID}`,
    data: {
      driver_id: DRIVER_ID,
      on_time_delivery: 96.5,
      miles_driven: 912000,
      accidents: 0,
      violations: 1,
      tenure_months: 14,
      satisfaction_score: 4.2,
      updated_at: now,
    }
  });

  // 12. Expenses
  console.log('\n12. Expenses');
  const expenses = [
    { _id: `exp-${DRIVER_ID}-1`, driver_id: DRIVER_ID, amount: 85.40, category: 'Fuel', description: 'Diesel at Love\'s Travel Stop', date: '2026-03-10' },
    { _id: `exp-${DRIVER_ID}-2`, driver_id: DRIVER_ID, amount: 12.99, category: 'Food', description: 'Lunch at Pilot Flying J', date: '2026-03-10' },
    { _id: `exp-${DRIVER_ID}-3`, driver_id: DRIVER_ID, amount: 45.00, category: 'Maintenance', description: 'Tire pressure check', date: '2026-03-09' },
  ];
  for (const exp of expenses) {
    await upsert('driverExpenses', { _id: exp._id, data: exp });
  }

  // 13. Lifecycle events
  console.log('\n13. Lifecycle Events');
  const lifecycle = [
    { _id: `lc-${DRIVER_ID}-1`, driver_id: DRIVER_ID, event_type: 'account_created', description: 'Account created', created_at: '2026-01-15T10:00:00Z' },
    { _id: `lc-${DRIVER_ID}-2`, driver_id: DRIVER_ID, event_type: 'profile_completed', description: 'Profile completed to 100%', created_at: '2026-01-16T14:00:00Z' },
    { _id: `lc-${DRIVER_ID}-3`, driver_id: DRIVER_ID, event_type: 'first_application', description: 'Applied to Werner Enterprises', created_at: '2026-03-06T14:30:00Z' },
    { _id: `lc-${DRIVER_ID}-4`, driver_id: DRIVER_ID, event_type: 'interview_scheduled', description: 'Werner Enterprises interview', created_at: '2026-03-09T14:00:00Z' },
  ];
  for (const lc of lifecycle) {
    await upsert('lifecycleEvents', { _id: lc._id, data: lc });
  }

  // 14. Community - Forum categories
  console.log('\n14. Community');
  const categories = [
    { _id: 'cat-general', name: 'General Discussion', description: 'Talk about anything trucking', icon: 'forum', thread_count: 42, post_count: 318 },
    { _id: 'cat-carrier-reviews', name: 'Carrier Reviews', description: 'Share your carrier experiences', icon: 'rate_review', thread_count: 87, post_count: 654 },
    { _id: 'cat-road-tips', name: 'Road Tips', description: 'Routes, rest stops, and road advice', icon: 'route', thread_count: 31, post_count: 189 },
  ];
  for (const cat of categories) {
    await upsert('forumCategories', { _id: cat._id, data: cat });
  }

  // 15. Retention risk log
  console.log('\n15. Retention Risk');
  await upsert('retentionRiskLogs', {
    _id: `risk-${DRIVER_ID}`,
    data: {
      driver_id: DRIVER_ID,
      risk_score: 22,
      risk_level: 'low',
      factors: { tenure: 5, satisfaction: 8, pay_gap: 3, market_demand: 6 },
      recommendations: ['Consider home-time bonus', 'Schedule quarterly check-in'],
      assessed_at: now,
    }
  });

  console.log('\n=== Demo driver seeded successfully! ===');
  console.log(`Driver ID: ${DRIVER_ID}`);
  console.log(`Profile: Marcus Thompson, Phoenix AZ, CDL-A, 8yr exp`);
  console.log(`Matches: 5 carriers, 3 applications, 2 saved jobs`);
  console.log(`Gamification: Level 3 "Mile Maker", 310 XP, 5-day streak`);
  console.log(`Documents: 4 (3 verified, 1 pending)`);
  console.log(`Scorecard: 86 overall`);
  console.log(`\nVerify: curl -H "Authorization: Bearer <key>" ${API}/v1/driver/profile/${DRIVER_ID}\n`);
}

main().catch(err => { console.error('Seed failed:', err); process.exit(1); });
