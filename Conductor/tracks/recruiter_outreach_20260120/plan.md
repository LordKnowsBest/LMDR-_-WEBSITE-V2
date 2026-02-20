# Track Plan: Recruiter Outreach - Multi-Channel Campaign Management

> **Dependencies**: This track depends on `reverse_matching_20251225` (driver search/targeting) and `recruiter_utility_expansion_20260120` (saved searches, call outcomes).

---

## Phase 1: Email Drip Campaigns

Foundation phase - email has lower cost barrier to entry and provides the infrastructure for multi-channel campaigns.

### 1.1 Data Model Setup

- [x] Task: Create `EmailCampaigns` collection in Wix with schema from spec
  - Fields: `_id`, `_owner`, `carrier_dot`, `campaign_name`, `campaign_type`, `status`, `from_name`, `from_email`, `reply_to`, `subject_line`, `subject_variants`, `preheader`, `template_id`, `html_content`, `audience_filter`, `audience_count`, `schedule_type`, `scheduled_time`, `send_window`, `tracking`, `unsubscribe_group_id`
- [x] Task: Create `EmailSequences` collection for drip campaign definitions
  - Fields: `_id`, `_owner`, `carrier_dot`, `sequence_name`, `description`, `status`, `trigger_type`, `trigger_conditions`, `steps`, `exit_conditions`, `enrollment_count`, `active_count`, `completed_count`, `conversion_count`
- [x] Task: Create `EmailSequenceEnrollments` collection to track driver progress
  - Fields: `_id`, `sequence_id`, `driver_id`, `carrier_dot`, `current_step`, `status`, `exit_reason`, `enrolled_at`, `last_step_at`, `next_step_at`, `step_history`
- [x] Task: Create `EmailMessages` collection for individual email tracking
  - Fields: `_id`, `campaign_id`, `sequence_id`, `enrollment_id`, `driver_id`, `email_address`, `subject`, `sendgrid_id`, `status`, `bounce_type`, `bounce_reason`, `sent_at`, `delivered_at`, `opened`, `opened_at`, `open_count`, `clicked`, `clicked_at`, `click_count`, `clicked_links`, `unsubscribed`, `spam_reported`
- [x] Task: Verify all collections created with proper indexes and permissions

### 1.2 SendGrid Integration Setup

- [x] Task: Add SendGrid API keys to Wix Secrets Manager
  - `SENDGRID_API_KEY` - Main API key for sending
  - `SENDGRID_WEBHOOK_SECRET` - For webhook validation
- [x] Task: Configure SendGrid webhook endpoint in `http-functions.js`
  - Add `/sendgrid/events` webhook handler
  - Implement HMAC signature verification
- [x] Task: Create SendGrid unsubscribe groups for each carrier type
- [x] Task: Set up SendGrid dynamic templates for common email types
  - Welcome email template
  - Follow-up email template
  - Final outreach template
- [x] Task: Test SendGrid connectivity with simple email send

### 1.3 Backend Service Implementation

- [x] Task: Create `src/backend/emailCampaignService.jsw` with base structure
- [x] Task: Implement `createEmailCampaign(carrierDot, campaignData)` function
  - Validate required fields
  - Calculate audience count from filter
  - Save campaign record
- [x] Task: Implement `getEmailCampaigns(carrierDot, filters)` function
  - Support filtering by status, date range
  - Include basic stats (sent, opened, clicked)
- [x] Task: Implement `updateEmailCampaign(campaignId, updates)` function
  - Prevent updates to sent campaigns
- [x] Task: Implement `sendEmailCampaign(campaignId)` function
  - Build recipient list from audience filter
  - Render personalized content for each recipient
  - Queue emails via SendGrid
  - Create EmailMessages records
- [x] Task: Implement `getEmailCampaignAnalytics(campaignId)` function
  - Aggregate open, click, bounce, unsubscribe stats
- [x] Task: Implement `processSendGridWebhook(events)` function
  - Parse event array
  - Update EmailMessages records
  - Handle bounces and unsubscribes

### 1.4 Email Sequence Service Implementation

- [x] Task: Implement `createEmailSequence(carrierDot, sequenceData)` function
  - Validate step structure
  - Save sequence record
- [x] Task: Implement `getEmailSequences(carrierDot)` function
  - Include enrollment stats
- [x] Task: Implement `updateEmailSequence(sequenceId, updates)` function
  - Handle step modifications carefully (don't break active enrollments)
- [x] Task: Implement `enrollInSequence(sequenceId, driverId)` function
  - Check driver not already enrolled
  - Create enrollment record
  - Schedule first step
- [x] Task: Implement `removeFromSequence(enrollmentId, reason)` function
  - Update enrollment status
  - Cancel pending steps
- [x] Task: Implement `processSequenceSteps()` scheduler function
  - Query enrollments where next_step_at <= now
  - Execute appropriate step (email or wait)
  - Update enrollment progress
  - Handle exit conditions
- [x] Task: Implement `getSequenceAnalytics(sequenceId)` function
  - Funnel metrics by step
  - Conversion rate calculations

### 1.5 Scheduler Job Configuration

- [x] Task: Add `processEmailSequenceSteps` job to `src/backend/jobs.config`
  - Schedule: Every 15 minutes (`*/15 * * * *`)
  - Handler: `emailCampaignService.processSequenceSteps`
- [x] Task: Test scheduler execution with mock sequence

### 1.6 Frontend Implementation

- [x] Task: Create `src/public/recruiter/Recruiter_Email_Campaigns.html` page
  - Campaign list view
  - Campaign stats overview
- [x] Task: Create email campaign builder modal
  - Campaign name input
  - From name/email inputs
  - Subject line input with variable picker
  - Template selector or HTML editor
  - Audience filter builder (reuse from driver search)
  - Schedule options (immediate, scheduled)
- [x] Task: Create email sequence builder interface
  - Drag-and-drop step ordering
  - Step type selector (email, wait, condition)
  - Delay configuration
  - Exit condition configuration
- [x] Task: Create email template editor
  - Rich text editor with variable support
  - Preview panel
  - Mobile preview toggle
- [x] Task: Create campaign analytics view
  - Delivery funnel visualization
  - Open/click tracking timeline
  - Per-recipient status table
- [x] Task: Implement postMessage handlers for:
  - `createEmailCampaign` - Create campaign
  - `sendEmailCampaign` - Trigger send
  - `createEmailSequence` - Create sequence
  - `enrollDriversInSequence` - Bulk enrollment
  - `getSequenceAnalytics` - Fetch analytics
- [x] Task: Add Wix page code for Recruiter_Email_Campaigns

### 1.7 Testing & Verification

- [x] Task: Write unit tests for emailCampaignService.jsw
- [x] Task: Test email sending with test recipients
- [x] Task: Test webhook processing with SendGrid test events
- [x] Task: Test sequence enrollment and step progression
- [x] Task: Verify analytics calculations are accurate
- [x] Task: Test unsubscribe handling
- [x] Task: Conductor - Verify Phase 1 Complete

---

## Phase 2: SMS Campaign Manager

Highest impact channel with 98% open rate. Build on email infrastructure patterns.

### 2.1 Data Model Setup

- [x] Task: Create `SMSCampaigns` collection in Wix with schema from spec
  - Fields: `_id`, `_owner`, `carrier_dot`, `campaign_name`, `campaign_type`, `status`, `message_template`, `message_variants`, `audience_filter`, `audience_count`, `schedule_type`, `scheduled_time`, `recurring_schedule`, `send_window`, `rate_limit`, `opt_out_handling`, `tracking_enabled`, `cost_estimate`
- [x] Task: Create `SMSMessages` collection for individual message tracking
  - Fields: `_id`, `campaign_id`, `driver_id`, `phone_number`, `message_body`, `variant_id`, `twilio_sid`, `status`, `error_code`, `error_message`, `sent_at`, `delivered_at`, `cost`, `reply_received`, `reply_content`, `reply_at`, `opted_out`
- [x] Task: Create `SMSOptOuts` collection for compliance
  - Fields: `_id`, `phone_number`, `driver_id`, `carrier_dot`, `opted_out_at`, `opt_out_source`, `resubscribed`, `resubscribed_at`
- [x] Task: Verify collections created with proper indexes

### 2.2 Twilio Integration Setup

- [x] Task: Add Twilio credentials to Wix Secrets Manager
  - `TWILIO_ACCOUNT_SID` - Account identifier
  - `TWILIO_AUTH_TOKEN` - Authentication token
  - `TWILIO_MESSAGING_SERVICE_SID` - For high-volume sending
  - `TWILIO_PHONE_NUMBER` - Fallback phone number
- [x] Task: Configure Twilio webhook endpoints in `http-functions.js`
  - Add `/twilio/status` for delivery status callbacks
  - Add `/twilio/incoming` for reply messages
  - Implement Twilio signature validation
- [x] Task: Set up Twilio Messaging Service for scalable sending
- [x] Task: Configure opt-out handling (STOP keyword)
- [x] Task: Test Twilio connectivity with test message

### 2.3 Backend Service Implementation

- [x] Task: Create `src/backend/smsCampaignService.jsw` with base structure
- [x] Task: Implement `createSMSCampaign(carrierDot, campaignData)` function
  - Validate message length (160 char segments)
  - Calculate audience count
  - Estimate cost based on audience
- [x] Task: Implement `getSMSCampaigns(carrierDot, filters)` function
  - Include delivery stats and cost
- [x] Task: Implement `updateSMSCampaign(campaignId, updates)` function
  - Prevent updates to active campaigns
- [x] Task: Implement `sendSMSCampaign(campaignId)` function
  - Build recipient list from audience filter
  - Check opt-out status for each recipient
  - Render personalized messages
  - Queue via Twilio with rate limiting
  - Create SMSMessages records
- [x] Task: Implement `scheduleSMSCampaign(campaignId, scheduledTime)` function
- [x] Task: Implement `pauseSMSCampaign(campaignId)` function
  - Stop pending messages
  - Record pause state
- [x] Task: Implement `resumeSMSCampaign(campaignId)` function
- [x] Task: Implement `getSMSCampaignAnalytics(campaignId)` function
  - Delivery, reply, opt-out rates
  - A/B test comparison
  - Cost breakdown
- [x] Task: Implement `processTwilioWebhook(payload, signature)` function
  - Validate Twilio signature
  - Update SMSMessages status
  - Handle incoming replies
  - Process STOP keywords
- [x] Task: Implement `checkOptOutStatus(phoneNumber, carrierDot)` function
- [x] Task: Implement `optOutDriver(phoneNumber, carrierDot)` function
  - Add to SMSOptOuts
  - Update DriverProfiles if matched

### 2.4 TCPA Compliance Implementation

- [x] Task: Implement quiet hours enforcement
  - Respect 9 AM - 8 PM recipient local time
  - Delay messages outside window
- [x] Task: Implement frequency capping
  - Max 1 SMS per driver per day per carrier
  - Track last message date
- [x] Task: Implement consent verification
  - Check driver has SMS opt-in before sending
  - Add consent tracking field to DriverProfiles
- [x] Task: Implement carrier identification requirement
  - Auto-append carrier name if not in message
- [x] Task: Create compliance audit log
  - Track all opt-out requests
  - Track consent records

### 2.5 Scheduler Job Configuration

- [x] Task: Add `processScheduledSMSCampaigns` job to `src/backend/jobs.config`
  - Schedule: Every 5 minutes (`*/5 * * * *`)
  - Handler: Check for scheduled campaigns and send
- [x] Task: Implement rate-limited sending queue
  - Respect Twilio rate limits
  - Retry failed messages

### 2.6 Frontend Implementation

- [x] Task: Create `src/public/recruiter/Recruiter_SMS_Campaigns.html` page
  - Campaign list with stats
  - Active/scheduled/completed tabs
- [x] Task: Create SMS campaign builder modal
  - Campaign name input
  - Message composer with character counter
  - Segment indicator (160 char = 1 segment)
  - Variable picker (firstName, carrierName, etc.)
  - A/B variant editor
  - Audience filter builder
  - Schedule options
  - Send window configuration
  - Cost estimate display
- [x] Task: Create SMS analytics view
  - Delivery funnel
  - Reply feed (real-time)
  - Opt-out tracking
  - A/B test results
  - Cost breakdown
- [x] Task: Create reply management interface
  - Inbox-style view of replies
  - Quick reply functionality
  - Mark as handled/needs follow-up
- [x] Task: Implement postMessage handlers for:
  - `createSMSCampaign` - Create campaign
  - `sendSMSCampaign` - Trigger send
  - `pauseSMSCampaign` - Pause active campaign
  - `getSMSReplies` - Fetch incoming replies
  - `getSMSAnalytics` - Fetch campaign stats
- [x] Task: Add Wix page code for Recruiter_SMS_Campaigns

### 2.7 Testing & Verification

- [x] Task: Write unit tests for smsCampaignService.jsw
- [x] Task: Test SMS sending with test phone numbers
- [x] Task: Test webhook processing with Twilio test events
- [x] Task: Test opt-out handling with STOP keyword
- [x] Task: Verify quiet hours enforcement
- [x] Task: Test A/B variant distribution
- [x] Task: Verify cost tracking accuracy
- [x] Task: Conductor - Verify Phase 2 Complete

---

## Phase 3: Job Board Distribution

Expand reach by syndicating jobs to major job boards from a single interface.

### 3.1 Data Model Setup

- [x] Task: Create `JobPostings` collection in Wix with schema from spec
  - Fields: `_id`, `_owner`, `carrier_dot`, `carrier_id`, `job_title`, `job_type`, `route_type`, `description`, `requirements`, `compensation`, `location`, `equipment`, `home_time`, `status`, `internal_only`, `syndication_status`, `applications_count`, `views_count`, `posted_date`, `expiration_date`
- [x] Task: Create `JobBoardCredentials` collection for API credentials
  - Fields: `_id`, `carrier_dot`, `board_name`, `api_key`, `employer_id`, `is_active`, `last_verified`, `monthly_budget`
- [x] Task: Create `JobApplications` collection for aggregated applications
  - Fields: `_id`, `job_posting_id`, `carrier_dot`, `source_board`, `external_application_id`, `applicant_name`, `applicant_email`, `applicant_phone`, `resume_url`, `cover_letter`, `answers`, `matched_driver_id`, `status`, `reviewed_by`, `reviewed_at`, `notes`
- [x] Task: Verify collections created with proper indexes

### 3.2 Job Board API Integration Setup

- [x] Task: Add Indeed API credentials to Wix Secrets Manager
  - `INDEED_PUBLISHER_KEY`
  - `INDEED_EMPLOYER_API_KEY`
- [x] Task: Add ZipRecruiter API credentials
  - `ZIPRECRUITER_API_KEY`
  - `ZIPRECRUITER_PUBLISHER_ID`
- [x] Task: Add CDLjobs API credentials (if available)
  - `CDLJOBS_API_KEY`
- [x] Task: Configure webhook endpoints for application ingestion
  - `/indeed/applications` webhook
  - `/ziprecruiter/applications` webhook
- [x] Task: Test API connectivity for each board

### 3.3 Backend Service Implementation

- [x] Task: Create `src/backend/jobBoardService.jsw` with base structure
- [x] Task: Implement `createJobPosting(carrierDot, jobData)` function
  - Validate required fields
  - Generate SEO-friendly description
  - Save job record
- [x] Task: Implement `getJobPostings(carrierDot, filters)` function
  - Include syndication status
  - Include application counts by board
- [x] Task: Implement `updateJobPosting(jobId, updates)` function
  - Propagate updates to syndicated boards
- [x] Task: Implement `syndicateJob(jobId, boards)` function
  - For each board:
    - Format job data for board's API
    - Submit via API
    - Store external job ID
    - Update syndication_status
- [x] Task: Implement `unsyndicateJob(jobId, boards)` function
  - Remove from specified boards via API
- [x] Task: Implement `refreshJobPosting(jobId)` function
  - Re-post to bump visibility
- [x] Task: Implement `getJobAnalytics(jobId)` function
  - Views, applications by board
  - Conversion rate
- [x] Task: Implement `importApplications(jobId)` function
  - Pull new applications from each board
  - Match to existing DriverProfiles if possible
  - Create JobApplications records
- [x] Task: Implement `processJobBoardWebhook(board, payload)` function
  - Parse incoming application
  - Create JobApplications record
  - Notify recruiter
- [x] Task: Implement `connectJobBoard(carrierDot, board, credentials)` function
- [x] Task: Implement `verifyJobBoardCredentials(carrierDot, board)` function

### 3.4 Indeed Integration

- [x] Task: Implement Indeed job posting format
  - Map internal fields to Indeed API schema
  - Handle salary formatting
  - Handle requirements formatting
- [x] Task: Implement Indeed application webhook handler
  - Parse Indeed application format
  - Download resume if provided
- [x] Task: Implement Indeed job refresh/repost

### 3.5 ZipRecruiter Integration

- [x] Task: Implement ZipRecruiter job posting format
- [x] Task: Implement ZipRecruiter application webhook handler
- [x] Task: Implement ZipRecruiter job management

### 3.6 CDLjobs Integration

- [x] Task: Implement CDLjobs job posting format (CDL-specific fields)
- [x] Task: Implement CDLjobs application handling

### 3.7 Scheduler Job Configuration

- [x] Task: Add `importJobApplications` job to `src/backend/jobs.config`
  - Schedule: Every hour (`0 * * * *`)
  - Handler: Pull applications from all boards
- [x] Task: Add `expireJobPostings` job
  - Schedule: Daily at midnight
  - Handler: Mark expired jobs and remove from boards

### 3.8 Frontend Implementation

- [x] Task: Create `src/public/recruiter/Recruiter_Job_Postings.html` page
  - Job list with syndication status
  - Quick actions (syndicate, refresh, pause)
- [x] Task: Create job posting builder
  - Job title and type selector
  - Route type selector
  - Rich text description editor
  - Requirements builder (CDL type, endorsements, experience)
  - Compensation builder (pay rate, bonuses, benefits)
  - Location picker with radius
  - Equipment details
  - Home time selector
- [x] Task: Create syndication manager modal
  - Board selection checkboxes
  - Per-board status display
  - Credential management links
- [x] Task: Create job analytics view
  - Views and applications by board
  - Conversion funnel
  - Cost tracking (for sponsored posts)
- [x] Task: Create application inbox
  - Filter by job, board, status
  - Quick review actions
  - Match to driver profile
- [x] Task: Implement postMessage handlers for:
  - `createJobPosting` - Create job
  - `syndicateJob` - Push to boards
  - `getJobAnalytics` - Fetch stats
  - `reviewApplication` - Update application status
- [x] Task: Add Wix page code for Recruiter_Job_Postings

### 3.9 Testing & Verification

- [x] Task: Write unit tests for jobBoardService.jsw
- [x] Task: Test job posting to Indeed sandbox
- [x] Task: Test job posting to ZipRecruiter sandbox
- [x] Task: Test application webhook handling
- [x] Task: Test application import job
- [x] Task: Verify analytics accuracy
- [x] Task: Conductor - Verify Phase 3 Complete

---

## Phase 4: Social Posting

Extend reach through organic social media presence on driver communities.

### 4.1 Data Model Setup

- [x] Task: Create `SocialPosts` collection in Wix with schema from spec
  - Fields: `_id`, `_owner`, `carrier_dot`, `post_type`, `content`, `media_urls`, `link_url`, `link_preview`, `platforms`, `platform_posts`, `job_posting_id`, `status`, `scheduled_time`, `published_time`, `engagement`
- [x] Task: Create `SocialAccounts` collection for connected accounts
  - Fields: `_id`, `carrier_dot`, `platform`, `account_type`, `account_id`, `account_name`, `access_token`, `refresh_token`, `token_expires`, `permissions`, `is_active`, `last_used`
- [x] Task: Verify collections created with encryption for tokens

### 4.2 Social Media API Integration Setup

- [x] Task: Add Facebook/Meta API credentials to Wix Secrets Manager
  - `FACEBOOK_APP_ID`
  - `FACEBOOK_APP_SECRET`
- [x] Task: Add LinkedIn API credentials
  - `LINKEDIN_CLIENT_ID`
  - `LINKEDIN_CLIENT_SECRET`
- [x] Task: Implement OAuth callback endpoints
  - `/oauth/facebook/callback`
  - `/oauth/linkedin/callback`
- [x] Task: Test OAuth flow for each platform

### 4.3 Backend Service Implementation

- [x] Task: Create `src/backend/socialPostingService.jsw` with base structure
- [x] Task: Implement `createSocialPost(carrierDot, postData)` function
  - Validate content length per platform
  - Validate media attachments
  - Save post record
- [x] Task: Implement `getSocialPosts(carrierDot, filters)` function
  - Include engagement metrics
- [x] Task: Implement `updateSocialPost(postId, updates)` function
  - Only allow updates to draft/scheduled posts
- [x] Task: Implement `publishSocialPost(postId)` function
  - For each enabled platform:
    - Format content for platform
    - Upload media if needed
    - Post via API
    - Store external post ID
    - Update platform_posts status
- [x] Task: Implement `scheduleSocialPost(postId, scheduledTime)` function
- [x] Task: Implement `cancelSocialPost(postId)` function
- [x] Task: Implement `getSocialPostAnalytics(postId)` function
  - Fetch engagement from each platform API
  - Aggregate metrics
- [x] Task: Implement `processScheduledPosts()` scheduler function
  - Query posts where scheduled_time <= now and status = scheduled
  - Publish each post
- [x] Task: Implement `connectSocialAccount(carrierDot, platform, authCode)` function
  - Exchange auth code for tokens
  - Store encrypted tokens
  - Verify permissions
- [x] Task: Implement `disconnectSocialAccount(accountId)` function
  - Revoke tokens
  - Remove from collection
- [x] Task: Implement `refreshSocialToken(accountId)` function
  - Use refresh token to get new access token
  - Update stored tokens
- [x] Task: Implement `getConnectedAccounts(carrierDot)` function
- [x] Task: Implement `generateJobPostContent(jobId, platform)` function
  - Use AI to generate platform-optimized content
  - Include relevant hashtags
  - Respect character limits

### 4.4 Facebook Integration

- [x] Task: Implement Facebook page posting
  - Format content for Facebook
  - Handle image attachments
  - Handle link previews
- [x] Task: Implement Facebook engagement fetching
  - Likes, comments, shares, clicks
- [x] Task: Handle Facebook token refresh
  - Long-lived page tokens

### 4.5 LinkedIn Integration

- [x] Task: Implement LinkedIn company page posting
  - Format content for LinkedIn
  - Handle image attachments
- [x] Task: Implement LinkedIn engagement fetching
  - Reactions, comments, shares
- [x] Task: Handle LinkedIn token refresh

### 4.6 Content Generation

- [x] Task: Create job-to-social-post content generator
  - Extract key selling points from job description
  - Format for each platform's style
  - Generate relevant hashtags
- [x] Task: Create content templates for common post types
  - Now Hiring posts
  - Company culture posts
  - Driver testimonial posts
- [x] Task: Implement character limit validation per platform

### 4.7 Scheduler Job Configuration

- [x] Task: Add `processScheduledSocialPosts` job to `src/backend/jobs.config`
  - Schedule: Every 15 minutes (`*/15 * * * *`)
  - Handler: Publish due posts
- [x] Task: Add `refreshSocialTokens` job
  - Schedule: Daily at 3 AM
  - Handler: Refresh expiring tokens
- [x] Task: Add `fetchSocialEngagement` job
  - Schedule: Every 6 hours
  - Handler: Update engagement metrics for recent posts

### 4.8 Frontend Implementation

- [x] Task: Create `src/public/recruiter/Recruiter_Social_Posts.html` page
  - Post calendar view
  - Post list with engagement stats
  - Connected accounts status
- [x] Task: Create social post composer
  - Content editor with character counters
  - Platform-specific previews
  - Media upload/attachment
  - Link input with preview
  - Platform selection checkboxes
  - Schedule date/time picker
- [x] Task: Create social account connection UI
  - OAuth flow initiation
  - Account status display
  - Disconnect option
- [x] Task: Create social analytics view
  - Engagement trends
  - Best performing posts
  - Optimal posting times
- [x] Task: Create job-to-social-post quick action
  - Select job posting
  - Generate content with AI
  - Edit and schedule
- [x] Task: Implement postMessage handlers for:
  - `createSocialPost` - Create post
  - `scheduleSocialPost` - Schedule post
  - `publishSocialPost` - Post immediately
  - `connectSocialAccount` - Initiate OAuth
  - `getSocialAnalytics` - Fetch engagement
- [x] Task: Add Wix page code for Recruiter_Social_Posts

### 4.9 Testing & Verification

- [x] Task: Write unit tests for socialPostingService.jsw
- [x] Task: Test Facebook OAuth flow
- [x] Task: Test LinkedIn OAuth flow
- [x] Task: Test posting to Facebook page
- [x] Task: Test posting to LinkedIn company page
- [x] Task: Test scheduled post processing
- [x] Task: Test token refresh logic
- [x] Task: Verify engagement metrics accuracy
- [x] Task: Conductor - Verify Phase 4 Complete

---

## Dependencies Summary

```
Phase 1 (Email Drip)
    |
    +---> SendGrid API integration
    |
    +---> emailService.jsw (existing email capabilities)
    |
    +---> scheduler.jsw (sequence processing)

Phase 2 (SMS Campaigns)
    |
    +---> Twilio API integration
    |
    +---> Phase 1 patterns (campaign/sequence architecture)
    |
    +---> DriverProfiles (phone numbers, consent)

Phase 3 (Job Board Distribution)
    |
    +---> Indeed API integration
    |
    +---> ZipRecruiter API integration
    |
    +---> CDLjobs API integration (optional)
    |
    +---> JobPostings data model

Phase 4 (Social Posting)
    |
    +---> Facebook Graph API integration
    |
    +---> LinkedIn API integration
    |
    +---> OAuth token management
    |
    +---> AI content generation (Claude)
```

---

## Quality Gates (Per Phase)

Before marking any phase complete:

- [x] All backend services implemented and functional
- [x] All collections created with proper schema and indexes
- [x] External API integrations tested with sandbox/test data
- [x] Webhook handlers implemented with proper validation
- [x] Frontend UI components integrated and responsive
- [x] PostMessage handlers working bidirectionally
- [x] Wix page code connecting frontend to backend
- [x] Scheduler jobs configured and tested
- [x] Manual testing completed successfully
- [x] No console errors in browser or Wix backend
- [x] Performance acceptable (< 2s response time)
- [x] Security review passed (API keys encrypted, webhooks validated)
- [x] Compliance requirements met (TCPA for SMS, CAN-SPAM for email)

---

## Rollout Strategy

### Phase 1 Rollout (Email Drip)

1. Deploy backend service and collections
2. Configure SendGrid integration
3. Deploy frontend UI
4. Enable scheduler job
5. Create initial email templates
6. Pilot with 3-5 carriers
7. Monitor deliverability and engagement
8. Gather feedback and iterate

### Phase 2 Rollout (SMS Campaigns)

1. Deploy backend service and collections
2. Configure Twilio integration
3. Deploy compliance checks
4. Deploy frontend UI
5. Require TCPA training completion for recruiters
6. Pilot with opt-in drivers only
7. Monitor delivery rates and opt-out rates
8. Expand to all carriers after validation

### Phase 3 Rollout (Job Board Distribution)

1. Deploy backend service and collections
2. Establish Indeed partnership/account
3. Establish ZipRecruiter partnership/account
4. Deploy frontend UI
5. Pilot with 5 carriers (manual credential setup)
6. Monitor application quality and volume
7. Automate application matching
8. Expand to all carriers

### Phase 4 Rollout (Social Posting)

1. Deploy backend service and collections
2. Register Facebook/LinkedIn apps
3. Deploy OAuth flow
4. Deploy frontend UI
5. Connect pilot carrier accounts
6. Test posting and engagement tracking
7. Add AI content generation
8. Expand to all carriers

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| SMS delivery failures | Missed outreach | Multiple retry attempts, fallback to email |
| High opt-out rates | Reduced audience | Frequency capping, quality over quantity |
| Email deliverability issues | Messages in spam | SendGrid reputation monitoring, warm-up sending |
| Job board API changes | Broken syndication | Version pinning, monitoring, fallback manual posting |
| Social account disconnection | Posting failures | Token refresh alerts, reconnection prompts |
| TCPA compliance violations | Legal liability | Consent tracking, audit logging, quiet hours |
| Cost overruns (Twilio) | Budget issues | Spending alerts, carrier billing passthrough |
| API rate limiting | Delayed sending | Queue management, backoff strategies |

---

## Cost Estimates

| Component | Cost Model | Estimate (Per Month) |
|-----------|------------|----------------------|
| Twilio SMS | $0.0079/msg | $400-800 (50K-100K messages) |
| SendGrid Email | $0.00067/email | $50-100 (75K-150K emails) |
| Indeed Sponsored | CPC model | Carrier-funded |
| ZipRecruiter | Job slot pricing | Carrier-funded |
| Facebook/LinkedIn | Free (organic) | $0 |

---

## Success Criteria

| Metric | Phase 1 Target | Phase 2 Target | Phase 3 Target | Phase 4 Target |
|--------|----------------|----------------|----------------|----------------|
| Active campaigns | 20+ sequences | 50+ campaigns | 100+ job posts | 200+ posts |
| Engagement rate | 30% open rate | 8% reply rate | 3% apply rate | 5% engagement |
| Recruiter adoption | 50% of recruiters | 75% of recruiters | 80% of recruiters | 60% of recruiters |
| Time saved | 5 hrs/week | 8 hrs/week | 4 hrs/week | 2 hrs/week |
| Cost per hire impact | -10% | -25% | -15% | -5% |
