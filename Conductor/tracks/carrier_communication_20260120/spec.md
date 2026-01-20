# Track Spec: Carrier Communication Hub - Driver Engagement

## 1. Overview

Build a comprehensive communication platform that empowers carriers to engage with their driver workforce through announcements, policy management, recognition programs, and feedback collection. This feature transforms carrier-driver relationships from transactional to relational, directly impacting retention rates.

### 1.1 Business Goals

| Goal | Metric | Target |
|------|--------|--------|
| Increase driver retention | 90-day retention rate | +15% |
| Improve communication reach | Announcement read rate | 85%+ |
| Boost driver satisfaction | Quarterly NPS score | +20 points |
| Reduce policy violations | Compliance incidents | -30% |
| Surface driver concerns | Feedback submission rate | 40%+ of drivers |

### 1.2 Features Summary

1. **Company Announcements** - Push news to all drivers or segments with scheduling and read receipts
2. **Policy Repository** - Centralized driver handbook, safety policies, and SOPs with acknowledgment tracking
3. **Recognition Board** - Celebrate achievements with public feed, badges, and peer nominations
4. **Feedback Channel** - Anonymous driver suggestions with sentiment analysis and response workflow

## 2. Architecture

### 2.1 System Architecture

```
+------------------------------------------------------------------+
|                    CARRIER COMMUNICATION HUB                      |
+------------------------------------------------------------------+
|                                                                    |
|  +------------------+  +------------------+  +------------------+  |
|  |    Announcements |  | Policy Repository|  | Recognition Board|  |
|  |                  |  |                  |  |                  |  |
|  |  - Rich Editor   |  |  - Documents     |  |  - Awards Feed   |  |
|  |  - Scheduling    |  |  - Versions      |  |  - Badge System  |  |
|  |  - Targeting     |  |  - Acknowledgment|  |  - Nominations   |  |
|  |  - Read Receipts |  |  - Compliance    |  |  - Milestones    |  |
|  +--------+---------+  +--------+---------+  +--------+---------+  |
|           |                     |                     |            |
|  +--------v---------+  +--------v---------+  +--------v---------+  |
|  | Feedback Channel |  |  Push Notification |  |   Analytics    |  |
|  |                  |  |      Service       |  |    Service     |  |
|  |  - Anonymous     |  |                  |  |                  |  |
|  |  - Sentiment AI  |  |  - Mobile Push   |  |  - Engagement   |  |
|  |  - Trending      |  |  - Email         |  |  - Compliance   |  |
|  |  - Responses     |  |  - In-App        |  |  - Recognition  |  |
|  +------------------+  +------------------+  +------------------+  |
|                                                                    |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                    EXISTING LMDR SERVICES                         |
+------------------------------------------------------------------+
|  Carriers  |  DriverProfiles  |  emailService  |  memberService   |
+------------------------------------------------------------------+
```

### 2.2 Announcements Flow

```
                    ANNOUNCEMENT CREATION FLOW
                    ==========================

+----------+    +------------+    +------------+    +------------+
| Carrier  | -> | Create     | -> | Configure  | -> | Schedule   |
| Admin    |    | Content    |    | Targeting  |    | or Publish |
+----------+    +------------+    +------------+    +------------+
                     |                 |                   |
                     v                 v                   v
              +-----------+     +-----------+       +-----------+
              | Rich Text |     | Segments: |       | Immediate |
              | Editor    |     | - All     |       | Scheduled |
              | - Text    |     | - Region  |       | Draft     |
              | - Images  |     | - Tenure  |       +-----------+
              | - Links   |     | - Status  |             |
              +-----------+     +-----------+             v
                                                   +-----------+
                                                   | Publish   |
                                                   +-----------+
                                                         |
              +------------------------------------------+
              |                    |                     |
              v                    v                     v
        +-----------+        +-----------+        +-----------+
        | Push      |        | Email     |        | In-App    |
        | Notify    |        | Digest    |        | Banner    |
        +-----------+        +-----------+        +-----------+
              |                    |                     |
              +------------------------------------------+
                                   |
                                   v
                            +-----------+
                            | Driver    |
                            | Views     |
                            +-----------+
                                   |
                                   v
                            +-----------+
                            | Read      |
                            | Receipt   |
                            +-----------+
```

### 2.3 Policy Acknowledgment Flow

```
                    POLICY ACKNOWLEDGMENT FLOW
                    ==========================

+----------+    +------------+    +------------+    +------------+
| Carrier  | -> | Upload     | -> | Set        | -> | Publish    |
| Admin    |    | Document   |    | Required   |    | Version    |
+----------+    +------------+    +------------+    +------------+
                     |                 |                   |
                     v                 v                   v
              +-----------+     +-----------+       +-----------+
              | PDF/Doc   |     | Required  |       | Notify    |
              | Upload    |     | Deadline  |       | Drivers   |
              | Markdown  |     | Target    |       +-----------+
              +-----------+     +-----------+             |
                                                         v
                                                   +-----------+
                                                   | Driver    |
                                                   | Reviews   |
                                                   +-----------+
                                                         |
                                                         v
                                                   +-----------+
                                                   | E-Sign    |
                                                   | Confirm   |
                                                   +-----------+
                                                         |
                                                         v
                                                   +-----------+
                                                   | Compliance|
                                                   | Tracked   |
                                                   +-----------+

              COMPLIANCE DASHBOARD VIEW
              =========================

+------------------------------------------------------------------+
|  POLICY: Driver Safety Handbook v2.3                              |
|  Published: Jan 15, 2026 | Deadline: Jan 30, 2026                 |
+------------------------------------------------------------------+
|                                                                    |
|  Acknowledged: [=========>         ] 67% (134/200 drivers)        |
|                                                                    |
|  +-------------------------+  +-------------------------+          |
|  | Completed (134)         |  | Pending (66)            |          |
|  | - John Smith, 1/16      |  | - Mike Jones (7 days)   |          |
|  | - Jane Doe, 1/17        |  | - Sarah Lee (7 days)    |          |
|  | - Bob Wilson, 1/17      |  | - Tom Brown (7 days)    |          |
|  +-------------------------+  +-------------------------+          |
|                                                                    |
|  [Send Reminder to Pending]  [Export Report]                      |
+------------------------------------------------------------------+
```

### 2.4 Recognition Board Flow

```
                    RECOGNITION FLOW
                    ================

+----------+    +------------+    +------------+    +------------+
| Manager  | -> | Create     | -> | Select     | -> | Add        |
| /Peer    |    | Award      |    | Driver(s)  |    | Message    |
+----------+    +------------+    +------------+    +------------+
                     |                 |                   |
                     v                 v                   v
              +-----------+     +-----------+       +-----------+
              | Award     |     | Search    |       | Personal  |
              | Types:    |     | Driver    |       | Note      |
              | - Safety  |     | Name/ID   |       | (optional)|
              | - Miles   |     +-----------+       +-----------+
              | - Service |                               |
              | - Custom  |                               v
              +-----------+                        +-----------+
                                                   | Publish   |
                                                   | to Board  |
                                                   +-----------+
                                                         |
              +------------------------------------------+
              |                    |                     |
              v                    v                     v
        +-----------+        +-----------+        +-----------+
        | Public    |        | Driver    |        | Badge     |
        | Feed      |        | Notified  |        | Awarded   |
        +-----------+        +-----------+        +-----------+


                    PEER NOMINATION FLOW
                    ====================

+----------+    +------------+    +------------+    +------------+
| Driver   | -> | Nominate   | -> | Manager    | -> | Approved   |
|          |    | Peer       |    | Review     |    | Published  |
+----------+    +------------+    +------------+    +------------+
                     |                 |                   |
                     v                 v                   v
              +-----------+     +-----------+       +-----------+
              | Select    |     | Approve   |       | Add to    |
              | Category  |     | Reject    |       | Feed      |
              | Write Why |     | Edit      |       | Award     |
              +-----------+     +-----------+       | Badge     |
                                                   +-----------+
```

### 2.5 Feedback Channel Flow

```
                    FEEDBACK SUBMISSION FLOW
                    ========================

+----------+    +------------+    +------------+    +------------+
| Driver   | -> | Select     | -> | Write      | -> | Submit     |
| (Anon)   |    | Category   |    | Feedback   |    | Anonymous  |
+----------+    +------------+    +------------+    +------------+
                     |                 |                   |
                     v                 v                   v
              +-----------+     +-----------+       +-----------+
              | Categories|     | Free Text |       | Sentiment |
              | - Safety  |     | Max 2000  |       | Analysis  |
              | - Pay     |     | chars     |       | (AI)      |
              | - Route   |     +-----------+       +-----------+
              | - Manager |                               |
              | - Other   |                               v
              +-----------+                        +-----------+
                                                   | Trend     |
                                                   | Detection |
                                                   +-----------+


                    FEEDBACK RESPONSE WORKFLOW
                    ==========================

+------------------------------------------------------------------+
|  FEEDBACK DASHBOARD                                               |
+------------------------------------------------------------------+
|                                                                    |
|  Filters: [All v]  [This Week v]  [Sentiment: All v]             |
|                                                                    |
|  Trending Topics:                                                 |
|  +----------------+  +----------------+  +----------------+        |
|  | Home Time      |  | Detention Pay  |  | Dispatch Issue|        |
|  | 23 mentions    |  | 18 mentions    |  | 12 mentions   |        |
|  | Sentiment: -   |  | Sentiment: -   |  | Sentiment: -  |        |
|  +----------------+  +----------------+  +----------------+        |
|                                                                    |
+------------------------------------------------------------------+
|  Recent Feedback                                                  |
|  +--------------------------------------------------------------+ |
|  | [Safety] Routes through downtown are unsafe at night          | |
|  | Submitted: 2 hours ago | Sentiment: Negative                  | |
|  | Status: [New] -> [Respond]                                    | |
|  +--------------------------------------------------------------+ |
|  | [Pay] Great job on the detention pay increase!                | |
|  | Submitted: 5 hours ago | Sentiment: Positive                  | |
|  | Status: [Acknowledged]                                        | |
|  +--------------------------------------------------------------+ |
+------------------------------------------------------------------+

                    RESPONSE POSTING
                    ================

+----------+    +------------+    +------------+    +------------+
| Manager  | -> | Review     | -> | Draft      | -> | Publish    |
|          |    | Feedback   |    | Response   |    | Response   |
+----------+    +------------+    +------------+    +------------+
                                       |                   |
                                       v                   v
                                +-----------+       +-----------+
                                | Internal  |       | Public    |
                                | Note      |       | Response  |
                                | (hidden)  |       | (visible) |
                                +-----------+       +-----------+
                                                         |
                                                         v
                                                   +-----------+
                                                   | Driver    |
                                                   | Notified  |
                                                   | (if opted)|
                                                   +-----------+
```

## 3. Data Model

### 3.1 Announcements Collections

#### CarrierAnnouncements Collection
```
_id: String (auto)
carrier_id: Reference -> Carriers
title: String                    // "Holiday Schedule Update"
content: String                  // Rich text/HTML content
content_plain: String            // Plain text for search/preview
priority: String                 // "normal", "important", "urgent"
status: String                   // "draft", "scheduled", "published", "archived"
target_audience: {
  type: String,                  // "all", "segment"
  segments: Array<{
    field: String,               // "region", "tenure_months", "status"
    operator: String,            // "equals", "greater_than", "in"
    value: Any
  }>
}
scheduled_at: Date               // Future publish time (null = immediate)
published_at: Date               // Actual publish time
expires_at: Date                 // Auto-archive date (optional)
allow_comments: Boolean          // Enable driver comments
created_by: String               // Admin user ID
created_at: Date
updated_at: Date
read_count: Number               // Cached read count
total_recipients: Number         // Cached target count
attachments: Array<{
  name: String,
  url: String,
  type: String                   // "pdf", "image", "link"
}>
```

#### AnnouncementReadReceipts Collection
```
_id: String (auto)
announcement_id: Reference -> CarrierAnnouncements
driver_id: Reference -> DriverProfiles
carrier_id: Reference -> Carriers
read_at: Date
device_type: String              // "mobile", "desktop", "email"
time_spent_seconds: Number       // Engagement metric (optional)
```

#### AnnouncementComments Collection
```
_id: String (auto)
announcement_id: Reference -> CarrierAnnouncements
driver_id: Reference -> DriverProfiles
driver_name: String              // Denormalized for display
comment_text: String             // Max 500 chars
is_hidden: Boolean               // Moderation flag
created_at: Date
```

### 3.2 Policy Repository Collections

#### PolicyDocuments Collection
```
_id: String (auto)
carrier_id: Reference -> Carriers
title: String                    // "Driver Safety Handbook"
slug: String                     // URL-friendly identifier
category: String                 // "handbook", "safety", "sop", "compliance", "hr"
description: String              // Brief summary
content_type: String             // "markdown", "pdf", "external_link"
content: String                  // Markdown content or PDF URL
external_url: String             // For linked documents
current_version: Number          // e.g., 2.3
version_history: Array<{
  version: Number,
  published_at: Date,
  change_summary: String,
  content_snapshot: String       // Previous version content
}>
requires_acknowledgment: Boolean
acknowledgment_deadline: Date    // Required completion date
target_audience: {
  type: String,                  // "all", "new_hires", "segment"
  segments: Array<Object>        // Same structure as announcements
}
is_mandatory: Boolean            // Cannot skip acknowledgment
status: String                   // "draft", "published", "archived"
published_at: Date
created_by: String
created_at: Date
updated_at: Date
acknowledgment_count: Number     // Cached count
total_required: Number           // Cached target count
```

#### PolicyAcknowledgments Collection
```
_id: String (auto)
policy_id: Reference -> PolicyDocuments
driver_id: Reference -> DriverProfiles
carrier_id: Reference -> Carriers
version_acknowledged: Number     // Version number signed
acknowledged_at: Date
signature_type: String           // "checkbox", "e_signature", "pin"
ip_address: String               // Audit trail
device_info: String              // Browser/device for audit
```

### 3.3 Recognition Board Collections

#### RecognitionAwards Collection
```
_id: String (auto)
carrier_id: Reference -> Carriers
driver_id: Reference -> DriverProfiles
driver_name: String              // Denormalized for display
driver_photo: String             // Profile photo URL
award_type: String               // "safety", "milestone", "performance", "peer", "custom"
award_category: String           // "safe_miles_100k", "years_of_service_5", etc.
title: String                    // "100,000 Safe Miles"
description: String              // Award details/message
personal_message: String         // From nominator/manager
badge_id: Reference -> RecognitionBadges
is_peer_nomination: Boolean
nominated_by: String             // Driver ID if peer nomination
approved_by: String              // Manager who approved
status: String                   // "pending", "approved", "published", "rejected"
published_at: Date
created_at: Date
likes_count: Number              // Celebration reactions
comments: Array<{
  driver_id: String,
  driver_name: String,
  comment: String,
  created_at: Date
}>
```

#### RecognitionBadges Collection
```
_id: String (auto)
carrier_id: Reference -> Carriers
badge_id: String                 // "safe_miles_100k"
name: String                     // "100K Safe Miles"
description: String              // How to earn this badge
icon: String                     // Badge icon URL or emoji
category: String                 // "safety", "milestone", "performance", "service"
tier: String                     // "bronze", "silver", "gold", "platinum"
threshold: Number                // Numeric threshold (miles, years, etc.)
is_automatic: Boolean            // Auto-award based on data
is_peer_nominatable: Boolean     // Can peers nominate for this
is_active: Boolean
created_at: Date
```

#### DriverBadges Collection (Junction table)
```
_id: String (auto)
driver_id: Reference -> DriverProfiles
badge_id: Reference -> RecognitionBadges
carrier_id: Reference -> Carriers
award_id: Reference -> RecognitionAwards
earned_at: Date
display_on_profile: Boolean      // Driver choice to show
```

#### PeerNominations Collection
```
_id: String (auto)
carrier_id: Reference -> Carriers
nominee_id: Reference -> DriverProfiles
nominee_name: String
nominator_id: Reference -> DriverProfiles
nominator_name: String
category: String                 // "teamwork", "safety", "helpfulness", "professionalism"
reason: String                   // Why they deserve recognition
status: String                   // "pending", "approved", "rejected"
reviewer_id: String              // Manager who reviewed
reviewer_notes: String           // Internal notes
reviewed_at: Date
created_at: Date
```

### 3.4 Feedback Channel Collections

#### DriverFeedback Collection
```
_id: String (auto)
carrier_id: Reference -> Carriers
feedback_id: String              // Anonymous reference ID for driver
category: String                 // "safety", "pay", "routes", "dispatch", "equipment", "management", "other"
subcategory: String              // More specific topic
content: String                  // Feedback text (max 2000 chars)
sentiment_score: Number          // -1 to 1 (AI-analyzed)
sentiment_label: String          // "positive", "neutral", "negative"
topics_detected: Array<String>   // AI-extracted topics ["home_time", "detention_pay"]
status: String                   // "new", "reviewing", "responded", "closed", "flagged"
priority: String                 // "low", "medium", "high" (based on sentiment/volume)
is_anonymous: Boolean            // Always true for privacy
notify_on_response: Boolean      // Driver opted in for response notification
response_token: String           // Unique token for anonymous response notification
submitted_at: Date
reviewed_at: Date
reviewed_by: String
internal_notes: String           // Manager notes (not visible to driver)
```

#### FeedbackResponses Collection
```
_id: String (auto)
feedback_id: Reference -> DriverFeedback
carrier_id: Reference -> Carriers
response_text: String            // Public response to driver
response_type: String            // "acknowledgment", "explanation", "action_taken", "question"
is_public: Boolean               // Visible to all drivers (anonymized) or just submitter
responded_by: String             // Manager user ID
responded_at: Date
driver_notified: Boolean
driver_notified_at: Date
```

#### FeedbackTrends Collection (Aggregated daily)
```
_id: String (auto)
carrier_id: Reference -> Carriers
date: Date                       // Aggregation date
total_submissions: Number
sentiment_breakdown: {
  positive: Number,
  neutral: Number,
  negative: Number
}
category_breakdown: Object       // { safety: 5, pay: 3, ... }
top_topics: Array<{
  topic: String,
  count: Number,
  sentiment_avg: Number
}>
response_rate: Number            // Percentage responded
avg_response_time_hours: Number
```

### 3.5 Notification Settings Collections

#### CarrierNotificationSettings Collection
```
_id: String (auto)
carrier_id: Reference -> Carriers
announcement_channels: {
  push_enabled: Boolean,
  email_enabled: Boolean,
  email_digest: String           // "immediate", "daily", "weekly"
}
policy_reminder_days: Array<Number>  // [7, 3, 1] days before deadline
recognition_notifications: Boolean
feedback_alerts: {
  new_submission: Boolean,
  negative_sentiment_threshold: Number  // Alert if below this
  volume_threshold: Number       // Alert if more than X in 24h
}
```

#### DriverNotificationPreferences Collection
```
_id: String (auto)
driver_id: Reference -> DriverProfiles
carrier_id: Reference -> Carriers
announcement_push: Boolean
announcement_email: Boolean
policy_reminders: Boolean
recognition_notifications: Boolean
feedback_response_notify: Boolean
```

## 4. API Design

### 4.1 Announcements Service (carrierAnnouncementsService.jsw)

```javascript
// Carrier Admin Operations
createAnnouncement(carrierDot, data)           // Create new announcement
updateAnnouncement(announcementId, updates)    // Edit draft/scheduled
publishAnnouncement(announcementId)            // Publish immediately
scheduleAnnouncement(announcementId, datetime) // Schedule for future
archiveAnnouncement(announcementId)            // Move to archive

// Content Management
uploadAttachment(announcementId, file)         // Add file attachment
removeAttachment(announcementId, attachmentId) // Remove attachment

// Targeting
previewRecipients(carrierDot, targetAudience)  // Preview who will receive
getDriverSegments(carrierDot)                  // Available segments

// Analytics
getAnnouncementStats(announcementId)           // Read rates, engagement
getReadReceipts(announcementId, options)       // Paginated read list
getUnreadDrivers(announcementId)               // Who hasn't read

// Driver Operations
getAnnouncementsForDriver(driverId, options)   // Driver's feed
markAnnouncementRead(announcementId, driverId) // Record read
addComment(announcementId, driverId, comment)  // Driver comment
```

### 4.2 Policy Service (carrierPolicyService.jsw)

```javascript
// Document Management
createPolicy(carrierDot, data)                 // Create new policy
updatePolicy(policyId, updates)                // Edit policy
publishPolicyVersion(policyId, changeSummary)  // Publish new version
archivePolicy(policyId)                        // Archive document
uploadPolicyFile(policyId, file)               // Upload PDF

// Acknowledgment Configuration
setAcknowledgmentRequired(policyId, required, deadline)
setTargetAudience(policyId, audience)
sendReminders(policyId)                        // Send to pending drivers

// Compliance Tracking
getComplianceStatus(policyId)                  // Overall completion
getAcknowledgmentList(policyId, status)        // Completed/pending
getDriverPolicyStatus(driverId)                // All policies for driver
exportComplianceReport(policyId, format)       // CSV/PDF export

// Driver Operations
getPoliciesForDriver(driverId)                 // Required policies
getPolicyContent(policyId, driverId)           // View policy
acknowledgePolicy(policyId, driverId, signature) // Sign/acknowledge
getAcknowledgmentHistory(driverId)             // Driver's signatures
```

### 4.3 Recognition Service (carrierRecognitionService.jsw)

```javascript
// Award Management
createAward(carrierDot, data)                  // Create recognition
approveAward(awardId)                          // Manager approval
rejectAward(awardId, reason)                   // Reject nomination
publishAward(awardId)                          // Publish to board

// Badge Configuration
createBadge(carrierDot, data)                  // Define new badge
updateBadge(badgeId, updates)                  // Edit badge
getBadgeLibrary(carrierDot)                    // All carrier badges
awardBadge(driverId, badgeId, awardId)         // Give badge to driver

// Peer Nominations
submitNomination(nominatorId, nomineeId, data) // Peer nominates peer
getNominationsForReview(carrierDot)            // Pending queue
reviewNomination(nominationId, action, notes)  // Approve/reject

// Recognition Feed
getRecognitionFeed(carrierDot, options)        // Public feed
getDriverAwards(driverId)                      // Driver's achievements
getDriverBadges(driverId)                      // Driver's badges
likeAward(awardId, driverId)                   // Celebrate reaction
commentOnAward(awardId, driverId, comment)     // Add congratulations

// Analytics
getRecognitionStats(carrierDot, dateRange)     // Award counts, categories
getTopRecognizedDrivers(carrierDot, period)    // Leaderboard
```

### 4.4 Feedback Service (carrierFeedbackService.jsw)

```javascript
// Driver Submission (Anonymous)
submitFeedback(carrierDot, data)               // Anonymous submission
getMyFeedbackStatus(feedbackToken)             // Check response status

// Management Dashboard
getFeedbackDashboard(carrierDot, filters)      // Overview with trends
getFeedbackList(carrierDot, filters, options)  // Paginated list
getFeedbackDetail(feedbackId)                  // Single feedback
updateFeedbackStatus(feedbackId, status)       // Change status
addInternalNote(feedbackId, note)              // Manager notes

// Response Workflow
respondToFeedback(feedbackId, response)        // Post response
getResponseTemplates(carrierDot)               // Saved templates
createResponseTemplate(carrierDot, template)   // Save template

// Trends & Analytics
getFeedbackTrends(carrierDot, dateRange)       // Trend analysis
getTopicAnalysis(carrierDot, dateRange)        // Topic clustering
getSentimentOverTime(carrierDot, dateRange)    // Sentiment trends
exportFeedbackReport(carrierDot, dateRange)    // Export for analysis

// AI Analysis
analyzeFeedbackSentiment(content)              // Real-time sentiment
extractTopics(content)                         // Topic detection
```

### 4.5 Notification Service (carrierNotificationService.jsw)

```javascript
// Configuration
getNotificationSettings(carrierDot)            // Get carrier settings
updateNotificationSettings(carrierDot, settings) // Update settings

// Push Notifications
sendAnnouncementPush(announcementId)           // Push to drivers
sendPolicyReminder(policyId, driverIds)        // Reminder push
sendRecognitionNotification(awardId)           // Award notification

// Email Notifications
sendAnnouncementEmail(announcementId)          // Email to drivers
sendPolicyDeadlineEmail(policyId)              // Deadline reminder
sendFeedbackResponseEmail(feedbackToken)       // Anonymous response

// Driver Preferences
getDriverNotificationPrefs(driverId, carrierDot)
updateDriverNotificationPrefs(driverId, carrierDot, prefs)
```

## 5. UI Mockups

### 5.1 Announcements Dashboard (Carrier Admin)

```
+------------------------------------------------------------------+
|  COMPANY ANNOUNCEMENTS                           [+ New Announcement]|
+------------------------------------------------------------------+
|                                                                    |
|  Filters: [Status: All v]  [Priority: All v]  [Date Range v]      |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  PUBLISHED                                                         |
|  +--------------------------------------------------------------+ |
|  | [!] URGENT: Weather Alert - I-40 Closures                     | |
|  |     Published: Jan 20, 2026, 9:15 AM                          | |
|  |     Target: Oklahoma Region (45 drivers)                       | |
|  |     Read: 42/45 (93%) [==============================>    ]   | |
|  |     [View Details]  [Archive]                                  | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Holiday Schedule Update 2026                                   | |
|  |     Published: Jan 18, 2026, 2:00 PM                          | |
|  |     Target: All Drivers (200 drivers)                          | |
|  |     Read: 156/200 (78%) [========================>        ]   | |
|  |     [View Details]  [Send Reminder]  [Archive]                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  SCHEDULED                                                         |
|  +--------------------------------------------------------------+ |
|  | New Benefits Program Launch                                    | |
|  |     Scheduled: Feb 1, 2026, 8:00 AM                           | |
|  |     Target: All Drivers                                        | |
|  |     [Edit]  [Preview]  [Cancel]                               | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  DRAFTS                                                            |
|  +--------------------------------------------------------------+ |
|  | Q1 Safety Initiative                                           | |
|  |     Last edited: Jan 19, 2026                                 | |
|  |     [Edit]  [Preview]  [Delete]                               | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### 5.2 Create Announcement

```
+------------------------------------------------------------------+
|  CREATE ANNOUNCEMENT                                    [X Close]  |
+------------------------------------------------------------------+
|                                                                    |
|  Title *                                                          |
|  +--------------------------------------------------------------+ |
|  | Holiday Schedule Update 2026                                  | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  Priority                                                         |
|  ( ) Normal  ( ) Important  (x) Urgent                            |
|                                                                    |
|  Content *                                                        |
|  +--------------------------------------------------------------+ |
|  | [B] [I] [U] | [Link] [Image] | [H1] [H2] | [List]             | |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  | Dear Drivers,                                                  | |
|  |                                                                | |
|  | We are pleased to announce the 2026 holiday schedule...       | |
|  |                                                                | |
|  | **Key Dates:**                                                 | |
|  | - Memorial Day: May 25                                         | |
|  | - Independence Day: July 4                                     | |
|  |                                                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  Attachments                                                      |
|  +--------------------------------------------------------------+ |
|  | [+] Add Attachment                                             | |
|  | [ ] holiday_schedule_2026.pdf                          [X]    | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  Target Audience                                                  |
|  (x) All Drivers                                                  |
|  ( ) Specific Segments                                            |
|      [ ] Region: [Select...]  [ ] Tenure: [Select...]            |
|                                                                    |
|  Publishing                                                       |
|  (x) Publish Immediately                                          |
|  ( ) Schedule for Later: [Date Picker] [Time Picker]              |
|                                                                    |
|  [ ] Allow driver comments                                        |
|                                                                    |
|  Preview Recipients: 200 drivers                                  |
|                                                                    |
|  [Save Draft]                    [Preview]  [Publish]             |
|                                                                    |
+------------------------------------------------------------------+
```

### 5.3 Driver Announcements Feed

```
+------------------------------------------------------------------+
|  COMPANY NEWS                                                      |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | [!] URGENT                                      Jan 20, 9:15 AM| |
|  |                                                                 | |
|  | Weather Alert - I-40 Closures                                  | |
|  |                                                                 | |
|  | Due to severe weather conditions, portions of I-40 between    | |
|  | Oklahoma City and Amarillo are closed. Please check TxDOT     | |
|  | and ODOT for updates before departing...                      | |
|  |                                                                 | |
|  | [Read Full Announcement]                                       | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | [NEW]                                           Jan 18, 2:00 PM| |
|  |                                                                 | |
|  | Holiday Schedule Update 2026                                   | |
|  |                                                                 | |
|  | Dear Drivers, We are pleased to share the official 2026       | |
|  | holiday schedule. Please review the attached document for...   | |
|  |                                                                 | |
|  | Attachment: holiday_schedule_2026.pdf                          | |
|  |                                                                 | |
|  | [Read Full Announcement]                                       | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | [READ]                                          Jan 15, 10:30 AM|
|  |                                                                 | |
|  | New Fuel Card Procedures                                       | |
|  |                                                                 | |
|  | Effective February 1, we are transitioning to a new fuel      | |
|  | card provider. Please complete the attached training...        | |
|  |                                                                 | |
|  | [View Again]                                                    | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  [Load More]                                                       |
|                                                                    |
+------------------------------------------------------------------+
```

### 5.4 Policy Repository (Carrier Admin)

```
+------------------------------------------------------------------+
|  POLICY REPOSITORY                                   [+ New Policy] |
+------------------------------------------------------------------+
|                                                                    |
|  Categories: [All v]  Search: [______________________] [Search]   |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  HANDBOOKS                                                         |
|  +--------------------------------------------------------------+ |
|  | Driver Safety Handbook                           v2.3          | |
|  | Published: Jan 15, 2026 | Requires Acknowledgment             | |
|  | Compliance: 67% (134/200) [==================>           ]    | |
|  | Deadline: Jan 30, 2026 (10 days remaining)                    | |
|  | [View]  [Edit]  [Compliance Report]  [Send Reminders]         | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Employee Handbook                                v1.5          | |
|  | Published: Dec 1, 2025 | Requires Acknowledgment              | |
|  | Compliance: 100% (200/200) [================================] | |
|  | [View]  [Edit]  [New Version]                                  | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  SAFETY POLICIES                                                   |
|  +--------------------------------------------------------------+ |
|  | Pre-Trip Inspection SOP                          v3.1          | |
|  | Published: Jan 10, 2026 | Optional                             | |
|  | Views: 145 drivers                                              | |
|  | [View]  [Edit]  [Make Required]                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Hazmat Handling Procedures                       v2.0          | |
|  | Published: Nov 15, 2025 | Requires Acknowledgment             | |
|  | Target: Hazmat Endorsed (45 drivers)                           | |
|  | Compliance: 100% (45/45) [================================]   | |
|  | [View]  [Edit]                                                  | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### 5.5 Policy Compliance Dashboard

```
+------------------------------------------------------------------+
|  COMPLIANCE: Driver Safety Handbook v2.3                           |
+------------------------------------------------------------------+
|                                                                    |
|  Published: Jan 15, 2026                                          |
|  Deadline: Jan 30, 2026 (10 days remaining)                       |
|  Target: All Drivers (200)                                        |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  |  Overall Compliance: 67%                                       | |
|  |                                                                | |
|  |  [========================>                               ]    | |
|  |                                                                | |
|  |  Completed: 134        Pending: 66                            | |
|  |                                                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  [Send Reminder to 66 Pending]  [Export Report]  [Download PDF]   |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  Filter: [All v]  Search: [______________________]                |
|                                                                    |
|  PENDING ACKNOWLEDGMENTS (66)                                      |
|  +--------------------------------------------------------------+ |
|  | Driver Name          | Days Until Deadline | Last Reminded    | |
|  +--------------------------------------------------------------+ |
|  | Mike Johnson         | 10 days            | Never            | |
|  | Sarah Williams       | 10 days            | Jan 18           | |
|  | Tom Anderson         | 10 days            | Never            | |
|  | Lisa Martinez        | 10 days            | Jan 18           | |
|  | ...                                                            | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  COMPLETED (134)                                                   |
|  +--------------------------------------------------------------+ |
|  | Driver Name          | Acknowledged On    | Method           | |
|  +--------------------------------------------------------------+ |
|  | John Smith           | Jan 16, 2026       | E-Signature      | |
|  | Jane Doe             | Jan 17, 2026       | Checkbox         | |
|  | Bob Wilson           | Jan 17, 2026       | E-Signature      | |
|  | ...                                                            | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### 5.6 Driver Policy View

```
+------------------------------------------------------------------+
|  POLICIES & DOCUMENTS                                              |
+------------------------------------------------------------------+
|                                                                    |
|  ACTION REQUIRED                                                   |
|  +--------------------------------------------------------------+ |
|  | [!] Driver Safety Handbook v2.3                                | |
|  |     Acknowledgment required by: Jan 30, 2026                   | |
|  |     [Review & Acknowledge]                                     | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  ALL POLICIES                                                      |
|  +--------------------------------------------------------------+ |
|  | Employee Handbook v1.5                           [Acknowledged]| |
|  |     Signed: Dec 5, 2025                                        | |
|  |     [View Document]                                            | |
|  +--------------------------------------------------------------+ |
|  | Pre-Trip Inspection SOP v3.1                     [View]        | |
|  |     Last updated: Jan 10, 2026                                 | |
|  +--------------------------------------------------------------+ |
|  | Hazmat Handling Procedures v2.0                  [Acknowledged]| |
|  |     Signed: Nov 20, 2025                                       | |
|  |     [View Document]                                            | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+

                    ACKNOWLEDGMENT MODAL
                    ====================

+------------------------------------------------------------------+
|  ACKNOWLEDGE: Driver Safety Handbook v2.3              [X Close]   |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+ |
|  |                                                                | |
|  |  [PDF Viewer / Markdown Content]                              | |
|  |                                                                | |
|  |  Page 1 of 24                              [< Prev] [Next >]  | |
|  |                                                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | [x] I have read and understand the Driver Safety Handbook     | |
|  |     v2.3 dated January 15, 2026.                              | |
|  |                                                                | |
|  | [x] I agree to comply with all policies and procedures        | |
|  |     outlined in this document.                                 | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  E-Signature:                                                      |
|  +--------------------------------------------------------------+ |
|  | [Sign Here with Mouse/Touch]                                   | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  [Clear Signature]                          [Submit Acknowledgment]|
|                                                                    |
+------------------------------------------------------------------+
```

### 5.7 Recognition Board (Public Feed)

```
+------------------------------------------------------------------+
|  RECOGNITION BOARD                              [Nominate a Driver] |
+------------------------------------------------------------------+
|                                                                    |
|  Filter: [All v]  [This Month v]                                  |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | [Photo]  JOHN SMITH                              Jan 20, 2026 | |
|  |                                                                | |
|  |  [GOLD BADGE] 1 MILLION SAFE MILES                            | |
|  |                                                                | |
|  |  Congratulations to John Smith for reaching an incredible     | |
|  |  milestone - 1,000,000 miles without a preventable accident!  | |
|  |                                                                | |
|  |  "John represents the best of our team. His dedication to     | |
|  |   safety is an inspiration to us all." - Mike Davis, Safety   | |
|  |                                                                | |
|  |  Badges Earned: [1M Miles] [10 Years]                         | |
|  |                                                                | |
|  |  [Celebrate: 24]  [Comment: 8]                                | |
|  |  ------------------------------------------------------------ | |
|  |  Latest: "Way to go John! Legend!" - TruckerTom               | |
|  |  [View all comments]                                           | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | [Photo]  SARAH WILLIAMS                          Jan 18, 2026 | |
|  |                                                                | |
|  |  [PEER NOMINATION] TEAM PLAYER AWARD                          | |
|  |                                                                | |
|  |  Nominated by: Mike Johnson                                    | |
|  |                                                                | |
|  |  "Sarah covered my route last week when my kid got sick.      | |
|  |   Didn't complain, just stepped up. True team player."        | |
|  |                                                                | |
|  |  Badges Earned: [Team Player]                                  | |
|  |                                                                | |
|  |  [Celebrate: 15]  [Comment: 3]                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | [Photo]  BOB WILSON                              Jan 15, 2026 | |
|  |                                                                | |
|  |  [SILVER BADGE] 5 YEARS OF SERVICE                            | |
|  |                                                                | |
|  |  Happy work anniversary, Bob! Thank you for 5 years of        | |
|  |  dedication and hard work. Here's to many more!               | |
|  |                                                                | |
|  |  Badges Earned: [5 Years] [100K Miles] [Perfect Attendance]   | |
|  |                                                                | |
|  |  [Celebrate: 18]  [Comment: 5]                                | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  [Load More]                                                       |
|                                                                    |
+------------------------------------------------------------------+
```

### 5.8 Peer Nomination Form

```
+------------------------------------------------------------------+
|  NOMINATE A DRIVER                                     [X Close]   |
+------------------------------------------------------------------+
|                                                                    |
|  Who would you like to recognize?                                 |
|  +--------------------------------------------------------------+ |
|  | Search driver name... [___________________]                    | |
|  | Suggestions:                                                   | |
|  | - John Smith                                                   | |
|  | - John Davis                                                   | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  Selected: [Photo] Sarah Williams                                 |
|                                                                    |
|  What category?                                                   |
|  ( ) Team Player - Helped a fellow driver                         |
|  (x) Safety Champion - Demonstrated exceptional safety            |
|  ( ) Customer Service - Went above and beyond for customers       |
|  ( ) Mentorship - Helped a new driver succeed                     |
|  ( ) Professionalism - Represented the company well               |
|                                                                    |
|  Why are they deserving? *                                        |
|  +--------------------------------------------------------------+ |
|  | Sarah noticed my trailer tire was low during a fuel stop     | |
|  | and let me know before it became a problem. Could have       | |
|  | been a blowout on the highway. Looking out for each other!   | |
|  |                                                                | |
|  +--------------------------------------------------------------+ |
|  Character count: 198/500                                         |
|                                                                    |
|  Note: Your name will be shown as the nominator.                  |
|  Nomination will be reviewed by management before publishing.      |
|                                                                    |
|                                            [Cancel]  [Submit]      |
|                                                                    |
+------------------------------------------------------------------+
```

### 5.9 Feedback Submission (Driver)

```
+------------------------------------------------------------------+
|  SHARE YOUR FEEDBACK                                               |
+------------------------------------------------------------------+
|                                                                    |
|  Your feedback is 100% anonymous. We value your honest input      |
|  to help improve our company.                                      |
|                                                                    |
|  What's this about? *                                             |
|  +--------------------------------------------------------------+ |
|  | ( ) Safety concerns                                            | |
|  | ( ) Pay and compensation                                       | |
|  | (x) Home time and scheduling                                   | |
|  | ( ) Dispatch and communication                                 | |
|  | ( ) Equipment and maintenance                                  | |
|  | ( ) Management                                                 | |
|  | ( ) Other                                                      | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  Your feedback *                                                  |
|  +--------------------------------------------------------------+ |
|  | I've been requesting home time for my daughter's graduation   | |
|  | for 2 months now and keep getting told "we'll see." This is  | |
|  | a once-in-a-lifetime event and I need to know if I can be    | |
|  | there. Better communication about time-off requests would     | |
|  | really help driver morale.                                    | |
|  |                                                                | |
|  +--------------------------------------------------------------+ |
|  Character count: 342/2000                                        |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | [ ] Notify me when there's a response                         | |
|  |     (Your identity remains anonymous - we'll use a secure     | |
|  |      token to notify you)                                      | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|                                            [Cancel]  [Submit]      |
|                                                                    |
+------------------------------------------------------------------+
```

### 5.10 Feedback Dashboard (Carrier Admin)

```
+------------------------------------------------------------------+
|  DRIVER FEEDBACK DASHBOARD                                         |
+------------------------------------------------------------------+
|                                                                    |
|  Overview - Last 30 Days                                          |
|  +------------------+  +------------------+  +------------------+  |
|  | Total Feedback   |  | Response Rate    |  | Avg Response Time|  |
|  |       47         |  |      78%         |  |     12 hours     |  |
|  +------------------+  +------------------+  +------------------+  |
|                                                                    |
|  Sentiment Distribution                                           |
|  +--------------------------------------------------------------+ |
|  | Positive [=========>                    ] 23%                 | |
|  | Neutral  [===============>              ] 38%                 | |
|  | Negative [===================>          ] 39%                 | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  TRENDING TOPICS (AI-Detected)                                    |
|  +----------------+  +----------------+  +----------------+        |
|  | Home Time      |  | Detention Pay  |  | Dispatch Comm  |        |
|  | 12 mentions    |  | 8 mentions     |  | 6 mentions     |        |
|  | Sentiment: -0.6|  | Sentiment: -0.4|  | Sentiment: -0.3|        |
|  | [View All]     |  | [View All]     |  | [View All]     |        |
|  +----------------+  +----------------+  +----------------+        |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  Filter: [All Categories v]  [All Status v]  [This Week v]        |
|                                                                    |
|  RECENT FEEDBACK                                                   |
|  +--------------------------------------------------------------+ |
|  | [NEW] Home Time | Negative                     2 hours ago    | |
|  | "I've been requesting home time for my daughter's graduation  | |
|  |  for 2 months now..."                                         | |
|  | [View Full]  [Respond]                                        | |
|  +--------------------------------------------------------------+ |
|  | [RESPONDED] Pay | Positive                    5 hours ago     | |
|  | "Great job on the detention pay increase! This makes a       | |
|  |  real difference for drivers like me..."                     | |
|  | Response: "Thank you for the positive feedback!..."          | |
|  | [View Full]                                                   | |
|  +--------------------------------------------------------------+ |
|  | [REVIEWING] Safety | Negative                  1 day ago      | |
|  | "The route through downtown Memphis is dangerous at night..." | |
|  | Internal Note: "Escalated to safety team - John reviewing"   | |
|  | [View Full]  [Respond]                                        | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  [Load More]                                    [Export Report]    |
|                                                                    |
+------------------------------------------------------------------+
```

### 5.11 Feedback Response Modal

```
+------------------------------------------------------------------+
|  RESPOND TO FEEDBACK                                   [X Close]   |
+------------------------------------------------------------------+
|                                                                    |
|  FEEDBACK DETAILS                                                  |
|  Category: Home Time | Submitted: 2 hours ago | Sentiment: Negative|
|  +--------------------------------------------------------------+ |
|  | "I've been requesting home time for my daughter's graduation  | |
|  |  for 2 months now and keep getting told 'we'll see.' This is | |
|  |  a once-in-a-lifetime event and I need to know if I can be   | |
|  |  there. Better communication about time-off requests would    | |
|  |  really help driver morale."                                  | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  INTERNAL NOTES (Not visible to driver)                           |
|  +--------------------------------------------------------------+ |
|  | Reviewed with dispatch - we need to improve our time-off     | |
|  | request process. Escalating to operations.                    | |
|  | - Jane, Jan 20                                                | |
|  +--------------------------------------------------------------+ |
|  | [Add Note]                                                     | |
|                                                                    |
|  YOUR RESPONSE (Visible to driver)                                |
|  +--------------------------------------------------------------+ |
|  | Thank you for sharing this feedback. We hear you - important | |
|  | family events should not be uncertain.                        | |
|  |                                                                | |
|  | We're implementing a new policy: time-off requests for       | |
|  | major family events (graduations, weddings, etc.) will get   | |
|  | a response within 48 hours, and we'll prioritize approval.   | |
|  |                                                                | |
|  | If you've submitted a request for your daughter's graduation,| |
|  | please resubmit through the new system and mark it as        | |
|  | "Family Event" - you'll hear back within 48 hours.           | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  Response Type:                                                   |
|  ( ) Acknowledgment  (x) Action Taken  ( ) Needs More Info        |
|                                                                    |
|  [ ] Make response visible to all drivers (anonymized feedback)   |
|                                                                    |
|  Templates: [Select saved response... v]                          |
|                                                                    |
|                          [Save as Draft]  [Send Response]          |
|                                                                    |
+------------------------------------------------------------------+
```

## 6. Push Notification Integration

### 6.1 Notification Triggers

| Event | Push | Email | In-App |
|-------|------|-------|--------|
| Urgent announcement published | Yes | Yes | Yes |
| Normal announcement published | Yes (if enabled) | Digest | Yes |
| Policy requires acknowledgment | Yes | Yes | Yes |
| Policy deadline reminder (7d, 3d, 1d) | Yes | Yes | Yes |
| Recognition award received | Yes | Yes | Yes |
| Peer nomination approved | Yes | Yes | Yes |
| Feedback response available | Optional | Yes | Yes |

### 6.2 Push Notification Payloads

```javascript
// Urgent Announcement
{
  title: "URGENT: Weather Alert",
  body: "I-40 closures affecting your region. Tap to view details.",
  data: {
    type: "announcement",
    id: "ann_123",
    priority: "urgent"
  }
}

// Policy Reminder
{
  title: "Action Required: Safety Handbook",
  body: "Please review and sign by Jan 30. 10 days remaining.",
  data: {
    type: "policy",
    id: "pol_456",
    action: "acknowledge"
  }
}

// Recognition Award
{
  title: "You've been recognized!",
  body: "You earned the 100K Safe Miles badge. Congratulations!",
  data: {
    type: "recognition",
    id: "rec_789"
  }
}

// Feedback Response
{
  title: "Response to your feedback",
  body: "Management has responded to your recent feedback.",
  data: {
    type: "feedback_response",
    token: "fb_token_xyz"
  }
}
```

### 6.3 Email Templates

- `announcement_digest.html` - Daily/weekly announcement summary
- `policy_reminder.html` - Policy acknowledgment reminder
- `policy_deadline_warning.html` - 1-day deadline warning
- `recognition_awarded.html` - You received an award
- `peer_nomination_approved.html` - Your nomination was approved
- `feedback_response.html` - Response to your anonymous feedback

## 7. Security Considerations

### 7.1 Access Control

```javascript
// Permission matrix
canManageAnnouncements(user, carrier) -> user.role in ['admin', 'manager'] && user.carrier == carrier
canManagePolicies(user, carrier)      -> user.role in ['admin', 'hr', 'safety'] && user.carrier == carrier
canCreateAwards(user, carrier)        -> user.role in ['admin', 'manager'] && user.carrier == carrier
canNominatePeer(user, carrier)        -> user.role == 'driver' && user.carrier == carrier
canViewFeedback(user, carrier)        -> user.role in ['admin', 'manager'] && user.carrier == carrier
canRespondFeedback(user, carrier)     -> user.role in ['admin', 'manager'] && user.carrier == carrier
```

### 7.2 Anonymity Protection

- Feedback submissions use anonymous tokens, not driver IDs
- Response notifications use secure one-time tokens
- IP addresses logged for audit but not linked to feedback content
- No pattern analysis that could identify individuals
- Minimum batch size for trend reports (5+ submissions)

### 7.3 Data Retention

| Data Type | Retention | Notes |
|-----------|-----------|-------|
| Announcements | 2 years | Archived after 90 days |
| Read receipts | 1 year | Aggregated after 90 days |
| Policy docs | 7 years | Compliance requirement |
| Acknowledgments | 7 years | Legal requirement |
| Recognition awards | Permanent | Employee records |
| Feedback | 2 years | Anonymized after 1 year |

## 8. Success Metrics

| Metric | Target (6 months) |
|--------|-------------------|
| Announcement read rate | 85%+ |
| Policy compliance rate | 95%+ within deadline |
| Recognition awards/month | 20+ per 100 drivers |
| Peer nominations/month | 10+ per 100 drivers |
| Feedback submissions/month | 40%+ of drivers |
| Feedback response rate | 90%+ within 48 hours |
| Driver NPS improvement | +20 points |
| 90-day retention improvement | +15% |
