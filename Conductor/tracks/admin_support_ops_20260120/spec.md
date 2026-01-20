# Specification: Admin Support Operations - Tickets & Knowledge Base

## 1. Overview

The Admin Support Operations module extends the LMDR Admin Portal with comprehensive customer support capabilities. This system enables administrators to efficiently handle user issues, maintain a self-service knowledge base, provide real-time chat support, and track customer satisfaction through NPS surveys.

### Goals
- Reduce average ticket resolution time by 40%
- Increase first-contact resolution rate to 70%+
- Build a self-service knowledge base to deflect common inquiries
- Track and improve customer satisfaction scores
- Provide real-time support for high-priority issues

---

## 2. Target Users

| Role | Access Level | Primary Functions |
|------|--------------|-------------------|
| **Support Admin** | Full | All support functions, configuration |
| **Support Agent** | Standard | Ticket handling, chat, KB editing |
| **Operations Admin** | Read + Assign | View queues, assign tickets, analytics |
| **Analytics Viewer** | Read-only | Dashboards, reports, NPS trends |

---

## 3. System Architecture

```
+------------------------------------------------------------------+
|                     ADMIN SUPPORT PORTAL                          |
+------------------------------------------------------------------+
|                                                                    |
|  +------------------+  +------------------+  +------------------+  |
|  |  TICKET SYSTEM   |  |  KNOWLEDGE BASE  |  |  CHAT SUPPORT    |  |
|  +------------------+  +------------------+  +------------------+  |
|  | - Create/View    |  | - Article CRUD   |  | - Live Queue     |  |
|  | - Assign/Route   |  | - Categories     |  | - Agent Console  |  |
|  | - Status Workflow|  | - Search/Index   |  | - Canned Replies |  |
|  | - SLA Tracking   |  | - Version History|  | - History        |  |
|  +--------+---------+  +--------+---------+  +--------+---------+  |
|           |                     |                     |            |
|           +----------+----------+----------+----------+            |
|                      |                     |                       |
|                      v                     v                       |
|           +------------------+   +------------------+              |
|           |  NPS/CSAT MODULE |   |  MESSAGING BRIDGE|              |
|           +------------------+   +------------------+              |
|           | - Survey Trigger |   | - Integrate with |              |
|           | - Score Tracking |   |   existing       |              |
|           | - Trend Analysis |   |   messaging.jsw  |              |
|           | - Segmentation   |   |   system         |              |
|           +------------------+   +------------------+              |
|                                                                    |
+------------------------------------------------------------------+
                               |
                               v
+------------------------------------------------------------------+
|                      DATA LAYER (Wix Collections)                 |
+------------------------------------------------------------------+
|  SupportTickets | KnowledgeArticles | ChatSessions | NPSResponses |
|  TicketComments | ArticleCategories | ChatMessages | SurveyConfig |
|  TicketTags     | ArticleVersions   | CannedResponses | NPSTrends |
+------------------------------------------------------------------+
```

---

## 4. Feature Specifications

### 4.1 Support Ticket System

#### 4.1.1 Ticket Creation Flow

```
+-------------------+     +-------------------+     +-------------------+
|   USER SUBMITS    | --> |  TICKET CREATED   | --> |  AUTO-ASSIGNMENT  |
|   via form/email  |     |  with priority    |     |  based on rules   |
+-------------------+     +-------------------+     +-------------------+
                                    |
                                    v
                          +-------------------+
                          |  SLA CLOCK STARTS |
                          +-------------------+
```

#### 4.1.2 Status Workflow

```
                 +-----------+
                 |   OPEN    |
                 +-----+-----+
                       |
           +-----------+-----------+
           |                       |
           v                       v
   +---------------+       +---------------+
   | IN PROGRESS   |       |   WAITING     |
   | (agent work)  |       | (user reply)  |
   +-------+-------+       +-------+-------+
           |                       |
           +-----------+-----------+
                       |
                       v
               +---------------+
               |   RESOLVED    |
               +-------+-------+
                       |
           +-----------+-----------+
           |                       |
           v                       v
   +---------------+       +---------------+
   |    CLOSED     |       |  REOPENED     |
   | (auto 7 days) |       | (user action) |
   +---------------+       +---------------+
```

#### 4.1.3 Priority Levels & SLA

| Priority | Response Time | Resolution Time | Escalation |
|----------|---------------|-----------------|------------|
| **Urgent** | 1 hour | 4 hours | Immediate to supervisor |
| **High** | 4 hours | 24 hours | After 4 hours |
| **Medium** | 24 hours | 72 hours | After 24 hours |
| **Low** | 48 hours | 7 days | After 48 hours |

#### 4.1.4 Ticket Dashboard UI

```
+----------------------------------------------------------------------+
|  SUPPORT TICKETS                           [+ New Ticket] [Filters v] |
+----------------------------------------------------------------------+
|  Queue: All Open (47)  |  My Tickets (12)  |  Unassigned (8)          |
+----------------------------------------------------------------------+
|  ID      | Subject              | User      | Priority | Status | SLA |
|----------+----------------------+-----------+----------+--------+-----|
|  #1247   | Cannot upload CDL    | John D.   | HIGH     | Open   | 2h  |
|  #1246   | Match score question | Mary S.   | MEDIUM   | Wait   | 18h |
|  #1245   | Payment failed       | Tom B.    | URGENT   | Prog   | 45m |
|  #1244   | Profile not saving   | Lisa K.   | LOW      | Open   | 4d  |
+----------------------------------------------------------------------+
|  < 1 2 3 ... 5 >                                    25 | 50 | 100    |
+----------------------------------------------------------------------+
```

#### 4.1.5 Ticket Detail View

```
+----------------------------------------------------------------------+
|  TICKET #1247 - Cannot upload CDL document                           |
|  Priority: [HIGH v]  Status: [OPEN v]  Assigned: [Agent Name v]      |
+----------------------------------------------------------------------+
|                                                                       |
|  +---------------------------+  +----------------------------------+  |
|  |     TICKET INFO           |  |     CONVERSATION                 |  |
|  +---------------------------+  +----------------------------------+  |
|  | Requester: John Doe       |  | [User] 2h ago                    |  |
|  | Email: john@email.com     |  | I tried uploading my CDL but     |  |
|  | Role: Driver              |  | the system shows an error...     |  |
|  | Created: Jan 20, 2026     |  |                                  |  |
|  | SLA: 2h remaining         |  | [Agent] 1h ago                   |  |
|  |                           |  | Hi John, can you tell me what    |  |
|  | Tags:                     |  | file format you're using?        |  |
|  | [upload] [documents]      |  |                                  |  |
|  +---------------------------+  | +------------------------------+ |  |
|                                 | |  Type your reply...          | |  |
|  +---------------------------+  | +------------------------------+ |  |
|  |     QUICK ACTIONS         |  | [Reply] [Internal Note] [Macro]| |  |
|  +---------------------------+  +----------------------------------+  |
|  | [Escalate] [Merge]        |                                       |
|  | [Add Tag] [Link KB]       |                                       |
|  +---------------------------+                                       |
+----------------------------------------------------------------------+
```

---

### 4.2 Knowledge Base Admin

#### 4.2.1 Information Architecture

```
Knowledge Base
+-- Getting Started
|   +-- Creating Your Account
|   +-- Completing Your Profile
|   +-- Uploading Documents
|
+-- For Drivers
|   +-- Finding Matches
|   +-- Applying to Carriers
|   +-- Understanding Match Scores
|   +-- Messaging Recruiters
|
+-- For Carriers
|   +-- Posting Jobs
|   +-- Searching Drivers
|   +-- Subscription Plans
|
+-- For Recruiters
|   +-- Managing Multiple Carriers
|   +-- Using the Pipeline
|   +-- Outreach Best Practices
|
+-- Troubleshooting
|   +-- Upload Issues
|   +-- Login Problems
|   +-- Payment FAQ
|
+-- API & Integrations (Admin only)
    +-- Webhook Setup
    +-- API Documentation
```

#### 4.2.2 Article Editor UI

```
+----------------------------------------------------------------------+
|  ARTICLE EDITOR                            [Preview] [Save] [Publish] |
+----------------------------------------------------------------------+
|  Title: [How to Upload Your CDL Document                           ] |
|                                                                       |
|  Category: [For Drivers v]  Subcategory: [Uploading Documents v]     |
|                                                                       |
|  +----------------------------------------------------------------+  |
|  | [B] [I] [U] [H1] [H2] [Link] [Image] [Code] [List] [Table]     |  |
|  +----------------------------------------------------------------+  |
|  |                                                                 |  |
|  |  # How to Upload Your CDL Document                              |  |
|  |                                                                 |  |
|  |  Follow these steps to upload your CDL:                         |  |
|  |                                                                 |  |
|  |  1. Go to your **Profile** page                                 |  |
|  |  2. Click the **Documents** tab                                 |  |
|  |  3. Select **Upload CDL**                                       |  |
|  |                                                                 |  |
|  |  > **Note:** Accepted formats: JPG, PNG, PDF (max 10MB)         |  |
|  |                                                                 |  |
|  +----------------------------------------------------------------+  |
|                                                                       |
|  Tags: [cdl] [upload] [documents] [+ Add]                            |
|                                                                       |
|  SEO Title: [Uploading CDL - Help Center                          ]  |
|  Meta Desc: [Learn how to upload your CDL document to LMDR...     ]  |
+----------------------------------------------------------------------+
|  Version: 3  |  Last edited by: Admin  |  Published: Jan 15, 2026    |
|  [View History]  [Revert to Previous]                                 |
+----------------------------------------------------------------------+
```

#### 4.2.3 Analytics Dashboard

```
+----------------------------------------------------------------------+
|  KNOWLEDGE BASE ANALYTICS                        [Date Range: 30d v] |
+----------------------------------------------------------------------+
|                                                                       |
|  +------------------+  +------------------+  +------------------+     |
|  |  Total Views     |  |  Search Success  |  |  Helpfulness     |    |
|  |     12,450       |  |      68%         |  |     82% Yes      |    |
|  |   +15% vs prev   |  |   +5% vs prev    |  |   +3% vs prev    |    |
|  +------------------+  +------------------+  +------------------+     |
|                                                                       |
|  TOP ARTICLES                        SEARCH TERMS (No Results)        |
|  +-----------------------------+     +-----------------------------+  |
|  | 1. Upload CDL     (2,340)   |     | "refund"           (145)    |  |
|  | 2. Match Scores   (1,890)   |     | "delete account"   (89)     |  |
|  | 3. Payment FAQ    (1,456)   |     | "mobile app"       (67)     |  |
|  | 4. Profile Tips   (1,234)   |     | "api pricing"      (45)     |  |
|  +-----------------------------+     +-----------------------------+  |
|                                                                       |
+----------------------------------------------------------------------+
```

---

### 4.3 Chat Support Dashboard

#### 4.3.1 Chat System Architecture

```
+------------------+         +------------------+         +------------------+
|   USER WIDGET    |  <--->  |   REALTIME HUB   |  <--->  |  AGENT CONSOLE   |
|   (frontend)     |         |   (backend)      |         |  (admin portal)  |
+------------------+         +------------------+         +------------------+
        |                            |                            |
        |                            v                            |
        |                   +------------------+                  |
        +------------------>|  ChatSessions    |<-----------------+
                            |  ChatMessages    |
                            +------------------+
```

#### 4.3.2 Agent Console UI

```
+----------------------------------------------------------------------+
|  LIVE CHAT SUPPORT                           Online Agents: 3/5       |
+----------------------------------------------------------------------+
|                                                                       |
|  QUEUE (4)                    ACTIVE CHAT - John Doe                  |
|  +-----------------------+    +------------------------------------+  |
|  | [!] Mary S.    2:34   |    | John Doe - Driver                  |  |
|  |     Payment issue     |    | Topic: CDL Upload Problem          |  |
|  +-----------------------+    | Started: 5 min ago                 |  |
|  | Tom B.         1:15   |    +------------------------------------+  |
|  |     Match question    |    |                                    |  |
|  +-----------------------+    | [User] 3:24 PM                     |  |
|  | Lisa K.        0:45   |    | Hi, I'm having trouble uploading   |  |
|  |     Profile help      |    | my CDL. Can you help?              |  |
|  +-----------------------+    |                                    |  |
|  | Bob R.         0:12   |    | [Agent] 3:25 PM                    |  |
|  |     General inquiry   |    | Of course! What error message      |  |
|  +-----------------------+    | are you seeing?                    |  |
|                               |                                    |  |
|  MY CHATS (2)                 | [User] 3:26 PM                     |  |
|  +-----------------------+    | It says "File too large"           |  |
|  | John D.   [Active]    |    |                                    |  |
|  +-----------------------+    +------------------------------------+  |
|  | Sarah M.  [Waiting]   |    | +--------------------------------+ |  |
|  +-----------------------+    | | Type message...                | |  |
|                               | +--------------------------------+ |  |
|  CANNED RESPONSES             | [Send] [Canned v] [KB Link] [End] |  |
|  +-----------------------+    +------------------------------------+  |
|  | Greeting              |                                           |
|  | File Size Limit       |    USER INFO                              |
|  | Escalation            |    +------------------------------------+  |
|  | Closing               |    | Profile: 85% Complete              |  |
|  +-----------------------+    | Member Since: Dec 2025             |  |
|                               | Previous Chats: 2                  |  |
|                               | Open Tickets: 1                    |  |
|                               | [View Full Profile]                |  |
|                               +------------------------------------+  |
+----------------------------------------------------------------------+
```

#### 4.3.3 Canned Responses Management

```
+----------------------------------------------------------------------+
|  CANNED RESPONSES                                    [+ New Response] |
+----------------------------------------------------------------------+
|  Category   | Shortcode    | Preview                        | Actions |
|-------------+--------------+--------------------------------+---------|
|  Greeting   | /hello       | Hi! Thanks for reaching out... | [Edit]  |
|  Greeting   | /returning   | Welcome back! How can I help...| [Edit]  |
|  Issue      | /filesize    | Our upload limit is 10MB...    | [Edit]  |
|  Issue      | /payment     | For payment issues, please...  | [Edit]  |
|  Escalate   | /escalate    | I'm transferring you to a...   | [Edit]  |
|  Closing    | /solved      | Great! Is there anything...    | [Edit]  |
|  Closing    | /feedback    | Thank you! Would you mind...   | [Edit]  |
+----------------------------------------------------------------------+
```

---

### 4.4 NPS/Satisfaction Tracking

#### 4.4.1 Survey Flow

```
+-------------------+     +-------------------+     +-------------------+
|  TRIGGER EVENT    | --> |  SURVEY DISPLAYED | --> |  RESPONSE STORED  |
|  (ticket closed,  |     |  (modal/email)    |     |  + follow-up      |
|   chat ended)     |     |                   |     |    question       |
+-------------------+     +-------------------+     +-------------------+
                                                            |
                          +-------------------+             |
                          |  SEGMENT ANALYSIS |<------------+
                          |  by role, time,   |
                          |  issue type       |
                          +-------------------+
```

#### 4.4.2 NPS Survey UI (User-facing)

```
+----------------------------------------------------------------------+
|                                                                       |
|        How likely are you to recommend LMDR to a colleague?           |
|                                                                       |
|   0    1    2    3    4    5    6    7    8    9    10                |
|  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [ ]  [X]               |
|  Not at all likely            Neutral             Extremely likely    |
|                                                                       |
|  +----------------------------------------------------------------+  |
|  | What's the primary reason for your score? (optional)           |  |
|  |                                                                 |  |
|  | The support team was incredibly helpful and resolved my        |  |
|  | issue quickly. Great experience!                               |  |
|  +----------------------------------------------------------------+  |
|                                                                       |
|                              [Submit Feedback]                        |
|                                                                       |
+----------------------------------------------------------------------+
```

#### 4.4.3 NPS Dashboard

```
+----------------------------------------------------------------------+
|  NPS TRACKING                                    [Date Range: 90d v]  |
+----------------------------------------------------------------------+
|                                                                       |
|  CURRENT NPS SCORE                                                    |
|  +----------------------------------------------------------------+  |
|  |                                                                 |  |
|  |                          +45                                    |  |
|  |                      (Excellent)                                |  |
|  |                                                                 |  |
|  |   [|||||||||||||||||||||||||||||||||||||||      ]               |  |
|  |   Detractors (0-6): 15%  |  Passives (7-8): 25%  |  Promoters: 60%
|  |                                                                 |  |
|  +----------------------------------------------------------------+  |
|                                                                       |
|  TREND OVER TIME                                                      |
|  +----------------------------------------------------------------+  |
|  |     ^                                                           |  |
|  | 50  |                              .....                        |  |
|  | 40  |          .....'''''....                                   |  |
|  | 30  |   ......'                                                 |  |
|  | 20  |                                                           |  |
|  |     +----------------------------------------------------->     |  |
|  |       Oct     Nov     Dec     Jan                               |  |
|  +----------------------------------------------------------------+  |
|                                                                       |
|  SEGMENT BREAKDOWN                                                    |
|  +-----------------------------+  +-----------------------------+     |
|  | BY USER ROLE               |  | BY INTERACTION TYPE         |     |
|  | Drivers:      +52          |  | Ticket:     +38             |     |
|  | Carriers:     +41          |  | Chat:       +56             |     |
|  | Recruiters:   +48          |  | Self-serve: +62             |     |
|  +-----------------------------+  +-----------------------------+     |
|                                                                       |
|  RECENT FEEDBACK                                                      |
|  +----------------------------------------------------------------+  |
|  | [10] "Amazing support, resolved my issue in minutes!"          |  |
|  | [9]  "Very helpful team, would definitely recommend."          |  |
|  | [3]  "Took too long to get a response to my ticket."           |  |
|  | [8]  "Good overall, but chat could be available longer."       |  |
|  +----------------------------------------------------------------+  |
|                                                                       |
+----------------------------------------------------------------------+
```

---

## 5. Data Model

### 5.1 Collections Schema

#### SupportTickets

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `ticket_number` | Number | Auto-incrementing display ID |
| `subject` | String | Ticket subject line |
| `description` | Text | Initial description |
| `status` | String | open, in_progress, waiting, resolved, closed |
| `priority` | String | urgent, high, medium, low |
| `category` | String | account, billing, technical, general |
| `user_id` | Reference | Link to member who submitted |
| `user_email` | String | Submitter email |
| `user_name` | String | Submitter display name |
| `user_role` | String | driver, carrier, recruiter |
| `assigned_to` | Reference | AdminUsers._id of assigned agent |
| `tags` | Array | Tag strings for categorization |
| `sla_response_due` | DateTime | When first response is due |
| `sla_resolution_due` | DateTime | When resolution is due |
| `sla_response_met` | Boolean | Was response SLA met |
| `sla_resolution_met` | Boolean | Was resolution SLA met |
| `first_response_at` | DateTime | When agent first responded |
| `resolved_at` | DateTime | When marked resolved |
| `closed_at` | DateTime | When closed |
| `satisfaction_score` | Number | Post-resolution CSAT (1-5) |
| `linked_chat_id` | Reference | ChatSessions._id if from chat |
| `linked_article_ids` | Array | KB articles linked to ticket |
| `created_at` | DateTime | Creation timestamp |
| `updated_at` | DateTime | Last update timestamp |

#### TicketComments

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `ticket_id` | Reference | SupportTickets._id |
| `author_id` | String | User or admin ID |
| `author_type` | String | user, agent, system |
| `author_name` | String | Display name |
| `content` | Text | Comment content |
| `is_internal` | Boolean | Internal note (hidden from user) |
| `created_at` | DateTime | Comment timestamp |

#### KnowledgeArticles

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `title` | String | Article title |
| `slug` | String | URL-friendly identifier |
| `content` | Text | Markdown content |
| `excerpt` | String | Short description |
| `category_id` | Reference | ArticleCategories._id |
| `subcategory` | String | Subcategory name |
| `author_id` | Reference | AdminUsers._id |
| `status` | String | draft, published, archived |
| `tags` | Array | Search tags |
| `seo_title` | String | SEO title override |
| `seo_description` | String | Meta description |
| `views_count` | Number | Total page views |
| `helpful_yes` | Number | "Was this helpful?" Yes count |
| `helpful_no` | Number | "Was this helpful?" No count |
| `version` | Number | Current version number |
| `visibility` | String | public, logged_in, admin_only |
| `related_articles` | Array | Related article IDs |
| `created_at` | DateTime | Creation timestamp |
| `updated_at` | DateTime | Last update timestamp |
| `published_at` | DateTime | Publication timestamp |

#### ArticleCategories

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `name` | String | Category name |
| `slug` | String | URL-friendly identifier |
| `description` | String | Category description |
| `icon` | String | Icon identifier |
| `order` | Number | Display order |
| `parent_id` | Reference | Parent category (for nesting) |

#### ArticleVersions

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `article_id` | Reference | KnowledgeArticles._id |
| `version` | Number | Version number |
| `title` | String | Title at this version |
| `content` | Text | Content at this version |
| `author_id` | Reference | Who made the change |
| `change_summary` | String | Description of changes |
| `created_at` | DateTime | Version timestamp |

#### ChatSessions

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `user_id` | Reference | Member ID |
| `user_email` | String | User email |
| `user_name` | String | User display name |
| `user_role` | String | driver, carrier, recruiter |
| `agent_id` | Reference | AdminUsers._id of assigned agent |
| `topic` | String | Chat topic/category |
| `status` | String | queued, active, waiting, ended |
| `rating` | Number | Post-chat rating (1-5) |
| `queue_position` | Number | Position when queued |
| `wait_time_seconds` | Number | Time spent in queue |
| `duration_seconds` | Number | Total chat duration |
| `message_count` | Number | Total messages exchanged |
| `converted_to_ticket` | Boolean | Was this escalated to ticket |
| `ticket_id` | Reference | SupportTickets._id if converted |
| `started_at` | DateTime | When chat started |
| `ended_at` | DateTime | When chat ended |
| `created_at` | DateTime | When session created |

#### ChatMessages

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `session_id` | Reference | ChatSessions._id |
| `sender_type` | String | user, agent, system |
| `sender_id` | String | User or agent ID |
| `content` | Text | Message content |
| `is_canned` | Boolean | Was this a canned response |
| `canned_response_id` | Reference | If canned, which one |
| `created_at` | DateTime | Message timestamp |

#### CannedResponses

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `category` | String | Greeting, Issue, Escalation, Closing |
| `shortcode` | String | Quick trigger (e.g., /hello) |
| `title` | String | Display name |
| `content` | Text | Response content |
| `usage_count` | Number | Times used |
| `created_by` | Reference | AdminUsers._id |
| `created_at` | DateTime | Creation timestamp |
| `updated_at` | DateTime | Last update |

#### NPSResponses

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `user_id` | Reference | Member ID |
| `user_email` | String | User email |
| `user_role` | String | driver, carrier, recruiter |
| `score` | Number | NPS score (0-10) |
| `category` | String | Detractor (0-6), Passive (7-8), Promoter (9-10) |
| `feedback` | Text | Optional text feedback |
| `trigger_type` | String | ticket_closed, chat_ended, periodic |
| `trigger_id` | String | ID of triggering event |
| `created_at` | DateTime | Response timestamp |

#### SurveyConfig

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `survey_type` | String | nps, csat, ces |
| `trigger_type` | String | ticket_closed, chat_ended, etc. |
| `enabled` | Boolean | Is this survey active |
| `delay_minutes` | Number | Delay before showing survey |
| `cooldown_days` | Number | Days before re-surveying user |
| `sample_rate` | Number | Percentage of users to survey |

---

## 6. API Design

### 6.1 Backend Services

#### supportTicketService.jsw

```javascript
// Ticket CRUD
export async function createTicket(ticketData)
export async function getTicket(ticketId)
export async function updateTicket(ticketId, updates)
export async function getTicketsList(filters, pagination, sort)

// Ticket Actions
export async function assignTicket(ticketId, agentId)
export async function changeTicketStatus(ticketId, status, reason)
export async function addTicketComment(ticketId, content, isInternal)
export async function mergeTickets(primaryId, secondaryId)
export async function escalateTicket(ticketId, reason)

// Ticket Analytics
export async function getTicketMetrics(dateRange)
export async function getSLACompliance(dateRange)
export async function getAgentPerformance(agentId, dateRange)

// User-facing
export async function getMyTickets(userId)
export async function submitTicket(ticketData) // Public submission
```

#### knowledgeBaseService.jsw

```javascript
// Article CRUD
export async function createArticle(articleData)
export async function getArticle(articleId)
export async function getArticleBySlug(slug)
export async function updateArticle(articleId, updates)
export async function publishArticle(articleId)
export async function archiveArticle(articleId)

// Categories
export async function getCategories()
export async function createCategory(categoryData)
export async function updateCategory(categoryId, updates)
export async function reorderCategories(orderedIds)

// Search & Discovery
export async function searchArticles(query, filters)
export async function getPopularArticles(limit)
export async function getRelatedArticles(articleId)

// Analytics
export async function recordArticleView(articleId, userId)
export async function recordHelpfulVote(articleId, isHelpful)
export async function getArticleAnalytics(articleId)
export async function getKBOverviewMetrics(dateRange)

// Versioning
export async function getArticleVersions(articleId)
export async function revertToVersion(articleId, versionNumber)
```

#### chatSupportService.jsw

```javascript
// Session Management
export async function startChatSession(userData, topic)
export async function assignChatToAgent(sessionId, agentId)
export async function endChatSession(sessionId, rating)
export async function getAgentActiveChats(agentId)
export async function getChatQueue()

// Messages
export async function sendChatMessage(sessionId, content, senderType)
export async function getChatHistory(sessionId)
export async function getChatMessagesSince(sessionId, timestamp)

// Canned Responses
export async function getCannedResponses(category)
export async function createCannedResponse(responseData)
export async function updateCannedResponse(responseId, updates)
export async function deleteCannedResponse(responseId)

// Escalation
export async function convertChatToTicket(sessionId)

// Analytics
export async function getChatMetrics(dateRange)
export async function getAgentChatStats(agentId, dateRange)
```

#### npsService.jsw

```javascript
// Survey Submission
export async function submitNPSResponse(responseData)
export async function shouldShowSurvey(userId, triggerType)

// Analytics
export async function getNPSScore(dateRange, segment)
export async function getNPSTrend(dateRange, granularity)
export async function getSegmentBreakdown(dateRange)
export async function getRecentFeedback(limit, category)

// Configuration
export async function getSurveyConfig()
export async function updateSurveyConfig(configId, updates)
```

---

## 7. Integration with Existing Systems

### 7.1 Messaging System Bridge

The chat support system integrates with the existing `messaging.jsw` module for driver-recruiter conversations:

```javascript
// In chatSupportService.jsw

import { sendMessage as sendRecruiterMessage } from 'backend/messaging';

/**
 * When escalating a driver's chat to their recruiter,
 * create a message thread in the existing system.
 */
export async function escalateChatToRecruiter(chatSessionId, applicationId) {
    const session = await wixData.get('ChatSessions', chatSessionId);
    const summary = await generateChatSummary(chatSessionId);

    // Send via existing messaging system
    await sendRecruiterMessage(
        applicationId,
        `Support escalation: ${summary}`,
        session.user_id,
        'recruiter'
    );

    // Update chat session
    await wixData.update('ChatSessions', {
        ...session,
        escalated_to_recruiter: true,
        escalated_at: new Date()
    });
}
```

### 7.2 Admin Portal Integration

Support operations are accessed via the existing admin sidebar navigation:

```
SUPPORT (New Section)
+-- Tickets
+-- Chat
+-- Knowledge Base
+-- NPS Dashboard
```

### 7.3 Notification System

Integrates with existing `emailService.jsw`:

```javascript
// New email templates to add:
- ticket_created_user      // Confirmation to user
- ticket_assigned_agent    // Notification to agent
- ticket_updated_user      // Status change notification
- ticket_resolved_user     // Resolution + survey link
- nps_survey_request       // Periodic NPS survey email
```

---

## 8. Security Requirements

### 8.1 Access Control

| Function | Support Admin | Support Agent | Ops Admin | Viewer |
|----------|---------------|---------------|-----------|--------|
| View all tickets | Yes | Yes | Yes | Yes |
| Create/edit tickets | Yes | Yes | No | No |
| Assign tickets | Yes | Yes | Yes | No |
| Delete tickets | Yes | No | No | No |
| View KB articles | Yes | Yes | Yes | Yes |
| Create/edit KB | Yes | Yes | No | No |
| Publish KB | Yes | No | No | No |
| Handle chat | Yes | Yes | No | No |
| View NPS data | Yes | Yes | Yes | Yes |
| Configure surveys | Yes | No | No | No |

### 8.2 Data Protection

- PII (email, name) masked in list views
- Full access requires click-through to detail view
- All actions logged to AdminAuditLog
- Chat transcripts encrypted at rest
- NPS responses anonymized after 90 days (configurable)

---

## 9. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Response Time | <4 hours avg | Ticket timestamps |
| Resolution Time | <24 hours avg | Ticket timestamps |
| First Contact Resolution | >70% | Tickets resolved without reopening |
| NPS Score | >40 | Survey responses |
| KB Deflection Rate | >30% | KB views before ticket creation |
| Chat Resolution Rate | >80% | Chats not converted to tickets |
| Agent Utilization | 70-85% | Active time / available time |
| CSAT Score | >4.2/5 | Post-interaction surveys |

---

## 10. Future Enhancements

- **AI-powered ticket routing** - Auto-categorize and assign based on content
- **Chatbot integration** - First-line support before human handoff
- **Sentiment analysis** - Detect frustrated users for prioritization
- **Predictive analytics** - Forecast ticket volumes for staffing
- **Multi-language support** - Spanish language articles and chat
- **Video chat** - Screen sharing for complex technical issues
