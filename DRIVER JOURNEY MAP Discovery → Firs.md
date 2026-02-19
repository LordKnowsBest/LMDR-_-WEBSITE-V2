DRIVER JOURNEY MAP: Discovery → First Dispatch
Overview
This map covers 9 phases across the full pre-retention driver lifecycle on the VelocityMatch/LMDR platform. Each phase lists the driver's experience (what they see/do), the system touchpoints (backend services, databases, HTML pages), and the data created at each step.

PHASE 1: DISCOVERY & LANDING
Driver Experience:
The driver finds the platform through a Google search, social media ad, or a referral link from another driver. They land on one of several SEO-optimized landing pages tailored to their job type — CDL Class A, OTR, Regional, or Last Mile Delivery.

Touchpoints:

Landing pages: src/public/landing/Homepage.HTML, CDL Class A Driver Recruitment page, OTR Truck Driver Placement page, Last Mile Delivery Driver Staffing page
Each landing page has a prominent CTA pushing to signup
If arriving via referral link, the referral code is captured in the URL query string and tracked by referralService.jsw → trackReferralSignup()
Abandonment tracking begins — if the driver starts the signup form but doesn't complete it, abandonmentEmailService.jsw picks them up within 15 minutes (scheduled job: processAbandonmentEmails, runs every 15 min)
Data Created:

Referral tracking record in driverReferrals (Airtable) if referral code present
Abandonment event logged if form started but not completed
PHASE 2: SIGNUP & PROFILE CREATION
Driver Experience:
The driver creates an account through the Wix member signup flow. On first login, the system auto-creates their driver profile with INCOMPLETE status. They're presented with a profile builder that asks for:

Basic info (name, phone, email, home zip code)
CDL class and endorsements
Years of experience
Equipment preferences (dry van, flatbed, reefer, tanker, etc.)
Run type preference (OTR, Regional, Local, Dedicated)
Pay expectations (cents per mile minimum)
Home time requirements
Max commute distance
Touchpoints:

Wix member authentication system (Members/PrivateMembersData — stays in Wix)
driverProfiles.jsw → getOrCreateDriverProfile() — creates the Airtable record
Profile completeness score is calculated in real-time:
20% = Base info (name, phone, zip)
30% = Experience details (CDL class, years, equipment)
30% = Documents uploaded (CDL, MVR, Medical Card)
20% = Preferences set (run type, pay, commute)
Gamification hook fires: gamificationService.jsw → awardDriverXP() grants +50 XP for "Profile Complete" achievement
Feature adoption tracking begins via featureAdoptionService.jsw
memberService.jsw sends a welcome notification
Data Created:

Driver profile record in driverProfiles (Airtable) — status: INCOMPLETE → ACTIVE as fields are filled
driverProgression record initialized (Level 1, 0 XP, streak = 0)
Gamification event logged in gamificationEvents
Referral conversion recorded if referral code was present (referrer gets +200 XP)
PHASE 3: DOCUMENT UPLOAD & VERIFICATION
Driver Experience:
The driver is prompted to upload required documents. The interface (DRIVER_DOCUMENT_UPLOAD.html) shows a checklist with clear status indicators for each document. Required documents are:

CDL Front (photo)
CDL Back (photo)
MVR (Motor Vehicle Record)
Medical Card
Optional documents:

W-4 tax form
I-9 employment eligibility
Drug Test Consent
Employment History
Proof of Address
When the driver uploads a CDL photo, OCR extraction (ocrService.jsw) automatically reads and pre-fills form fields — license number, expiration date, endorsements, state. The driver confirms or corrects the extracted data.

Each document moves through a status flow: REQUESTED → UPLOADED → VERIFIED (or REJECTED with re-upload request).

If documents aren't uploaded within 48 hours, an automated email reminder sequence begins (days 2, 5, 7) via emailService.jsw.

Touchpoints:

HTML: src/public/driver/DRIVER_DOCUMENT_UPLOAD.html
PostMessage flow: documentUploadReady → page loads upload tokens, uploadFile → validates + OCR + uploads to Wix Media Manager, submitDocuments → marks workflow steps complete
documentCollectionService.jsw — manages document requests, uploads, verification, reminders
ocrService.jsw — auto-extracts CDL data from photos
emailService.jsw / emailTemplateService.jsw — reminder sequences
Gamification: +50 XP for "First CDL Upload" achievement, streak multiplier applied (1.0x–1.5x based on consecutive login days)
Data Created:

Document request records in documentRequests (Airtable)
Uploaded file references in Wix Media Manager
OCR extraction results stored with document record
Profile completeness score recalculated (documents = 30% weight)
Achievement record in driverAchievements if milestone hit
PHASE 4: AI-POWERED CARRIER MATCHING
Driver Experience:
This is the core value proposition. The driver opens the AI Matching page (AI_MATCHING.html) and sees an interactive search form with these filters:

Home Zip Code (pre-filled from profile)
Max Commute Distance (slider: 50–1000 miles)
Minimum Pay (CPM input)
Run Type (OTR / Regional / Local / Any)
Max Turnover Rate threshold
Max Average Truck Age
Fleet Size Preference (Small <50 / Medium 50-500 / Large 500+ / Any)
Toggle: "Show Mutual Matches Only" (carriers who also expressed interest in this driver)
The driver hits "Find Matches" and results stream in — carrier cards ranked by a composite match score (0–100). Each card shows:

Carrier name, DOT number, location
Match score with color coding (green 80+, yellow 60-79, red <60)
AI-enriched intelligence: FMCSA safety rating, pay range, driver sentiment score, social media sentiment
"Why You Matched" explanation button
When the driver clicks a carrier card, they get a deep-dive view with:

Match score breakdown by category
AI-generated narrative explaining why this is a good/mediocre/poor fit
Actionable tips to improve their match score with this carrier
"Express Interest" / "Apply" button
"Dismiss" to remove from results
Touchpoints:

HTML: src/public/driver/AI_MATCHING.html
carrierMatching.jsw → findMatchingCarriers() — main search with scoring weights:
Location proximity: 25%
Pay competitiveness: 20%
Operation type alignment: 15%
Turnover rate: 12%
Safety record: 10%
Truck age/condition: 8%
Fleet size preference: 5%
Overall quality score: 5%
matchingService.jsw → getDriverMatches() — returns scored matches (min threshold: 60)
matchExplanationService.jsw → getMatchExplanationForDriver() — generates human-readable "Why You Matched" narrative
aiEnrichment.jsw → enrichCarrier() — fetches FMCSA safety data, pay intel, driver sentiment analysis, social media analysis (async, 3-second UX delay)
mutualInterestService.jsw → getMutualInterestForDriver() — flags carriers who also searched for this driver
Results cached for 5 minutes to avoid redundant API calls
Gamification: +100 XP for "Found First Match" achievement
Data Created:

Match records in driverMatches (Airtable) with scores and breakdown
Enrichment data cached in carrier profile
Feature adoption event logged
Gamification events: "Completed Preferences", "Found First Match"
PHASE 5: APPLICATION & INTEREST EXPRESSION
Driver Experience:
The driver expresses interest in one or more carriers. They can:

Click "Apply" on a match card from the AI Matching results
Optionally add a short message or note
See a confirmation screen with estimated response time
Their application enters the pipeline with status interested → applied. The driver receives a confirmation email. If a referral code was used at signup, the referrer gets +100 XP for "Referee's First Application."

The driver can track all their applications from the Driver Dashboard (next phase). Applications follow this lifecycle:

interested → applied → in_review → contacted → offer → hired
                                          ↘ rejected
                              ↘ withdrawn (driver-initiated)

Touchpoints:

PostMessage action: submitApplication from AI_MATCHING.html
applicationService.jsw → submitApplication(driverId, carrierDot, metadata):
Creates record in driverCarrierInterests
Logs lifecycle event via driverLifecycleService.jsw
Awards +50 XP for "Application Submitted"
Tracks referral conversion if applicable
Sends confirmation email via emailService.jsw
Application visible to recruiters immediately in Recruiter OS
Notification dispatched to carrier's recruiter via notificationDispatcher.jsw
Data Created:

Application record in driverCarrierInterests (status: applied)
Lifecycle event in driverLifecycleEvents
Notification record in carrier's queue
Email sent and logged
Gamification: +50 XP, potential "Deal Finder" achievement (10 applications)
PHASE 6: RECRUITER CONTACT & COMMUNICATION
Driver Experience:
The driver opens their Driver Dashboard (DRIVER_DASHBOARD.html) — their command center for the entire job search. The dashboard has these sections:

Applications List — All submitted applications with status badges (Applied, In Review, Recruiter Contacted, Offer, Hired, Rejected, Withdrawn). Filterable by status. Each card shows carrier name, DOT, application date, and a collapsible activity timeline.

Activity Timeline — Per-application history: "Application submitted Feb 1", "Recruiter viewed profile Feb 3", "Recruiter contacted you Feb 5", etc. Timeline dots, dates, actors, and notes.

Chat Modal — When a recruiter responds, the driver sees a chat thread. Message bubbles are color-coded (driver = blue, recruiter = gray, system = centered). Quick reply buttons: "I'm interested", "Tell me about pay", "What's home time like?", "Let's schedule a call."

Availability Picker — When the recruiter requests an interview, the driver gets a modal to propose 3 time slots. The recruiter confirms one, and a calendar event is created.

Who's Viewed Me — Shows which carriers viewed the driver's profile in the last 30 days, with "New" badges for views < 7 days old. Privacy toggle lets the driver hide their profile from search.

Insights Panel — 30-day analytics: profile search appearances, active application count, offer conversion rate percentage, visibility ranking percentile.

Touchpoints:

HTML: src/public/driver/DRIVER_DASHBOARD.html
PostMessage actions: dashboardReady, refreshDashboard (smart polling with exponential backoff 2s→30s), sendMessage, getConversation, getNewMessages, getUnreadCount, markAsRead, withdrawApplication, setDiscoverability, proposeTimeSlots, confirmTimeSlot
messagingService.jsw — dedicated conversation threads with is_read tracking
messaging.jsw — application-based messaging with HTML sanitization (XSS prevention)
driverInsightsService.jsw → getWhoViewedMe() — deduped carrier views, enriched with names
driverInsightsService.jsw → getDriverStats() — analytics panel data
Gamification: +75 XP for "Interview Scheduled" achievement
Data Created:

Messages in driverMessages / driverConversations
Read receipts tracked per message
Interview time slots in orientationSlots
Profile view records in carrierDriverViews
Discoverability preference stored on driver profile
PHASE 7: SCREENING & BACKGROUND CHECK
Driver Experience:
Once the recruiter advances the application to screening, the driver enters the onboarding workflow. The workflow is managed by the recruiter through the Recruiter Onboarding Dashboard, but the driver receives clear notifications and action items at each step.

The screening phase includes:

Document Verification — The recruiter reviews uploaded documents (CDL, MVR, Medical Card). If anything is rejected, the driver gets an email with the reason and a re-upload link. Required documents block progression.

Background Check — The recruiter orders a background check. The driver may need to consent and provide additional information. Status flow: not_started → ordered → processing → passed/failed/review. The driver is notified of the result.

Drug Test — The recruiter schedules a drug test. Status flow: not_started → scheduled → completed → passed/failed/no_show. If the driver no-shows, a re-schedule notification is sent.

Throughout screening, the driver can see their progress in the Driver Dashboard or ask the AI agent "What's my onboarding status?" (tool: get_onboarding_status).

Touchpoints:

onboardingWorkflowService.jsw — master workflow state machine:
pending → offer_sent → offer_accepted → in_progress
  → documents_pending → documents_complete
  → background_check (ordered/passed/failed)
  → drug_test (scheduled/passed/failed)
  → orientation (scheduled/completed)
  → compliance_verified → ready_to_start → completed

Sub-status tracking for documents, background check, drug test, orientation — each with independent state
documentCollectionService.jsw → verifyDocument() / rejectDocument(reason) — recruiter actions
emailService.jsw — status update emails, rejection with re-upload instructions, reminder sequences
notificationDispatcher.jsw — multi-channel notifications (in-app, email, SMS)
All workflow changes logged to auditLog for compliance
Workflow can be paused (on_hold) or cancelled with reason
Data Created:

Onboarding workflow record in onboardingWorkflows (Airtable) with full state machine
Background check record in backgroundChecks
Drug test record in drugTests
Document verification records updated in documentRequests
Audit log entries for every status change (timestamp, actor, action, new status)
Notifications sent and logged
PHASE 8: ONBOARDING, OFFER & ORIENTATION
Driver Experience:

Offer Stage — Once screening is passed, the recruiter extends an offer. The driver receives an email and in-app notification. The offer details include carrier name, position, pay rate, benefits summary, start date. The driver accepts or declines through the platform. Accepting the offer triggers:

Application status changes to offer then hired
+200 XP for "Job Offer Received"
+500 XP for "Hired" achievement
If referred, the referrer gets +500 XP for "Referral Hire"
Document Completion — Any remaining optional documents (W-4, I-9, Drug Test Consent) are requested. The driver uploads through the familiar document interface. 48-hour expiry on upload tokens with automatic reminders.

Compliance Verification — The system checks all required documents are verified, background check passed, drug test passed. When all green, the workflow advances to compliance_verified.

Orientation Scheduling — The recruiter schedules orientation. The driver receives a notification with date, time, location (or virtual link), and what to bring. Status: not_scheduled → scheduled → completed. The driver confirms attendance.

Orientation Completion — The driver attends orientation (in-person or virtual). The recruiter marks it complete. The driver's career timeline records the milestone. The workflow advances to ready_to_start → completed.

Touchpoints:

onboardingWorkflowService.jsw → updateWorkflowStatus() — moves through: offer_sent → offer_accepted → in_progress → documents_pending → documents_complete → background_check → drug_test → orientation → compliance_verified → ready_to_start → completed
documentCollectionService.jsw — remaining document requests
emailService.jsw / emailTemplateService.jsw — offer email, orientation details, completion confirmation
driverLifecycleService.jsw → updateDisposition(driverId, 'hired') — marks driver as hired
gamificationService.jsw — XP awards cascade: offer (+200), hired (+500), referral hire bonus (+500 to referrer)
achievementService.jsw → checkAchievements() — unlocks "Hired" badge, potential level-up
Recruiter Onboarding Dashboard (RECRUITER_ONBOARDING_DASHBOARD.html) — recruiter's view with type-based message protocol (not action)
Data Created:

Workflow status updated through each state
Offer record with acceptance timestamp
Remaining document uploads and verifications
Orientation slot record in orientationSlots
Driver disposition changed to hired in driverProfiles
Lifecycle events: "Offer Received", "Offer Accepted", "Orientation Scheduled", "Orientation Completed", "Hired"
Achievement unlocks in driverAchievements
Level-up in driverProgression
PHASE 9: HIRE TO FIRST DISPATCH
Driver Experience:
The driver is now hired. Their Driver Dashboard updates to show the Active Job Header with their current employer, position, and a green "Active" status indicator. The DRIVER_MY_CAREER.html page becomes their career home:

Career Timeline — A visual timeline showing every milestone: signup, first match, application, interview, offer, hire, orientation complete, first dispatch. Each event is timestamped and attributed.

Active Job Card — Shows current carrier, position title, hire date, days employed. Includes a "Resignation" flow if the driver later decides to leave (updates status, logs lifecycle event, reopens their profile for matching).

Post-Hire Survey (30-Day Check-in) — At the 30-day mark, surveyService.jsw automatically triggers a satisfaction survey. Questions cover: "How accurate was the match?", "Is the pay as described?", "How's the work-life balance?", "Would you recommend this carrier?" — responses feed back into the matching algorithm to improve future scores.

First Dispatch — The carrier's dispatch system (external to VelocityMatch) assigns the driver their first load. The recruiter or admin updates the platform to record the milestone. This triggers:

Lifecycle event: "First Dispatch" logged in driverLifecycleEvents
The driver's career timeline shows the milestone
Gamification: Final XP milestone for completing the full journey
The referrer (if any) sees the full referral funnel completed
At this point, the driver has completed the full Discovery → First Dispatch journey. They remain on the platform for:

Community features (forums, mentor program)
Road utilities (fuel, weather, parking, pet-friendly stops)
Health and wellness resources
Future surveys (90-day, 180-day, annual)
Career tracking and potential future job searches
Touchpoints:

HTML: src/public/driver/DRIVER_MY_CAREER.html — career timeline + active job + surveys
driverLifecycleService.jsw → getDriverTimeline() — full event history
surveyService.jsw → getSurveysByDriver() / submitSurveyResponse() — automated surveys at 30/90/180/365 days
driverLifecycleService.jsw → submitMatchFeedback() — post-hire carrier rating
retentionService.jsw (carrier-facing) — begins monitoring churn risk signals
Data Created:

"First Dispatch" lifecycle event in driverLifecycleEvents
Survey records in survey collections (triggered at day 30)
Match feedback stored in driverMatchFeedback — improves future matching
Driver performance baseline established in driverPerformance
CROSS-CUTTING: AI AGENT (Available Throughout)
At any point from Phase 2 onward, the driver can interact with the AI Chat Agent — a floating chat FAB that appears on matching and dashboard pages. The agent understands the driver's context and can:

Search for carrier matches ("Find me regional carriers near Dallas paying over 65 CPM")
Explain match scores ("Why did I match with this carrier?")
Submit applications ("Apply to XYZ Trucking for me")
Check application status ("What's happening with my applications?")
Check onboarding progress ("Where am I in onboarding?")
Schedule interviews ("Set up a call with the recruiter")
Answer platform questions ("How does the match score work?")
The agent is powered by agentService.jsw → handleAgentTurn() which builds driver-scoped tool definitions, calls Claude AI with tool use, executes approved backend operations, and returns conversational responses. All conversations are persisted in agentConversations and agentTurns (Airtable).

Optionally, the driver can also use the Voice Agent — a floating orb powered by VAPI that allows hands-free voice interaction. Useful while driving. The voice agent bridges to the same backend tools via voiceService.jsw and voice-agent-bridge.js.

CROSS-CUTTING: GAMIFICATION (Throughout)
The gamification layer runs across all phases, creating engagement loops:

Action	XP Earned	Phase
Complete profile	+50	Phase 2
Upload first CDL	+50	Phase 3
Complete preferences	+50	Phase 4
Find first match	+100	Phase 4
Submit application	+50	Phase 5
Schedule interview	+75	Phase 6
Receive job offer	+200	Phase 8
Get hired	+500	Phase 8
Referral signup	+200	Any
Referral hire	+500	Phase 8
Levels: 1–50, mapped to tiers: Bronze → Silver → Gold → Platinum → Diamond
Streaks: Daily login streak with multiplier (1.0x–1.5x), one freeze per week
Achievements: "First Steps", "Deal Finder" (10 apps), "Interview Master" (3 interviews), "Hired", level milestones
Badges: Tier-based visual badges displayed on profile and in forums

DATA ARCHITECTURE SUMMARY
All data (except auth) routes to Airtable via the dataAccess.jsw layer. Key collections touched during the journey:

Collection	Created At	Purpose
driverProfiles	Phase 2	Master driver record
documentRequests	Phase 3	Upload tracking
driverMatches	Phase 4	Match scores
driverCarrierInterests	Phase 5	Applications
driverConversations / driverMessages	Phase 6	Chat threads
carrierDriverViews	Phase 6	Profile views
onboardingWorkflows	Phase 7	Workflow state
backgroundChecks	Phase 7	Screening
drugTests	Phase 7	Screening
orientationSlots	Phase 8	Scheduling
driverLifecycleEvents	Phase 2–9	Career timeline
driverProgression	Phase 2–9	XP/levels
driverAchievements	Phase 2–9	Badges
agentConversations / agentTurns	Any	AI chat history
That's the full journey — 9 phases, from the moment a driver sees an ad to the moment they roll out on their first dispatch. Every touchpoint maps to real backend services, real HTML pages, and real Airtable collections in the codebase. This should give your visual mapping tool everything it needs to draw a complete, accurate journey map.

Now let me commit and push this.