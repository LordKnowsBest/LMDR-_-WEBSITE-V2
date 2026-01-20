# Specification: Recruiter Outreach - Multi-Channel Campaign Management

## 1. Overview

The Recruiter Outreach system enables recruiters to engage drivers through multiple channels from a unified platform. By combining SMS campaigns (98% open rate), email drip sequences, job board syndication, and social media posting, recruiters can multiply their reach without multiplying their workload.

### Business Value

| Metric | Current State | Target State | Improvement |
|--------|---------------|--------------|-------------|
| Driver contact rate | 15-20% via email alone | 60-70% multi-channel | 3-4x improvement |
| Time to first response | 48-72 hours | 2-4 hours (SMS) | 90% faster |
| Job visibility | Manual posting per board | 1-click multi-board | 5x reach |
| Outreach volume per recruiter | 50 contacts/day manual | 500+ automated | 10x capacity |
| Cost per qualified lead | $75-100 | $25-40 | 60% reduction |

### Core Features

| Feature | Primary Benefit | Channel |
|---------|-----------------|---------|
| **SMS Campaign Manager** | 98% open rate, instant delivery | Twilio |
| **Email Drip Campaigns** | Automated nurture at scale | SendGrid |
| **Job Board Distribution** | One-click multi-board posting | Indeed, ZipRecruiter, CDLjobs |
| **Social Posting** | Organic reach to driver communities | Facebook, LinkedIn |

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
+-------------------------------------------------------------------------+
|                         RECRUITER OUTREACH HUB                           |
|  +-------------------------------------------------------------------+  |
|  |  Campaign Dashboard  |  Template Library  |  Analytics Center     |  |
+--+-------------------------------------------------------------------+--+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                          CAMPAIGN ORCHESTRATOR                           |
|  +---------------+  +---------------+  +---------------+  +----------+  |
|  | SMS Engine    |  | Email Engine  |  | Job Board     |  | Social   |  |
|  | (Twilio)      |  | (SendGrid)    |  | Syndicator    |  | Poster   |  |
|  +---------------+  +---------------+  +---------------+  +----------+  |
+-------------------------------------------------------------------------+
         |                   |                  |                |
         v                   v                  v                v
+-------------------------------------------------------------------------+
|                         EXTERNAL INTEGRATIONS                            |
|  +-------------+  +---------------+  +---------------+  +-----------+   |
|  | Twilio      |  | SendGrid      |  | Job Boards    |  | Social    |   |
|  | - SMS       |  | - Email       |  | - Indeed API  |  | - FB API  |   |
|  | - MMS       |  | - Templates   |  | - ZipRecruiter|  | - LinkedIn|   |
|  | - Opt-out   |  | - Tracking    |  | - CDLjobs     |  | - Twitter |   |
|  +-------------+  +---------------+  +---------------+  +-----------+   |
+-------------------------------------------------------------------------+
         |                   |                  |                |
         v                   v                  v                v
+-------------------------------------------------------------------------+
|                          WIX DATA COLLECTIONS                            |
|  +------------------+  +------------------+  +--------------------+      |
|  | SMSCampaigns     |  | EmailCampaigns   |  | EmailSequences     |      |
|  +------------------+  +------------------+  +--------------------+      |
|  +------------------+  +------------------+  +--------------------+      |
|  | JobPostings      |  | SocialPosts      |  | OutreachAnalytics  |      |
|  +------------------+  +------------------+  +--------------------+      |
+-------------------------------------------------------------------------+
```

### 2.2 Campaign Flow Architecture

```
+------------------+     +-------------------+     +--------------------+
|   RECRUITER      |     |    CAMPAIGN       |     |    CHANNEL         |
|   CREATES        |---->|    SCHEDULER      |---->|    DISPATCHER      |
|   CAMPAIGN       |     |                   |     |                    |
+------------------+     +-------------------+     +--------------------+
       |                         |                        |
       |                         v                        |
       |                 +---------------+                |
       |                 | Audience      |                |
       |                 | Segmentation  |                |
       |                 +---------------+                |
       |                         |                        v
       |                         |              +--------------------+
       |                         |              |  Delivery Status   |
       |                         |              |  - Sent            |
       |                         |              |  - Delivered       |
       |                         |              |  - Opened          |
       |                         |              |  - Clicked         |
       |                         |              |  - Replied         |
       |                         |              |  - Bounced         |
       |                         |              |  - Opted Out       |
       v                         v              +--------------------+
+------------------------------------------------------+      |
|                    ANALYTICS ENGINE                   |<-----+
|  - Campaign performance metrics                      |
|  - A/B test results                                  |
|  - Channel comparison                                |
|  - ROI calculations                                  |
+------------------------------------------------------+
```

### 2.3 Multi-Channel Sequence Flow

```
Driver Enters Campaign
        |
        v
+---------------------------------------+
| Day 0: SMS Introduction               |
| "Hi {name}, {recruiter} here from..." |
+---------------------------------------+
        |
        | (No response in 24h)
        v
+---------------------------------------+
| Day 1: Email with Job Details         |
| Subject: "Opportunity at {carrier}..." |
| Body: Full job description + benefits  |
+---------------------------------------+
        |
        | (No response in 48h)
        v
+---------------------------------------+
| Day 3: Follow-up SMS                  |
| "Just checking if you saw my email..."|
+---------------------------------------+
        |
        | (No response in 72h)
        v
+---------------------------------------+
| Day 5: Final Email                    |
| Subject: "Last chance - {position}..."  |
+---------------------------------------+
        |
        v
+---------------------------------------+
| Campaign Complete                     |
| Move to "Cold" segment if no response |
+---------------------------------------+
```

---

## 3. Data Model

### 3.1 SMS Campaign Collections

#### SMSCampaigns

Master record for SMS campaign definitions.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `_owner` | String | Recruiter member ID |
| `carrier_dot` | String | Associated carrier |
| `campaign_name` | String | Human-readable name |
| `campaign_type` | String | 'blast', 'drip', 'triggered' |
| `status` | String | 'draft', 'scheduled', 'active', 'paused', 'completed' |
| `message_template` | String | Message with {{placeholders}} |
| `message_variants` | Array[Object] | A/B test variants |
| `audience_filter` | Object | Driver selection criteria |
| `audience_count` | Number | Estimated recipients |
| `schedule_type` | String | 'immediate', 'scheduled', 'recurring' |
| `scheduled_time` | DateTime | When to send (if scheduled) |
| `recurring_schedule` | Object | Cron-like schedule for recurring |
| `send_window` | Object | {start_hour, end_hour, timezone, days} |
| `rate_limit` | Number | Messages per minute |
| `opt_out_handling` | String | 'STOP' keyword auto-response |
| `tracking_enabled` | Boolean | Track link clicks |
| `cost_estimate` | Number | Estimated Twilio cost |
| `_createdDate` | DateTime | Created timestamp |
| `_updatedDate` | DateTime | Last modified |

#### SMSMessages

Individual SMS messages sent within campaigns.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `campaign_id` | Reference | FK to SMSCampaigns |
| `driver_id` | Reference | FK to DriverProfiles |
| `phone_number` | String | Recipient phone (E.164 format) |
| `message_body` | String | Rendered message content |
| `variant_id` | String | Which A/B variant (if applicable) |
| `twilio_sid` | String | Twilio message SID |
| `status` | String | 'queued', 'sent', 'delivered', 'failed', 'undelivered' |
| `error_code` | String | Twilio error code if failed |
| `error_message` | String | Error description |
| `sent_at` | DateTime | When message was sent |
| `delivered_at` | DateTime | Delivery confirmation time |
| `cost` | Number | Actual cost from Twilio |
| `reply_received` | Boolean | Driver replied |
| `reply_content` | String | Reply message content |
| `reply_at` | DateTime | When reply received |
| `opted_out` | Boolean | Driver opted out via STOP |
| `_createdDate` | DateTime | Created timestamp |

#### SMSOptOuts

Track drivers who have opted out of SMS communications.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `phone_number` | String | Phone number (E.164) |
| `driver_id` | Reference | FK to DriverProfiles (if known) |
| `carrier_dot` | String | Carrier they opted out from (or 'all') |
| `opted_out_at` | DateTime | When opt-out occurred |
| `opt_out_source` | String | 'STOP_keyword', 'manual', 'carrier_request' |
| `resubscribed` | Boolean | If they opted back in |
| `resubscribed_at` | DateTime | When they opted back in |

### 3.2 Email Campaign Collections

#### EmailCampaigns

Master record for email campaigns.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `_owner` | String | Recruiter member ID |
| `carrier_dot` | String | Associated carrier |
| `campaign_name` | String | Human-readable name |
| `campaign_type` | String | 'one_time', 'drip', 'triggered' |
| `status` | String | 'draft', 'scheduled', 'active', 'paused', 'completed' |
| `from_name` | String | Sender display name |
| `from_email` | String | Sender email address |
| `reply_to` | String | Reply-to email |
| `subject_line` | String | Email subject with {{placeholders}} |
| `subject_variants` | Array[String] | A/B test subjects |
| `preheader` | String | Preview text |
| `template_id` | String | SendGrid template ID |
| `html_content` | String | Custom HTML content |
| `audience_filter` | Object | Driver selection criteria |
| `audience_count` | Number | Estimated recipients |
| `schedule_type` | String | 'immediate', 'scheduled' |
| `scheduled_time` | DateTime | When to send |
| `send_window` | Object | Optimal send time settings |
| `tracking` | Object | {opens: bool, clicks: bool} |
| `unsubscribe_group_id` | String | SendGrid unsubscribe group |
| `_createdDate` | DateTime | Created timestamp |
| `_updatedDate` | DateTime | Last modified |

#### EmailSequences

Drip campaign sequence definitions.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `_owner` | String | Recruiter member ID |
| `carrier_dot` | String | Associated carrier |
| `sequence_name` | String | Human-readable name |
| `description` | String | Sequence purpose |
| `status` | String | 'draft', 'active', 'paused' |
| `trigger_type` | String | What starts the sequence |
| `trigger_conditions` | Object | Trigger criteria |
| `steps` | Array[Object] | Sequence steps (see below) |
| `exit_conditions` | Array[Object] | When to remove from sequence |
| `enrollment_count` | Number | Total drivers enrolled |
| `active_count` | Number | Currently in sequence |
| `completed_count` | Number | Finished sequence |
| `conversion_count` | Number | Achieved goal |
| `_createdDate` | DateTime | Created timestamp |
| `_updatedDate` | DateTime | Last modified |

**Sequence Step Object:**
```javascript
{
  step_number: 1,
  step_type: 'email',  // or 'sms', 'wait', 'condition'
  delay_days: 0,       // days after previous step
  delay_hours: 0,      // hours after previous step
  subject: "Welcome to {{carrierName}}!",
  template_id: "d-abc123",
  html_content: "...",
  conditions: {        // optional conditions
    if_not_opened: true,
    if_not_clicked: true
  }
}
```

#### EmailSequenceEnrollments

Track drivers in active sequences.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `sequence_id` | Reference | FK to EmailSequences |
| `driver_id` | Reference | FK to DriverProfiles |
| `carrier_dot` | String | Carrier context |
| `current_step` | Number | Current step number |
| `status` | String | 'active', 'completed', 'exited', 'paused' |
| `exit_reason` | String | Why they exited (if applicable) |
| `enrolled_at` | DateTime | When enrolled |
| `last_step_at` | DateTime | When last step was executed |
| `next_step_at` | DateTime | When next step is scheduled |
| `step_history` | Array[Object] | Log of completed steps |
| `_createdDate` | DateTime | Created timestamp |
| `_updatedDate` | DateTime | Last modified |

#### EmailMessages

Individual emails sent.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `campaign_id` | Reference | FK to EmailCampaigns (or sequence) |
| `sequence_id` | Reference | FK to EmailSequences (if from sequence) |
| `enrollment_id` | Reference | FK to EmailSequenceEnrollments |
| `driver_id` | Reference | FK to DriverProfiles |
| `email_address` | String | Recipient email |
| `subject` | String | Rendered subject |
| `sendgrid_id` | String | SendGrid message ID |
| `status` | String | 'queued', 'sent', 'delivered', 'bounced', 'dropped' |
| `bounce_type` | String | 'hard', 'soft', 'block' |
| `bounce_reason` | String | Bounce explanation |
| `sent_at` | DateTime | When sent |
| `delivered_at` | DateTime | Delivery time |
| `opened` | Boolean | Email was opened |
| `opened_at` | DateTime | First open time |
| `open_count` | Number | Total opens |
| `clicked` | Boolean | Link was clicked |
| `clicked_at` | DateTime | First click time |
| `click_count` | Number | Total clicks |
| `clicked_links` | Array[String] | URLs clicked |
| `unsubscribed` | Boolean | Unsubscribed from this email |
| `spam_reported` | Boolean | Marked as spam |
| `_createdDate` | DateTime | Created timestamp |

### 3.3 Job Board Collections

#### JobPostings

Job postings syndicated to external boards.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `_owner` | String | Recruiter member ID |
| `carrier_dot` | String | Associated carrier |
| `carrier_id` | Reference | FK to Carriers |
| `job_title` | String | Position title |
| `job_type` | String | 'company_driver', 'owner_operator', 'lease_purchase' |
| `route_type` | String | 'otr', 'regional', 'local', 'dedicated' |
| `description` | String | Full job description (rich text) |
| `requirements` | Object | CDL type, endorsements, experience |
| `compensation` | Object | Pay rate, bonuses, benefits |
| `location` | Object | City, state, zip, radius |
| `equipment` | Object | Truck type, year, amenities |
| `home_time` | String | Home time description |
| `status` | String | 'draft', 'active', 'paused', 'expired', 'filled' |
| `internal_only` | Boolean | Don't syndicate to external boards |
| `syndication_status` | Object | Status per board (see below) |
| `applications_count` | Number | Total applications received |
| `views_count` | Number | Total job views |
| `posted_date` | DateTime | When first posted |
| `expiration_date` | DateTime | When posting expires |
| `_createdDate` | DateTime | Created timestamp |
| `_updatedDate` | DateTime | Last modified |

**Syndication Status Object:**
```javascript
{
  indeed: {
    enabled: true,
    status: 'active',
    external_id: 'ind_123',
    posted_at: '2026-01-20T10:00:00Z',
    url: 'https://indeed.com/job/...',
    applications: 15,
    views: 234
  },
  ziprecruiter: {
    enabled: true,
    status: 'pending',
    external_id: null
  },
  cdljobs: {
    enabled: false
  }
}
```

#### JobBoardCredentials

Store API credentials per carrier/board.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `carrier_dot` | String | Associated carrier |
| `board_name` | String | 'indeed', 'ziprecruiter', 'cdljobs' |
| `api_key` | String | Encrypted API key |
| `employer_id` | String | Board-specific employer ID |
| `is_active` | Boolean | Credentials are valid |
| `last_verified` | DateTime | Last successful API call |
| `monthly_budget` | Number | Spending limit (for sponsored) |
| `_createdDate` | DateTime | Created timestamp |

#### JobApplications

Applications received from job boards.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `job_posting_id` | Reference | FK to JobPostings |
| `carrier_dot` | String | Associated carrier |
| `source_board` | String | 'indeed', 'ziprecruiter', 'cdljobs', 'direct' |
| `external_application_id` | String | Board's application ID |
| `applicant_name` | String | Applicant full name |
| `applicant_email` | String | Applicant email |
| `applicant_phone` | String | Applicant phone |
| `resume_url` | String | Resume file URL |
| `cover_letter` | String | Cover letter text |
| `answers` | Object | Screening question responses |
| `matched_driver_id` | Reference | FK to DriverProfiles (if matched) |
| `status` | String | 'new', 'reviewed', 'contacted', 'rejected', 'hired' |
| `reviewed_by` | String | Recruiter who reviewed |
| `reviewed_at` | DateTime | When reviewed |
| `notes` | String | Recruiter notes |
| `_createdDate` | DateTime | Application received |

### 3.4 Social Media Collections

#### SocialPosts

Social media posts scheduled or published.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `_owner` | String | Recruiter member ID |
| `carrier_dot` | String | Associated carrier |
| `post_type` | String | 'job', 'content', 'engagement' |
| `content` | String | Post text content |
| `media_urls` | Array[String] | Attached images/videos |
| `link_url` | String | Link to include |
| `link_preview` | Object | Title, description, image |
| `platforms` | Array[String] | ['facebook', 'linkedin', 'twitter'] |
| `platform_posts` | Object | Status per platform (see below) |
| `job_posting_id` | Reference | FK to JobPostings (if job post) |
| `status` | String | 'draft', 'scheduled', 'published', 'failed' |
| `scheduled_time` | DateTime | When to post |
| `published_time` | DateTime | When actually posted |
| `engagement` | Object | Aggregated engagement metrics |
| `_createdDate` | DateTime | Created timestamp |
| `_updatedDate` | DateTime | Last modified |

**Platform Posts Object:**
```javascript
{
  facebook: {
    enabled: true,
    target: 'page',        // or 'group'
    target_id: 'fb_page_123',
    target_name: 'ABC Transport Careers',
    status: 'published',
    external_id: 'fb_post_456',
    url: 'https://facebook.com/...',
    likes: 45,
    comments: 12,
    shares: 8,
    clicks: 67
  },
  linkedin: {
    enabled: true,
    target: 'company',
    target_id: 'li_company_789',
    status: 'published',
    external_id: 'li_post_012',
    url: 'https://linkedin.com/...',
    reactions: 23,
    comments: 5,
    shares: 3
  }
}
```

#### SocialAccounts

Connected social media accounts.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `carrier_dot` | String | Associated carrier |
| `platform` | String | 'facebook', 'linkedin', 'twitter' |
| `account_type` | String | 'page', 'group', 'company', 'profile' |
| `account_id` | String | Platform account ID |
| `account_name` | String | Display name |
| `access_token` | String | Encrypted OAuth token |
| `refresh_token` | String | Encrypted refresh token |
| `token_expires` | DateTime | Token expiration |
| `permissions` | Array[String] | Granted permissions |
| `is_active` | Boolean | Account is connected |
| `last_used` | DateTime | Last successful post |
| `_createdDate` | DateTime | Connected timestamp |

### 3.5 Analytics Collections

#### OutreachAnalytics

Aggregated analytics for reporting.

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `carrier_dot` | String | Associated carrier |
| `date` | Date | Analytics date |
| `channel` | String | 'sms', 'email', 'job_board', 'social' |
| `campaign_id` | String | Specific campaign (optional) |
| `metrics` | Object | Channel-specific metrics |
| `cost` | Number | Total spend |
| `conversions` | Number | Goal completions |
| `conversion_value` | Number | Value of conversions |
| `_createdDate` | DateTime | Record created |

---

## 4. API Design

### 4.1 SMS Campaign Service (`smsCampaignService.jsw`)

```javascript
// Create SMS campaign
export async function createSMSCampaign(carrierDot, campaignData) {
  // Input: { name, messageTemplate, audienceFilter, scheduleType, ... }
  // Returns: { success, campaignId, audienceCount, costEstimate }
}

// Get campaigns for carrier
export async function getSMSCampaigns(carrierDot, filters) {
  // filters: { status, dateRange }
  // Returns: { success, campaigns: [] }
}

// Update campaign
export async function updateSMSCampaign(campaignId, updates) {
  // Returns: { success, campaign }
}

// Delete/archive campaign
export async function deleteSMSCampaign(campaignId) {
  // Returns: { success }
}

// Send campaign immediately
export async function sendSMSCampaign(campaignId) {
  // Validates, queues messages, triggers Twilio
  // Returns: { success, messagesQueued, estimatedCost }
}

// Schedule campaign
export async function scheduleSMSCampaign(campaignId, scheduledTime) {
  // Returns: { success, scheduledFor }
}

// Pause active campaign
export async function pauseSMSCampaign(campaignId) {
  // Returns: { success, messagesSent, messagesPending }
}

// Resume paused campaign
export async function resumeSMSCampaign(campaignId) {
  // Returns: { success }
}

// Get campaign analytics
export async function getSMSCampaignAnalytics(campaignId) {
  // Returns: { success, analytics: { sent, delivered, failed, replies, optOuts, cost } }
}

// Process Twilio webhook
export async function processTwilioWebhook(payload, signature) {
  // Handles status callbacks and incoming messages
}

// Check opt-out status
export async function checkOptOutStatus(phoneNumber, carrierDot) {
  // Returns: { optedOut: boolean, optedOutAt }
}

// Manually opt-out driver
export async function optOutDriver(phoneNumber, carrierDot) {
  // Returns: { success }
}
```

### 4.2 Email Campaign Service (`emailCampaignService.jsw`)

```javascript
// Create email campaign
export async function createEmailCampaign(carrierDot, campaignData) {
  // Returns: { success, campaignId, audienceCount }
}

// Get campaigns
export async function getEmailCampaigns(carrierDot, filters) {
  // Returns: { success, campaigns: [] }
}

// Update campaign
export async function updateEmailCampaign(campaignId, updates) {
  // Returns: { success, campaign }
}

// Send campaign
export async function sendEmailCampaign(campaignId) {
  // Returns: { success, emailsQueued }
}

// Get campaign analytics
export async function getEmailCampaignAnalytics(campaignId) {
  // Returns: { success, analytics: { sent, delivered, opens, clicks, bounces, unsubscribes } }
}

// Process SendGrid webhook
export async function processSendGridWebhook(events) {
  // Handles delivery, open, click, bounce events
}

// Create email sequence
export async function createEmailSequence(carrierDot, sequenceData) {
  // Returns: { success, sequenceId }
}

// Get sequences
export async function getEmailSequences(carrierDot) {
  // Returns: { success, sequences: [] }
}

// Update sequence
export async function updateEmailSequence(sequenceId, updates) {
  // Returns: { success, sequence }
}

// Enroll driver in sequence
export async function enrollInSequence(sequenceId, driverId) {
  // Returns: { success, enrollmentId }
}

// Remove driver from sequence
export async function removeFromSequence(enrollmentId, reason) {
  // Returns: { success }
}

// Process sequence steps (scheduler)
export async function processSequenceSteps() {
  // Called by scheduler, executes due sequence steps
  // Returns: { success, stepsProcessed, errors }
}

// Get sequence analytics
export async function getSequenceAnalytics(sequenceId) {
  // Returns: { success, analytics: { enrolled, active, completed, conversions } }
}
```

### 4.3 Job Board Service (`jobBoardService.jsw`)

```javascript
// Create job posting
export async function createJobPosting(carrierDot, jobData) {
  // Returns: { success, jobId }
}

// Get job postings
export async function getJobPostings(carrierDot, filters) {
  // Returns: { success, jobs: [] }
}

// Update job posting
export async function updateJobPosting(jobId, updates) {
  // Returns: { success, job }
}

// Syndicate to job boards
export async function syndicateJob(jobId, boards) {
  // boards: ['indeed', 'ziprecruiter', 'cdljobs']
  // Returns: { success, syndicationStatus }
}

// Remove from job boards
export async function unsyndicateJob(jobId, boards) {
  // Returns: { success }
}

// Refresh job posting on boards
export async function refreshJobPosting(jobId) {
  // Re-posts to bump visibility
  // Returns: { success }
}

// Get job analytics
export async function getJobAnalytics(jobId) {
  // Returns: { success, analytics: { views, applications, byBoard: {} } }
}

// Import applications from boards
export async function importApplications(jobId) {
  // Pulls new applications from all synced boards
  // Returns: { success, newApplications: [] }
}

// Process application webhook
export async function processJobBoardWebhook(board, payload) {
  // Handles incoming application webhooks
}

// Connect job board account
export async function connectJobBoard(carrierDot, board, credentials) {
  // Returns: { success, accountId }
}

// Verify job board credentials
export async function verifyJobBoardCredentials(carrierDot, board) {
  // Returns: { success, isValid }
}
```

### 4.4 Social Posting Service (`socialPostingService.jsw`)

```javascript
// Create social post
export async function createSocialPost(carrierDot, postData) {
  // Returns: { success, postId }
}

// Get social posts
export async function getSocialPosts(carrierDot, filters) {
  // Returns: { success, posts: [] }
}

// Update social post
export async function updateSocialPost(postId, updates) {
  // Returns: { success, post }
}

// Publish post immediately
export async function publishSocialPost(postId) {
  // Returns: { success, platformResults }
}

// Schedule post
export async function scheduleSocialPost(postId, scheduledTime) {
  // Returns: { success, scheduledFor }
}

// Cancel scheduled post
export async function cancelSocialPost(postId) {
  // Returns: { success }
}

// Get post analytics
export async function getSocialPostAnalytics(postId) {
  // Returns: { success, analytics: { byPlatform: {} } }
}

// Process scheduled posts (scheduler)
export async function processScheduledPosts() {
  // Called by scheduler, publishes due posts
  // Returns: { success, postsPublished, errors }
}

// Connect social account
export async function connectSocialAccount(carrierDot, platform, authCode) {
  // OAuth flow completion
  // Returns: { success, accountId }
}

// Disconnect social account
export async function disconnectSocialAccount(accountId) {
  // Returns: { success }
}

// Refresh social account token
export async function refreshSocialToken(accountId) {
  // Returns: { success, expiresAt }
}

// Get connected accounts
export async function getConnectedAccounts(carrierDot) {
  // Returns: { success, accounts: [] }
}

// Generate job post content
export async function generateJobPostContent(jobId, platform) {
  // AI-generated social content from job posting
  // Returns: { success, content, hashtags }
}
```

---

## 5. External API Integrations

### 5.1 Twilio Integration (SMS)

```javascript
// Configuration
const TWILIO_CONFIG = {
  accountSid: 'TWILIO_ACCOUNT_SID',    // From Wix Secrets
  authToken: 'TWILIO_AUTH_TOKEN',       // From Wix Secrets
  messagingServiceSid: 'TWILIO_MSG_SVC' // For high-volume sending
};

// Send SMS
POST https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json
{
  "To": "+15551234567",
  "From": "+15559876543",  // or MessagingServiceSid
  "Body": "Hi John, this is Sarah from ABC Transport...",
  "StatusCallback": "https://www.lastmilecdl.com/_functions/twilio/status"
}

// Response
{
  "sid": "SM123...",
  "status": "queued",
  "price": "-0.0075"
}

// Status Callback Webhook
POST /_functions/twilio/status
{
  "MessageSid": "SM123...",
  "MessageStatus": "delivered",  // queued, sent, delivered, failed, undelivered
  "ErrorCode": "30003",          // if failed
  "ErrorMessage": "..."
}

// Incoming Message Webhook
POST /_functions/twilio/incoming
{
  "From": "+15551234567",
  "To": "+15559876543",
  "Body": "STOP",  // or actual reply
  "MessageSid": "SM456..."
}
```

### 5.2 SendGrid Integration (Email)

```javascript
// Configuration
const SENDGRID_CONFIG = {
  apiKey: 'SENDGRID_API_KEY',  // From Wix Secrets
  webhookSecret: 'SENDGRID_WEBHOOK_SECRET'
};

// Send email
POST https://api.sendgrid.com/v3/mail/send
{
  "personalizations": [{
    "to": [{"email": "driver@email.com", "name": "John Smith"}],
    "dynamic_template_data": {
      "firstName": "John",
      "carrierName": "ABC Transport",
      "jobTitle": "OTR Driver"
    }
  }],
  "from": {"email": "recruiter@abctransport.com", "name": "Sarah Johnson"},
  "template_id": "d-abc123...",
  "tracking_settings": {
    "click_tracking": {"enable": true},
    "open_tracking": {"enable": true}
  }
}

// Event Webhook
POST /_functions/sendgrid/events
[
  {
    "email": "driver@email.com",
    "event": "delivered",
    "timestamp": 1706000000,
    "sg_message_id": "abc123..."
  },
  {
    "email": "driver@email.com",
    "event": "open",
    "timestamp": 1706000100
  }
]
```

### 5.3 Indeed Integration

```javascript
// Configuration
const INDEED_CONFIG = {
  publisherKey: 'INDEED_PUBLISHER_KEY',
  employerApiKey: 'INDEED_EMPLOYER_API_KEY',
  sponsoredApiKey: 'INDEED_SPONSORED_API_KEY'
};

// Post job via XML feed or API
POST https://api.indeed.com/employers/v1/jobs
{
  "title": "CDL Class A Driver - OTR",
  "company": "ABC Transport",
  "location": "Dallas, TX",
  "description": "...",
  "salary": "$0.55-$0.65 CPM",
  "jobType": "Full-time",
  "requirements": "CDL Class A, 2+ years experience"
}

// Response
{
  "jobKey": "abc123...",
  "status": "active",
  "url": "https://www.indeed.com/viewjob?jk=abc123"
}

// Application webhook
POST /_functions/indeed/applications
{
  "jobKey": "abc123...",
  "applicant": {
    "name": "John Smith",
    "email": "john@email.com",
    "phone": "555-123-4567",
    "resume": "https://..."
  }
}
```

### 5.4 ZipRecruiter Integration

```javascript
// Configuration
const ZIPRECRUITER_CONFIG = {
  apiKey: 'ZIPRECRUITER_API_KEY',
  publisherId: 'ZIPRECRUITER_PUBLISHER_ID'
};

// Post job
POST https://api.ziprecruiter.com/jobs/v2
{
  "job_title": "CDL Class A Driver",
  "company_name": "ABC Transport",
  "city": "Dallas",
  "state": "TX",
  "description": "...",
  "salary_interval": "per_mile",
  "salary_min": 0.55,
  "salary_max": 0.65,
  "apply_url": "https://lastmilecdl.com/apply/..."
}

// Response
{
  "id": "zr_123...",
  "status": "active",
  "url": "https://www.ziprecruiter.com/jobs/..."
}
```

### 5.5 LinkedIn Integration

```javascript
// Configuration
const LINKEDIN_CONFIG = {
  clientId: 'LINKEDIN_CLIENT_ID',
  clientSecret: 'LINKEDIN_CLIENT_SECRET',
  redirectUri: 'https://lastmilecdl.com/oauth/linkedin/callback'
};

// Create post on company page
POST https://api.linkedin.com/v2/ugcPosts
{
  "author": "urn:li:organization:12345",
  "lifecycleState": "PUBLISHED",
  "specificContent": {
    "com.linkedin.ugc.ShareContent": {
      "shareCommentary": {
        "text": "We're hiring CDL drivers! $0.55+ CPM..."
      },
      "shareMediaCategory": "ARTICLE",
      "media": [{
        "status": "READY",
        "originalUrl": "https://lastmilecdl.com/jobs/123"
      }]
    }
  },
  "visibility": {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}
```

### 5.6 Facebook Integration

```javascript
// Configuration
const FACEBOOK_CONFIG = {
  appId: 'FACEBOOK_APP_ID',
  appSecret: 'FACEBOOK_APP_SECRET',
  redirectUri: 'https://lastmilecdl.com/oauth/facebook/callback'
};

// Post to page
POST https://graph.facebook.com/v18.0/{page-id}/feed
{
  "message": "Now hiring CDL Class A drivers! Great pay...",
  "link": "https://lastmilecdl.com/jobs/123",
  "access_token": "{page-access-token}"
}

// Response
{
  "id": "12345_67890"
}

// Get post insights
GET https://graph.facebook.com/v18.0/{post-id}/insights
?metric=post_impressions,post_engagements,post_clicks
```

---

## 6. UI Mockups

### 6.1 Campaign Dashboard (Main View)

```
+-------------------------------------------------------------------------+
|  OUTREACH CENTER                                        [+ New Campaign] |
+-------------------------------------------------------------------------+
|                                                                         |
|  CHANNEL OVERVIEW                                    Last 30 Days       |
|  +-------+-------+-------+-------+                                      |
|  |  SMS  | Email |  Jobs | Social|                                      |
|  | 2,341 | 8,456 |   12  |   45  |  <- Messages/Posts sent             |
|  |  98%  |  32%  |  234  |  1.2K |  <- Open Rate / Applications / Reach|
|  |  $175 |  $85  |  $0   |  $0   |  <- Cost                            |
|  +-------+-------+-------+-------+                                      |
|                                                                         |
+-------------------------------------------------------------------------+
|                                                                         |
|  ACTIVE CAMPAIGNS                                       [Filter v]      |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | [SMS] Spring Hiring Blitz              ACTIVE    |  Stats  | [...]|  |
|  | 1,234 sent  |  98% delivered  |  156 replies    |  $92.50        |  |
|  | Started: Jan 15  |  Ends: Jan 31                                  |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | [EMAIL] New Driver Welcome Sequence    ACTIVE    |  Stats  | [...]|  |
|  | 5 steps  |  456 enrolled  |  234 active  |  89 converted         |  |
|  | Trigger: Application submitted                                    |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | [JOB] OTR Driver - Dallas              ACTIVE    |  Stats  | [...]|  |
|  | Indeed: 156 apps  |  ZipRecruiter: 89 apps  |  CDLjobs: 34 apps  |  |
|  | Posted: Jan 10  |  Expires: Feb 10                                |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | [SOCIAL] Weekly Job Highlights         SCHEDULED |  Stats  | [...]|  |
|  | Facebook + LinkedIn  |  Next post: Jan 22 @ 9:00 AM              |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
+-------------------------------------------------------------------------+
```

### 6.2 SMS Campaign Builder

```
+-------------------------------------------------------------------------+
|  CREATE SMS CAMPAIGN                                            [X]     |
+-------------------------------------------------------------------------+
|                                                                         |
|  Campaign Name:                                                         |
|  +-------------------------------------------------------------------+  |
|  | Spring Hiring Blitz - Week 1                                      |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  MESSAGE                                                                |
|  +-------------------------------------------------------------------+  |
|  | Hi {{firstName}}, this is {{recruiterName}} from                  |  |
|  | {{carrierName}}. We have OTR positions paying $0.55+              |  |
|  | CPM with weekly home time. Interested? Reply YES or               |  |
|  | call me at {{recruiterPhone}}.                                    |  |
|  +-------------------------------------------------------------------+  |
|  Characters: 187/160 (2 segments)  |  Est. cost: $0.015/msg             |
|                                                                         |
|  Available Variables:                                                   |
|  [firstName] [lastName] [recruiterName] [recruiterPhone] [carrierName] |
|                                                                         |
|  A/B TESTING                                           [+ Add Variant]  |
|  +-------------------------------------------------------------------+  |
|  | Variant A (50%): Current message above                            |  |
|  | Variant B (50%): "{{firstName}}, quick question - are you..."     |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  AUDIENCE                                                               |
|  +-------------------------------------------------------------------+  |
|  | Drivers matching:                                                 |  |
|  | - CDL Type: Class A                                               |  |
|  | - Status: Job Seeking                                             |  |
|  | - Location: Within 200 miles of Dallas, TX                        |  |
|  | - Has NOT received SMS in last 30 days                            |  |
|  |                                                     [Edit Filters] |  |
|  +-------------------------------------------------------------------+  |
|  Estimated audience: 1,247 drivers                                      |
|  Est. cost: $18.70                                                      |
|                                                                         |
|  SCHEDULE                                                               |
|  ( ) Send immediately                                                   |
|  (*) Schedule for later: [Jan 22, 2026] [9:00 AM] [CST v]              |
|  ( ) Recurring: [Weekly v] on [Monday v]                               |
|                                                                         |
|  SEND WINDOW (respect quiet hours)                                     |
|  [X] Only send between [9:00 AM] and [8:00 PM] recipient local time   |
|  [X] Skip weekends                                                     |
|                                                                         |
|  [Cancel]                           [Save Draft]     [Schedule Send ->] |
|                                                                         |
+-------------------------------------------------------------------------+
```

### 6.3 Email Sequence Builder

```
+-------------------------------------------------------------------------+
|  EMAIL SEQUENCE BUILDER                                         [X]     |
+-------------------------------------------------------------------------+
|                                                                         |
|  Sequence Name: New Driver Welcome Sequence                             |
|  Trigger: [When driver submits application v]                          |
|                                                                         |
|  SEQUENCE STEPS                                                         |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  | STEP 1 - Immediately                                      [Edit]  |  |
|  | Type: Email                                                        |  |
|  | Subject: "Welcome to {{carrierName}} - Next Steps"                |  |
|  | Template: Welcome Email                                            |  |
|  +-------------------------------------------------------------------+  |
|           |                                                              |
|           v                                                              |
|  +-------------------------------------------------------------------+  |
|  | STEP 2 - Wait 2 days                                      [Edit]  |  |
|  | Condition: If email not opened                                    |  |
|  | Type: Email                                                        |  |
|  | Subject: "Did you see our message, {{firstName}}?"                |  |
|  +-------------------------------------------------------------------+  |
|           |                                                              |
|           v                                                              |
|  +-------------------------------------------------------------------+  |
|  | STEP 3 - Wait 1 day                                       [Edit]  |  |
|  | Type: SMS                                                          |  |
|  | Message: "Hi {{firstName}}, following up on your application..."  |  |
|  +-------------------------------------------------------------------+  |
|           |                                                              |
|           v                                                              |
|  +-------------------------------------------------------------------+  |
|  | STEP 4 - Wait 3 days                                      [Edit]  |  |
|  | Condition: If no reply                                            |  |
|  | Type: Email                                                        |  |
|  | Subject: "Last chance - Your opportunity at {{carrierName}}"      |  |
|  +-------------------------------------------------------------------+  |
|           |                                                              |
|           v                                                              |
|       [END]                                                              |
|                                                                         |
|  [+ Add Step]                                                           |
|                                                                         |
|  EXIT CONDITIONS                                                        |
|  [X] Driver replies to any message                                     |
|  [X] Driver is hired                                                   |
|  [X] Driver unsubscribes                                               |
|  [ ] Driver becomes inactive                                           |
|                                                                         |
|  [Cancel]                           [Save Draft]     [Activate ->]     |
|                                                                         |
+-------------------------------------------------------------------------+
```

### 6.4 Job Board Distribution

```
+-------------------------------------------------------------------------+
|  JOB POSTING: CDL Class A Driver - OTR                        [Edit]    |
+-------------------------------------------------------------------------+
|                                                                         |
|  POSTING STATUS                                                         |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |  Platform     |  Status   |  Views  |  Apps  |  Actions           |  |
|  +-------------------------------------------------------------------+  |
|  |  [Indeed]     |  Active   |  1,234  |   156  |  [Refresh] [Remove]|  |
|  |  Posted Jan 10 | Expires Feb 10                                    |  |
|  +-------------------------------------------------------------------+  |
|  |  [ZipRecruiter]| Active   |    867  |    89  |  [Refresh] [Remove]|  |
|  |  Posted Jan 10 | Expires Feb 10                                    |  |
|  +-------------------------------------------------------------------+  |
|  |  [CDLjobs]    |  Active   |    345  |    34  |  [Refresh] [Remove]|  |
|  |  Posted Jan 10 | Expires Feb 10                                    |  |
|  +-------------------------------------------------------------------+  |
|  |  [LMDR Site]  |  Active   |    456  |    67  |                    |  |
|  |  Posted Jan 10 | No expiration                                     |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  TOTAL: 2,902 views  |  346 applications  |  12% conversion rate       |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |  NOT SYNDICATED                                                    |  |
|  |  [ ] Craigslist - [Connect Account]                               |  |
|  |  [ ] Facebook Jobs - [Connect Account]                            |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  RECENT APPLICATIONS                                    [View All ->]  |
|  +-------------------------------------------------------------------+  |
|  | John S. | Indeed | Jan 20 | Class A, 5yr exp | NEW    | [Review] |  |
|  | Maria G. | ZipR  | Jan 20 | Class A, 3yr exp | NEW    | [Review] |  |
|  | Robert T.| CDLjobs| Jan 19 | Class A, 8yr exp | Contacted| [View] |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  [Post to More Boards]                    [Duplicate Posting]          |
|                                                                         |
+-------------------------------------------------------------------------+
```

### 6.5 Social Post Creator

```
+-------------------------------------------------------------------------+
|  CREATE SOCIAL POST                                             [X]     |
+-------------------------------------------------------------------------+
|                                                                         |
|  POST TYPE                                                              |
|  (*) Job Posting   ( ) Company Update   ( ) Industry Content           |
|                                                                         |
|  LINKED JOB: [CDL Class A Driver - OTR v]        [Generate Content]    |
|                                                                         |
|  POST CONTENT                                                           |
|  +-------------------------------------------------------------------+  |
|  | Now Hiring CDL Class A Drivers!                                   |  |
|  |                                                                    |  |
|  | ABC Transport is looking for experienced OTR drivers.             |  |
|  |                                                                    |  |
|  | What we offer:                                                    |  |
|  | - $0.55-$0.65 CPM (experience-based)                              |  |
|  | - $2,500 sign-on bonus                                            |  |
|  | - Weekly home time                                                |  |
|  | - 2024 Freightliner Cascadias                                     |  |
|  | - Full benefits (health, dental, 401k)                            |  |
|  |                                                                    |  |
|  | Apply now: [link]                                                 |  |
|  |                                                                    |  |
|  | #CDLjobs #TruckingJobs #NowHiring #CDLdriver #OTRdriver           |  |
|  +-------------------------------------------------------------------+  |
|  Characters: 423 | Facebook: OK | LinkedIn: OK | Twitter: Over limit   |
|                                                                         |
|  MEDIA                                                  [+ Add Image]   |
|  +-------------------------------------------------------------------+  |
|  | [Truck Image Preview]  |  Remove                                   |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  PLATFORMS                                                              |
|  +-------------------------------------------------------------------+  |
|  | [X] Facebook Page: ABC Transport Careers                          |  |
|  | [X] LinkedIn Company: ABC Transport                               |  |
|  | [ ] Twitter: @ABCTransport (Character limit exceeded)             |  |
|  | [ ] Facebook Group: CDL Drivers - Texas (Coming soon)             |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  SCHEDULE                                                               |
|  ( ) Post immediately                                                   |
|  (*) Schedule: [Jan 22, 2026] [9:00 AM] [CST v]                        |
|                                                                         |
|  PREVIEW                                         [Facebook v]           |
|  +-------------------------------------------------------------------+  |
|  | [Logo] ABC Transport Careers                                      |  |
|  | Now Hiring CDL Class A Drivers!...                                |  |
|  | [Truck Image]                                                      |  |
|  | lastmilecdl.com | Apply Now                                       |  |
|  | Like  Comment  Share                                              |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  [Cancel]                           [Save Draft]     [Schedule Post]   |
|                                                                         |
+-------------------------------------------------------------------------+
```

### 6.6 Campaign Analytics Dashboard

```
+-------------------------------------------------------------------------+
|  OUTREACH ANALYTICS                              [Jan 1 - Jan 20, 2026] |
+-------------------------------------------------------------------------+
|                                                                         |
|  CHANNEL COMPARISON                                                     |
|  +-------------------------------------------------------------------+  |
|  |           |  Sent    |  Delivered |  Opened  |  Clicked |  Cost   |  |
|  +-------------------------------------------------------------------+  |
|  |  SMS      |  2,341   |    2,294   |   98%*   |    N/A   |  $175   |  |
|  |  Email    |  8,456   |    8,120   |   32%    |   12%    |   $85   |  |
|  |  Job Board|    N/A   |      N/A   |   N/A    |   346    |    $0   |  |
|  |  Social   |    45    |      N/A   |  12.4K   |   234    |    $0   |  |
|  +-------------------------------------------------------------------+  |
|  * SMS open rate estimated from delivery + reply rate                   |
|                                                                         |
|  CONVERSION FUNNEL                                                      |
|  +-------------------------------------------------------------------+  |
|  | Reached (all channels)              |  ===============  |  14,234 |  |
|  | Engaged (opened/viewed)             |  ========         |   5,678 |  |
|  | Responded (replied/clicked)         |  ====             |   1,234 |  |
|  | Applied                             |  ==               |     456 |  |
|  | Hired                               |  =                |      23 |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  COST PER ACQUISITION                                                   |
|  +-------------------------------------------------------------------+  |
|  | Cost per reach:    $0.02    |  Cost per engagement:    $0.05     |  |
|  | Cost per response: $0.21    |  Cost per application:   $0.57     |  |
|  | Cost per hire:     $11.30   |  Target:                 <$25.00   |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  TOP PERFORMING CAMPAIGNS                                               |
|  +-------------------------------------------------------------------+  |
|  | 1. SMS: "Hiring Blitz Week 1"      |  156 responses  |  $0.59/r  |  |
|  | 2. Email: "OTR Opportunity"        |  89 clicks      |  $0.95/c  |  |
|  | 3. Job: Indeed OTR Posting         |  156 apps       |  $0.00/a  |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  A/B TEST RESULTS                                                       |
|  +-------------------------------------------------------------------+  |
|  | SMS Campaign: Spring Blitz                                        |  |
|  | Variant A: "Hi {{firstName}}..."      |  Reply: 6.2%  |  WINNER  |  |
|  | Variant B: "Quick question..."        |  Reply: 4.8%  |          |  |
|  | Confidence: 94%  |  Recommended: Use Variant A                    |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  [Export Report]                                  [Schedule Report]     |
|                                                                         |
+-------------------------------------------------------------------------+
```

---

## 7. Scheduler Jobs

| Job | Frequency | Service | Description |
|-----|-----------|---------|-------------|
| `processScheduledSMSCampaigns` | Every 5 min | smsCampaignService.jsw | Send scheduled SMS campaigns |
| `processEmailSequenceSteps` | Every 15 min | emailCampaignService.jsw | Execute due sequence steps |
| `processScheduledSocialPosts` | Every 15 min | socialPostingService.jsw | Publish scheduled social posts |
| `importJobApplications` | Every hour | jobBoardService.jsw | Pull new applications from boards |
| `refreshSocialTokens` | Daily at 3 AM | socialPostingService.jsw | Refresh expiring OAuth tokens |
| `aggregateOutreachAnalytics` | Daily at 4 AM | analyticsService.jsw | Roll up daily analytics |
| `sendCampaignReports` | Weekly Monday 9 AM | analyticsService.jsw | Email weekly reports to recruiters |

---

## 8. Security Considerations

### 8.1 API Key Management

- All external API keys stored in Wix Secrets Manager
- Keys scoped per carrier where possible
- Automatic rotation alerts for expiring credentials
- Rate limiting to prevent abuse

### 8.2 SMS Compliance (TCPA)

- **Opt-in required**: Only message drivers who have consented
- **Opt-out handling**: STOP keyword immediately removes from all campaigns
- **Quiet hours**: Respect 9 AM - 8 PM local time
- **Message frequency**: Max 1 SMS per driver per day per campaign
- **Carrier identification**: All messages must identify the sender

### 8.3 Email Compliance (CAN-SPAM)

- **Unsubscribe link**: Required in all marketing emails
- **Physical address**: Carrier address included in footer
- **Accurate headers**: From address matches sender
- **Unsubscribe processing**: Within 10 business days

### 8.4 Social Media

- **OAuth token storage**: Encrypted at rest
- **Permission scoping**: Request minimum necessary permissions
- **Token refresh**: Automatic before expiration
- **Rate limiting**: Respect platform API limits

---

## 9. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| SMS delivery rate | >95% | Delivered / Sent |
| SMS reply rate | >8% | Replies / Delivered |
| Email open rate | >30% | Opens / Delivered |
| Email click rate | >10% | Clicks / Opens |
| Sequence completion rate | >40% | Completed / Enrolled |
| Job board application rate | >3% | Applications / Views |
| Social engagement rate | >5% | (Likes + Comments + Shares) / Reach |
| Cost per qualified lead | <$25 | Total spend / Qualified applications |
| Time to first contact | <2 hours | Median time from match to outreach |

---

## 10. Open Questions

1. **Twilio pricing**: Should we use a shared number pool or dedicated numbers per carrier?

2. **SendGrid vs alternatives**: Should we consider Mailgun or Postmark for better deliverability?

3. **Job board prioritization**: Indeed has the most traffic, but ZipRecruiter has better CDL targeting. Which first?

4. **Facebook Groups**: Many drivers are in private groups. How do we handle group posting permissions?

5. **AI content generation**: Should we use Claude to generate personalized outreach messages?

6. **Multi-channel sequences**: Should sequences be able to span SMS + Email in one flow?

7. **Cost allocation**: How do we attribute Twilio/SendGrid costs back to individual carriers?

8. **Compliance training**: Should we require recruiters to complete TCPA training before using SMS?
