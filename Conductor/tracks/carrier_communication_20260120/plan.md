# Track Plan: Carrier Communication Hub - Driver Engagement

## Phase 1: Company Announcements

Build the foundation for carrier-to-driver communication with rich announcements, targeting, scheduling, and read tracking.

> Completion gate: Phase 1 is not marked complete until enhancements and Phase 1 tests/manual verification are finished.

### 1.1 Backend Collections
- [x] Task: Create `CarrierAnnouncements` collection with schema from spec
- [x] Task: Create `AnnouncementReadReceipts` collection with indexes (announcement_id, driver_id)
- [x] Task: Create `AnnouncementComments` collection for driver engagement
- [x] Task: Create `CarrierNotificationSettings` collection for carrier preferences
- [x] Task: Create `DriverNotificationPreferences` collection for driver opt-outs
- [ ] Task: Add indexes for efficient querying (carrier_id, status, published_at)

### 1.2 Announcements Service Backend
- [x] Task: Create `carrierAnnouncementsService.jsw` for announcement management
- [x] Task: Implement `createAnnouncement()` with validation and slug generation
- [x] Task: Implement `updateAnnouncement()` with draft/scheduled status checks
- [x] Task: Implement `publishAnnouncement()` with immediate delivery trigger
- [x] Task: Implement `scheduleAnnouncement()` with datetime validation
- [x] Task: Implement `archiveAnnouncement()` with soft archive
- [x] Task: Implement `uploadAttachment()` for file handling
- [x] Task: Implement `previewRecipients()` for audience targeting preview
- [x] Task: Implement `getDriverSegments()` to fetch available targeting options

### 1.3 Read Receipt Tracking
- [x] Task: Implement `markAnnouncementRead()` with device type capture
- [x] Task: Implement `getAnnouncementStats()` with read rate calculation
- [x] Task: Implement `getReadReceipts()` with pagination
- [x] Task: Implement `getUnreadDrivers()` for reminder targeting
- [ ] Task: Add time-spent tracking for engagement metrics (optional)

### 1.4 Driver Feed Backend
- [x] Task: Implement `getAnnouncementsForDriver()` with filtering and pagination
- [x] Task: Implement `addComment()` with basic moderation
- [ ] Task: Add notification trigger for new announcements
- [x] Task: Implement announcement expiry logic

### 1.5 Carrier Admin UI - Announcements Dashboard
- [x] Task: Create `CARRIER_ANNOUNCEMENTS.html` in `src/public/carrier/`
- [x] Task: Build announcements list with tabs (Published, Scheduled, Drafts, Archived)
- [ ] Task: Display read rate progress bars for each announcement
- [ ] Task: Add filter controls (status, priority, date range)
- [x] Task: Create "New Announcement" button with modal trigger
- [ ] Task: Implement archive and send reminder actions

### 1.6 Carrier Admin UI - Create/Edit Announcement
- [ ] Task: Build announcement creation modal/page
- [ ] Task: Implement rich text editor with formatting toolbar (bold, italic, links, headers, lists)
- [ ] Task: Add image upload and embedding in content
- [ ] Task: Create priority selector (Normal, Important, Urgent)
- [ ] Task: Build target audience selector with segment options
- [ ] Task: Add segment builder UI (region, tenure, status filters)
- [ ] Task: Implement recipient preview counter
- [ ] Task: Add attachment upload with file type validation
- [ ] Task: Create scheduling date/time picker
- [ ] Task: Add preview mode before publishing
- [ ] Task: Implement save as draft functionality

### 1.7 Carrier Admin UI - Announcement Detail
- [ ] Task: Build announcement detail view with full content
- [ ] Task: Display read receipt statistics with visual chart
- [ ] Task: Show read/unread driver lists with pagination
- [ ] Task: Add "Send Reminder" to unread drivers action
- [ ] Task: Display driver comments section (if enabled)
- [ ] Task: Add comment moderation controls (hide/unhide)

### 1.8 Driver UI - Announcements Feed
- [x] Task: Create `DRIVER_ANNOUNCEMENTS.html` in `src/public/driver/`
- [x] Task: Build announcement card component with priority badges
- [x] Task: Implement NEW/UNREAD/READ status indicators
- [ ] Task: Add "Read Full Announcement" expansion
- [ ] Task: Display attachments with download links
- [x] Task: Implement auto-mark-read on view
- [ ] Task: Add comments section (if enabled)
- [ ] Task: Implement infinite scroll pagination

### 1.9 Notification Integration
- [ ] Task: Create email template `announcement_notification.html`
- [ ] Task: Create email template `announcement_digest.html` for daily/weekly
- [ ] Task: Implement push notification payload for announcements
- [ ] Task: Add in-app notification badge to navigation
- [ ] Task: Implement digest scheduling (daily/weekly based on settings)

### 1.10 Wix Page Integration
- [ ] Task: Create "Announcements" page in Wix Editor for carrier admin
- [ ] Task: Add HTML component and connect to CARRIER_ANNOUNCEMENTS.html
- [x] Task: Set up postMessage bridge for backend calls
- [ ] Task: Add announcements widget to driver dashboard
- [ ] Task: Configure page permissions (carrier admin only)

### 1.11 Testing - Announcements
- [ ] Task: Write unit tests for `carrierAnnouncementsService.jsw` CRUD operations
- [ ] Task: Test audience targeting with various segment combinations
- [ ] Task: Test scheduling logic with future dates
- [ ] Task: Test read receipt tracking and deduplication
- [ ] Task: Test attachment upload with various file types
- [ ] Task: Manual test: create, schedule, publish announcement flow
- [ ] Task: Manual test: driver viewing and read tracking
- [ ] Task: Manual test: send reminder to unread drivers
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Company Announcements'

---

## Phase 2: Policy Repository

Centralized document management with version control, acknowledgment tracking, and compliance reporting.

### 2.1 Backend Collections
- [x] Task: Create `PolicyDocuments` collection with schema from spec
- [x] Task: Create `PolicyAcknowledgments` collection with audit fields
- [ ] Task: Add indexes for compliance queries (carrier_id, status, requires_acknowledgment)
- [ ] Task: Seed initial policy categories (Handbook, Safety, SOP, Compliance, HR)

### 2.2 Policy Service Backend
- [x] Task: Create `carrierPolicyService.jsw` for document management
- [x] Task: Implement `createPolicy()` with category validation
- [x] Task: Implement `updatePolicy()` with version increment option
- [x] Task: Implement `publishPolicyVersion()` with change summary
- [x] Task: Implement `archivePolicy()` with acknowledgment preservation
- [x] Task: Implement `uploadPolicyFile()` for PDF handling
- [ ] Task: Implement Markdown rendering for inline policies

### 2.3 Acknowledgment Configuration Backend
- [x] Task: Implement `setAcknowledgmentRequired()` with deadline setting
- [x] Task: Implement `setTargetAudience()` for selective requirements
- [x] Task: Implement `sendReminders()` to pending drivers
- [ ] Task: Add deadline reminder scheduling (7d, 3d, 1d before)

### 2.4 Compliance Tracking Backend
- [x] Task: Implement `getComplianceStatus()` with completion percentage
- [x] Task: Implement `getAcknowledgmentList()` with status filter
- [x] Task: Implement `getDriverPolicyStatus()` for driver's view
- [ ] Task: Implement `exportComplianceReport()` in CSV and PDF formats

### 2.5 Driver Acknowledgment Backend
- [x] Task: Implement `getPoliciesForDriver()` with required/optional sorting
- [x] Task: Implement `getPolicyContent()` for document viewing
- [x] Task: Implement `acknowledgePolicy()` with signature capture
- [x] Task: Implement `getAcknowledgmentHistory()` for driver records
- [x] Task: Add audit logging for all acknowledgments (IP, device, timestamp)

### 2.6 Carrier Admin UI - Policy Repository Dashboard
- [x] Task: Create `CARRIER_POLICIES.html` in `src/public/carrier/`
- [ ] Task: Build policy list grouped by category
- [ ] Task: Display version number and last published date
- [ ] Task: Show compliance progress bars for required policies
- [x] Task: Add filter by category and status
- [x] Task: Create "New Policy" button

### 2.7 Carrier Admin UI - Create/Edit Policy
- [ ] Task: Build policy creation modal/page
- [ ] Task: Add title, category, and description fields
- [ ] Task: Implement content type selector (Markdown editor, PDF upload, external link)
- [ ] Task: Build Markdown editor with preview
- [ ] Task: Add PDF upload with viewer preview
- [ ] Task: Create acknowledgment settings section
- [ ] Task: Add deadline date picker
- [ ] Task: Implement target audience selector (all, new hires, specific segments)
- [ ] Task: Add "Mandatory" toggle for skip prevention

### 2.8 Carrier Admin UI - Compliance Dashboard
- [ ] Task: Build compliance detail view for specific policy
- [ ] Task: Display overall completion percentage with progress bar
- [ ] Task: Show completed vs pending driver counts
- [ ] Task: Build pending acknowledgments list with days-until-deadline
- [ ] Task: Build completed acknowledgments list with signature dates
- [ ] Task: Add "Send Reminder" bulk action
- [ ] Task: Implement "Export Report" functionality

### 2.9 Driver UI - Policy View
- [x] Task: Create `DRIVER_POLICIES.html` in `src/public/driver/`
- [x] Task: Build "Action Required" section for pending acknowledgments
- [x] Task: Display policy list with acknowledgment status badges
- [ ] Task: Show deadline countdown for required policies
- [x] Task: Implement policy detail view with content rendering

### 2.10 Driver UI - Acknowledgment Flow
- [x] Task: Build acknowledgment modal with full policy viewer
- [ ] Task: Implement PDF viewer for uploaded documents
- [ ] Task: Render Markdown content with proper styling
- [x] Task: Add checkbox acknowledgment for simple policies
- [ ] Task: Implement e-signature capture (canvas drawing)
- [ ] Task: Add confirmation checkboxes before submission
- [x] Task: Display success confirmation with timestamp

### 2.11 Notification Integration
- [ ] Task: Create email template `policy_reminder.html`
- [ ] Task: Create email template `policy_deadline_warning.html` (1 day)
- [ ] Task: Implement push notification for policy deadlines
- [ ] Task: Add reminder scheduling job (7d, 3d, 1d before deadline)

### 2.12 Wix Page Integration
- [ ] Task: Create "Policy Repository" page in Wix Editor for carrier admin
- [ ] Task: Add HTML component and connect to CARRIER_POLICIES.html
- [ ] Task: Add policy widget to driver dashboard
- [x] Task: Set up postMessage bridge for backend calls
- [ ] Task: Configure page permissions

### 2.13 Testing - Policy Repository
- [ ] Task: Write unit tests for `carrierPolicyService.jsw` CRUD operations
- [ ] Task: Test version history tracking
- [ ] Task: Test acknowledgment with various signature types
- [ ] Task: Test compliance percentage calculations
- [ ] Task: Test deadline reminder scheduling
- [ ] Task: Test PDF upload and rendering
- [ ] Task: Manual test: policy creation with Markdown content
- [ ] Task: Manual test: policy creation with PDF upload
- [ ] Task: Manual test: driver acknowledgment flow with e-signature
- [ ] Task: Manual test: compliance report export
- [ ] Task: Conductor - User Manual Verification 'Phase 2: Policy Repository'

---

## Phase 3: Recognition Board

Celebrate driver achievements with public recognition feed, badge system, and peer nominations.

### 3.1 Backend Collections
- [ ] Task: Create `RecognitionAwards` collection with schema from spec
- [ ] Task: Create `RecognitionBadges` collection for badge definitions
- [ ] Task: Create `DriverBadges` junction table for earned badges
- [ ] Task: Create `PeerNominations` collection for nomination workflow
- [ ] Task: Seed default badge library (Safe Miles tiers, Years of Service, Performance awards)

### 3.2 Award Management Backend
- [ ] Task: Create `carrierRecognitionService.jsw` for recognition management
- [ ] Task: Implement `createAward()` with type and category validation
- [ ] Task: Implement `approveAward()` for peer nominations
- [ ] Task: Implement `rejectAward()` with reason logging
- [ ] Task: Implement `publishAward()` to add to public feed

### 3.3 Badge System Backend
- [ ] Task: Implement `createBadge()` with tier and threshold settings
- [ ] Task: Implement `updateBadge()` for badge modifications
- [ ] Task: Implement `getBadgeLibrary()` for carrier's badge catalog
- [ ] Task: Implement `awardBadge()` to grant badge to driver
- [ ] Task: Implement automatic badge checks based on driver data (miles, tenure)
- [ ] Task: Create scheduled job for automatic badge awards

### 3.4 Peer Nominations Backend
- [ ] Task: Implement `submitNomination()` with category and reason
- [ ] Task: Implement `getNominationsForReview()` for manager queue
- [ ] Task: Implement `reviewNomination()` with approve/reject actions
- [ ] Task: Convert approved nominations to awards automatically

### 3.5 Recognition Feed Backend
- [ ] Task: Implement `getRecognitionFeed()` with pagination and filters
- [ ] Task: Implement `getDriverAwards()` for individual driver history
- [ ] Task: Implement `getDriverBadges()` for badge display
- [ ] Task: Implement `likeAward()` for celebration reactions
- [ ] Task: Implement `commentOnAward()` for congratulations
- [ ] Task: Implement `getRecognitionStats()` for analytics

### 3.6 Carrier Admin UI - Recognition Dashboard
- [ ] Task: Create `CARRIER_RECOGNITION.html` in `src/public/carrier/`
- [ ] Task: Build recognition statistics overview (awards this month, categories)
- [ ] Task: Display pending peer nominations queue
- [ ] Task: Add "Create Award" button
- [ ] Task: Show recent awards feed with admin controls

### 3.7 Carrier Admin UI - Create Award
- [ ] Task: Build award creation modal/page
- [ ] Task: Add driver search/selection field
- [ ] Task: Create award type selector (Safety, Milestone, Performance, Custom)
- [ ] Task: Add predefined award templates by type
- [ ] Task: Build badge selector from carrier's badge library
- [ ] Task: Add personal message textarea
- [ ] Task: Implement preview before publishing

### 3.8 Carrier Admin UI - Badge Management
- [ ] Task: Create badge library management page
- [ ] Task: Build badge creation form (name, icon, category, tier, threshold)
- [ ] Task: Add icon selector or upload
- [ ] Task: Implement automatic badge toggle with threshold setting
- [ ] Task: Display badges in use with driver counts

### 3.9 Carrier Admin UI - Nomination Review
- [ ] Task: Build nomination queue list with pending count
- [ ] Task: Display nomination details (nominator, nominee, reason)
- [ ] Task: Add approve/reject buttons with notes field
- [ ] Task: Show nomination history for context

### 3.10 Driver UI - Recognition Feed
- [ ] Task: Create `DRIVER_RECOGNITION.html` in `src/public/driver/`
- [ ] Task: Build public recognition feed with award cards
- [ ] Task: Display driver photo, name, award title, and message
- [ ] Task: Show badge icons earned with award
- [ ] Task: Implement "Celebrate" (like) button with count
- [ ] Task: Add comments section with input field
- [ ] Task: Build filter by award type and date

### 3.11 Driver UI - Peer Nomination
- [ ] Task: Build "Nominate a Driver" button and modal
- [ ] Task: Add driver search/selection field
- [ ] Task: Create category selector (Team Player, Safety Champion, etc.)
- [ ] Task: Add reason textarea with character limit (500)
- [ ] Task: Show submission confirmation
- [ ] Task: Display user's past nominations and status

### 3.12 Driver UI - My Badges
- [ ] Task: Create badge showcase section on driver profile
- [ ] Task: Display earned badges with earned date
- [ ] Task: Add toggle for profile visibility of each badge
- [ ] Task: Show badge progress for automatic badges (e.g., "50K/100K miles")

### 3.13 Notification Integration
- [ ] Task: Create email template `recognition_awarded.html`
- [ ] Task: Create email template `peer_nomination_approved.html`
- [ ] Task: Implement push notification for new awards
- [ ] Task: Add in-app notification for recognition events

### 3.14 Wix Page Integration
- [ ] Task: Create "Recognition Board" page in Wix Editor for carrier admin
- [ ] Task: Add HTML component and connect to CARRIER_RECOGNITION.html
- [ ] Task: Create driver-facing recognition feed page
- [ ] Task: Add recognition widget to driver dashboard
- [ ] Task: Set up postMessage bridge for backend calls

### 3.15 Testing - Recognition Board
- [ ] Task: Write unit tests for `carrierRecognitionService.jsw` operations
- [ ] Task: Test badge awarding with various thresholds
- [ ] Task: Test peer nomination workflow (submit, review, publish)
- [ ] Task: Test like and comment functionality
- [ ] Task: Test automatic badge checks against driver data
- [ ] Task: Manual test: create and publish manager award
- [ ] Task: Manual test: peer nomination full lifecycle
- [ ] Task: Manual test: driver viewing feed and celebrating
- [ ] Task: Conductor - User Manual Verification 'Phase 3: Recognition Board'

---

## Phase 4: Feedback Channel

Anonymous driver feedback collection with sentiment analysis, trending topics, and response workflow.

### 4.1 Backend Collections
- [ ] Task: Create `DriverFeedback` collection with schema from spec
- [ ] Task: Create `FeedbackResponses` collection for management responses
- [ ] Task: Create `FeedbackTrends` collection for daily aggregations
- [ ] Task: Add indexes for efficient querying (carrier_id, category, status, sentiment)
- [ ] Task: Seed feedback categories (Safety, Pay, Routes, Dispatch, Equipment, Management, Other)

### 4.2 Feedback Submission Backend
- [ ] Task: Create `carrierFeedbackService.jsw` for feedback management
- [ ] Task: Implement `submitFeedback()` with anonymous token generation
- [ ] Task: Implement `getMyFeedbackStatus()` using anonymous token
- [ ] Task: Add rate limiting to prevent spam (1 per day per category)
- [ ] Task: Implement notification opt-in token system

### 4.3 AI Analysis Integration
- [ ] Task: Implement `analyzeFeedbackSentiment()` using Claude/Perplexity
- [ ] Task: Score sentiment from -1 to 1 with label
- [ ] Task: Implement `extractTopics()` for topic detection
- [ ] Task: Build topic taxonomy for trucking industry
- [ ] Task: Add sentiment and topic analysis to submission flow

### 4.4 Management Dashboard Backend
- [ ] Task: Implement `getFeedbackDashboard()` with overview stats
- [ ] Task: Implement `getFeedbackList()` with filters and pagination
- [ ] Task: Implement `getFeedbackDetail()` for single feedback view
- [ ] Task: Implement `updateFeedbackStatus()` for workflow transitions
- [ ] Task: Implement `addInternalNote()` for manager collaboration

### 4.5 Response Workflow Backend
- [ ] Task: Implement `respondToFeedback()` with response type
- [ ] Task: Implement anonymous notification via token
- [ ] Task: Implement `getResponseTemplates()` for saved responses
- [ ] Task: Implement `createResponseTemplate()` for template management
- [ ] Task: Track response time metrics

### 4.6 Trends & Analytics Backend
- [ ] Task: Implement `getFeedbackTrends()` with date range
- [ ] Task: Implement `getTopicAnalysis()` for topic clustering
- [ ] Task: Implement `getSentimentOverTime()` for trend charts
- [ ] Task: Implement `exportFeedbackReport()` in CSV/PDF
- [ ] Task: Create daily aggregation scheduled job

### 4.7 Driver UI - Feedback Submission
- [ ] Task: Create `DRIVER_FEEDBACK.html` in `src/public/driver/`
- [ ] Task: Build feedback category selector with icons
- [ ] Task: Add feedback textarea with character counter (2000 max)
- [ ] Task: Implement anonymous reassurance messaging
- [ ] Task: Add "Notify me on response" checkbox with explanation
- [ ] Task: Show submission confirmation with anonymous token
- [ ] Task: Build "Check My Feedback Status" lookup by token

### 4.8 Driver UI - Feedback Status
- [ ] Task: Create feedback status view using anonymous token
- [ ] Task: Display feedback content and submission date
- [ ] Task: Show current status (New, Reviewing, Responded)
- [ ] Task: Display management response when available
- [ ] Task: Allow rating of response helpfulness

### 4.9 Carrier Admin UI - Feedback Dashboard
- [ ] Task: Create `CARRIER_FEEDBACK.html` in `src/public/carrier/`
- [ ] Task: Build overview statistics cards (total, response rate, avg time)
- [ ] Task: Create sentiment distribution chart
- [ ] Task: Build trending topics section with mention counts
- [ ] Task: Display sentiment indicator per topic
- [ ] Task: Add date range selector

### 4.10 Carrier Admin UI - Feedback List
- [ ] Task: Build feedback list with category and sentiment badges
- [ ] Task: Display preview of feedback content
- [ ] Task: Show submission time and current status
- [ ] Task: Add filter controls (category, status, sentiment, date)
- [ ] Task: Implement "View Full" expansion

### 4.11 Carrier Admin UI - Response Workflow
- [ ] Task: Build feedback detail modal with full content
- [ ] Task: Display AI-detected sentiment and topics
- [ ] Task: Create internal notes section (hidden from driver)
- [ ] Task: Build response composer with template selector
- [ ] Task: Add response type selector (Acknowledgment, Action Taken, Question)
- [ ] Task: Add "Make public to all drivers" toggle
- [ ] Task: Track response submission

### 4.12 Carrier Admin UI - Analytics
- [ ] Task: Build trends page with date range selector
- [ ] Task: Create sentiment over time line chart
- [ ] Task: Build category breakdown bar chart
- [ ] Task: Display topic word cloud or ranked list
- [ ] Task: Add export report button
- [ ] Task: Create comparison to previous period

### 4.13 Notification Integration
- [ ] Task: Create email template `feedback_response.html` (anonymous)
- [ ] Task: Implement push notification for manager alerts
- [ ] Task: Add alert for negative sentiment threshold
- [ ] Task: Add alert for high volume in short period

### 4.14 Wix Page Integration
- [ ] Task: Create "Driver Feedback" page in Wix Editor for carrier admin
- [ ] Task: Add HTML component and connect to CARRIER_FEEDBACK.html
- [ ] Task: Add feedback submission widget to driver dashboard
- [ ] Task: Set up postMessage bridge for backend calls
- [ ] Task: Configure page permissions (carrier admin only for management)

### 4.15 Testing - Feedback Channel
- [ ] Task: Write unit tests for `carrierFeedbackService.jsw` operations
- [ ] Task: Test anonymous token generation and lookup
- [ ] Task: Test sentiment analysis integration
- [ ] Task: Test topic extraction with sample feedback
- [ ] Task: Test response notification via anonymous token
- [ ] Task: Test trend aggregation calculations
- [ ] Task: Manual test: driver submits anonymous feedback
- [ ] Task: Manual test: manager reviews and responds
- [ ] Task: Manual test: driver checks response via token
- [ ] Task: Manual test: trends dashboard accuracy
- [ ] Task: Conductor - User Manual Verification 'Phase 4: Feedback Channel'

---

## Post-Launch Tasks

### Analytics & Monitoring
- [ ] Task: Add communication engagement metrics to carrier admin dashboard
- [ ] Task: Track announcement open rates and time-to-read
- [ ] Task: Monitor policy compliance rates by carrier
- [ ] Task: Track recognition program adoption and participation
- [ ] Task: Monitor feedback volume and sentiment trends

### Performance Optimization
- [ ] Task: Implement announcement content caching
- [ ] Task: Optimize feed queries with proper pagination
- [ ] Task: Add lazy loading for comments and reactions
- [ ] Task: Cache aggregated trend data

### Future Enhancements
- [ ] Task: Mobile app push notification deep links
- [ ] Task: Video announcements support
- [ ] Task: Interactive policy quizzes for training
- [ ] Task: Recognition leaderboards and gamification
- [ ] Task: AI-suggested responses for common feedback topics
- [ ] Task: Multi-language support for announcements
