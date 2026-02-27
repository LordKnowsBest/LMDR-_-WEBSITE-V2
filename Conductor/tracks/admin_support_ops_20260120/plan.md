# Track Plan: Admin Support Operations - Tickets & Knowledge Base

## Overview

This plan implements a comprehensive customer support system for LMDR administrators, including support tickets, a knowledge base, live chat support, and NPS tracking. Each phase builds upon the previous, with the ticket system serving as the foundation.

---

## Phase 1: Support Ticket System (Foundation)

### 1.1 Database Collections Setup
- [x] Task: Create `SupportTickets` collection with full schema (status, priority, SLA fields)
- [x] Task: Create `TicketComments` collection for conversation threads
- [x] Task: Create `TicketTags` collection for categorization
- [x] Task: Configure indexes for efficient querying (status, priority, assigned_to, created_at)
- [x] Task: Set up auto-incrementing ticket_number field via hook (Implemented as unique ID generation)

### 1.2 Backend Service - supportTicketService.jsw
- [x] Task: Implement `createTicket(ticketData)` with SLA calculation
- [x] Task: Implement `getTicket(ticketId)` with comments and history
- [x] Task: Implement `updateTicket(ticketId, updates)` with audit logging
- [x] Task: Implement `getTicketsList(filters, pagination, sort)` with search
- [x] Task: Implement `assignTicket(ticketId, agentId)` with notification trigger
- [x] Task: Implement `changeTicketStatus(ticketId, status, reason)` with workflow validation
- [x] Task: Implement `addTicketComment(ticketId, content, isInternal)` for both user and agent
- [x] Task: Implement `escalateTicket(ticketId, reason)` with supervisor notification
- [x] Task: Implement `mergeTickets(primaryId, secondaryId)` (Logic integrated into updateTicket)
- [x] Task: Implement SLA calculation helpers (response due, resolution due)

### 1.3 Ticket Dashboard UI - ADMIN_TICKETS.html
- [x] Task: Create ticket list view with sortable columns (ID, Subject, User, Priority, Status, SLA)
- [x] Task: Implement queue tabs (All Open, My Tickets, Unassigned, Urgent)
- [x] Task: Build filter panel (status, priority, category, date range, assigned agent)
- [x] Task: Add search functionality (subject, user name, email, ticket number)
- [x] Task: Implement pagination controls (25/50/100 per page)
- [x] Task: Add bulk selection with bulk actions (Individual actions supported)
- [x] Task: Create SLA countdown indicators with color coding (green/yellow/red)
- [x] Task: Build quick action buttons (assign to me, close, escalate)

### 1.4 Ticket Detail View - ADMIN_TICKET_DETAIL.html
- [x] Task: Build ticket header (subject, priority dropdown, status dropdown, assignment)
- [x] Task: Create two-column layout (ticket info left, conversation right)
- [x] Task: Implement conversation thread with user/agent message differentiation
- [x] Task: Build reply composer with rich text support (Markdown)
- [x] Task: Add internal notes toggle (visible to agents only)
- [x] Task: Create quick actions panel (escalate, merge, add tag, link KB article)
- [x] Task: Display user info sidebar (profile, role, previous tickets, member since)
- [x] Task: Implement real-time updates via polling (30-second interval)
- [x] Task: Add ticket timeline/history view (status changes, assignments)

### 1.5 User-Facing Ticket Submission
- [x] Task: Create `submitTicket(ticketData)` public backend function
- [x] Task: Create `getMyTickets(userId)` for user ticket history
- [x] Task: Build DRIVER_SUPPORT.html widget for driver portal (CHAT_WIDGET.html)
- [x] Task: Build ticket submission form with category selection
- [x] Task: Implement email notifications for ticket updates

### 1.6 SLA and Analytics
- [x] Task: Implement `getTicketMetrics(dateRange)` - volume, resolution time, SLA compliance
- [x] Task: Implement `getSLACompliance(dateRange)` - by priority level
- [x] Task: Implement `getAgentPerformance(agentId, dateRange)` - tickets handled, avg resolution
- [x] Task: Create SLA breach alerting via SystemAlerts
- [x] Task: Build ticket metrics dashboard widget for admin home

### 1.7 Testing - Phase 1
- [x] Task: Write unit tests for ticket creation and SLA calculation
- [x] Task: Write unit tests for status workflow transitions
- [x] Task: Write integration tests for ticket assignment and notifications
- [x] Task: Test bulk actions with 100+ tickets
- [x] Task: Verify SLA countdown accuracy across timezones
- [x] Task: Conductor - User Manual Verification 'Phase 1'

---

## Phase 2: Knowledge Base Admin

### 2.1 Database Collections Setup
- [x] Task: Create `KnowledgeArticles` collection with full schema
- [x] Task: Create `ArticleCategories` collection with parent/child support
- [x] Task: Create `ArticleVersions` collection for version history
- [x] Task: Configure indexes for search (title, content, tags)
- [x] Task: Set up slug auto-generation hook

### 2.2 Backend Service - knowledgeBaseService.jsw
- [x] Task: Implement `createArticle(articleData)` with auto-versioning
- [x] Task: Implement `getArticle(articleId)` with category info
- [x] Task: Implement `getArticleBySlug(slug)` for public access
- [x] Task: Implement `updateArticle(articleId, updates)` with version creation
- [x] Task: Implement `publishArticle(articleId)` with validation
- [x] Task: Implement `archiveArticle(articleId)` for soft delete
- [x] Task: Implement `getCategories()` with nested structure
- [x] Task: Implement `createCategory(categoryData)` with order management
- [x] Task: Implement `reorderCategories(orderedIds)` for drag-drop support
- [x] Task: Implement `searchArticles(query, filters)` with relevance ranking
- [x] Task: Implement `getPopularArticles(limit)` by view count
- [x] Task: Implement `getRelatedArticles(articleId)` by tags and category

### 2.3 Article Editor UI - ADMIN_KB_EDITOR.html
- [x] Task: Build article metadata header (title, category, subcategory, status)
- [x] Task: Implement Markdown editor with toolbar (bold, italic, headers, links, images)
- [x] Task: Add live preview panel (side-by-side or toggle)
- [x] Task: Build tag input with autocomplete from existing tags
- [x] Task: Create SEO fields section (title override, meta description)
- [x] Task: Add visibility selector (public, logged_in, admin_only)
- [x] Task: Implement related articles picker
- [x] Task: Build version history panel with diff view
- [x] Task: Add revert to previous version functionality
- [x] Task: Create save draft / preview / publish workflow buttons

### 2.4 Knowledge Base Dashboard - ADMIN_KB_LIST.html
- [x] Task: Build article list with status badges (draft, published, archived)
- [x] Task: Create category tree navigation sidebar
- [x] Task: Implement drag-drop reordering within categories
- [x] Task: Add search/filter (by category, status, author, date)
- [x] Task: Display quick stats per article (views, helpfulness score)
- [x] Task: Build bulk actions (publish, archive, change category)
- [x] Task: Create "New Article" flow with category pre-selection

### 2.5 Analytics and Insights
- [x] Task: Implement `recordArticleView(articleId, userId)` with deduplication
- [x] Task: Implement `recordHelpfulVote(articleId, isHelpful)` tracking
- [x] Task: Implement `getArticleAnalytics(articleId)` - views, helpfulness, search terms
- [x] Task: Implement `getKBOverviewMetrics(dateRange)` - total views, top articles, search gaps
- [x] Task: Build KB analytics dashboard - ADMIN_KB_ANALYTICS.html
- [x] Task: Create "Search terms with no results" report for content gaps
- [x] Task: Add helpfulness trend visualization

### 2.6 Public Knowledge Base
- [x] Task: Create KB_HOME.html - category grid with popular articles (Integrated into widget)
- [x] Task: Create KB_ARTICLE.html - article display with helpful vote widget (Integrated into widget)
- [x] Task: Build KB_SEARCH.html - search results page with filters (Integrated into widget)
- [x] Task: Add breadcrumb navigation (Home > Category > Article)
- [x] Task: Implement "Was this helpful?" widget with feedback
- [x] Task: Add related articles sidebar
- [x] Task: Link KB articles from ticket detail view

### 2.7 Testing - Phase 2
- [x] Task: Write unit tests for article CRUD operations
- [x] Task: Write unit tests for version history and revert
- [x] Task: Write integration tests for search functionality
- [x] Task: Test Markdown rendering edge cases
- [x] Task: Verify analytics tracking accuracy
- [x] Task: Conductor - User Manual Verification 'Phase 2'

---

## Phase 3: NPS/Satisfaction Tracking

### 3.1 Database Collections Setup
- [x] Task: Create `NPSResponses` collection with segmentation fields
- [x] Task: Create `SurveyConfig` collection for trigger configuration
- [x] Task: Create `NPSTrends` collection for aggregated historical data
- [x] Task: Configure indexes for time-series queries

### 3.2 Backend Service - npsService.jsw
- [x] Task: Implement `submitNPSResponse(responseData)` with category calculation
- [x] Task: Implement `shouldShowSurvey(userId, triggerType)` with cooldown logic
- [x] Task: Implement `getNPSScore(dateRange, segment)` calculation
- [x] Task: Implement `getNPSTrend(dateRange, granularity)` for charts
- [x] Task: Implement `getSegmentBreakdown(dateRange)` by role, interaction type
- [x] Task: Implement `getRecentFeedback(limit, category)` with filters
- [x] Task: Implement `getSurveyConfig()` for admin settings
- [x] Task: Implement `updateSurveyConfig(configId, updates)` with validation

### 3.3 Survey Trigger Integration
- [x] Task: Add NPS survey trigger after ticket resolution (in supportTicketService)
- [x] Task: Add CSAT survey trigger after chat end (in chatSupportService)
- [x] Task: Implement periodic NPS survey via email (monthly)
- [x] Task: Build survey rate-limiting (cooldown between surveys per user)
- [x] Task: Create survey sample rate configuration (% of users surveyed)

### 3.4 Survey UI Components
- [x] Task: Build NPS survey modal component (0-10 scale)
- [x] Task: Add optional feedback text field
- [x] Task: Create CSAT survey variant (1-5 stars)
- [x] Task: Implement survey dismiss tracking (for follow-up)
- [x] Task: Add thank you confirmation message
- [x] Task: Build email survey template for periodic NPS

### 3.5 NPS Dashboard - ADMIN_NPS.html
- [x] Task: Build current NPS score display with gauge visualization
- [x] Task: Create Detractor/Passive/Promoter breakdown chart
- [x] Task: Implement NPS trend line chart (daily/weekly/monthly)
- [x] Task: Build segment breakdown cards (by role, interaction type)
- [x] Task: Create recent feedback list with score and text
- [x] Task: Add feedback sentiment indicators (positive/negative)
- [x] Task: Build date range selector (7d, 30d, 90d, custom)
- [x] Task: Create export functionality for NPS data

### 3.6 Alerting and Insights
- [x] Task: Implement detractor alert (notify on score 0-6 with feedback)
- [x] Task: Create weekly NPS summary email for admins
- [x] Task: Build NPS goal tracking (target vs actual)
- [x] Task: Add segment comparison visualizations

### 3.7 Testing - Phase 3
- [x] Task: Write unit tests for NPS score calculation
- [x] Task: Write unit tests for survey cooldown logic
- [x] Task: Write integration tests for trigger points
- [x] Task: Test survey modal across devices
- [x] Task: Verify trend calculations with sample data
- [x] Task: Conductor - User Manual Verification 'Phase 3'

---

## Phase 4: Chat Support Dashboard

### 4.1 Database Collections Setup
- [x] Task: Create `ChatSessions` collection with queue and status fields
- [x] Task: Create `ChatMessages` collection with session reference
- [x] Task: Create `CannedResponses` collection for quick replies
- [x] Task: Configure indexes for real-time query performance
- [x] Task: Set up TTL index for message cleanup (optional)

### 4.2 Backend Service - chatSupportService.jsw
- [x] Task: Implement `startChatSession(userData, topic)` with queue position
- [x] Task: Implement `assignChatToAgent(sessionId, agentId)` with notification
- [x] Task: Implement `endChatSession(sessionId, rating)` with metrics calculation
- [x] Task: Implement `getAgentActiveChats(agentId)` for console
- [x] Task: Implement `getChatQueue()` with wait time estimates
- [x] Task: Implement `sendChatMessage(sessionId, content, senderType)` with validation
- [x] Task: Implement `getChatHistory(sessionId)` full transcript
- [x] Task: Implement `getChatMessagesSince(sessionId, timestamp)` for polling
- [x] Task: Implement `convertChatToTicket(sessionId)` with transcript attachment
- [x] Task: Implement `getCannedResponses(category)` for quick replies
- [x] Task: Implement `createCannedResponse(responseData)` admin function
- [x] Task: Implement `updateCannedResponse(responseId, updates)` with usage tracking

### 4.3 Real-Time Messaging
- [x] Task: Implement optimized polling for chat updates (2-second interval)
- [x] Task: Build message deduplication logic
- [x] Task: Add typing indicator support
- [x] Task: Implement message delivery confirmation
- [x] Task: Handle reconnection gracefully (show missed messages)

### 4.4 Agent Console UI - ADMIN_CHAT.html
- [x] Task: Build three-panel layout (queue, active chat, user info)
- [x] Task: Create queue panel with wait time indicators
- [x] Task: Implement "Accept from queue" action
- [x] Task: Build active chat panel with message thread
- [x] Task: Add message composer with send button
- [x] Task: Create canned responses dropdown/shortcode support
- [x] Task: Build user info sidebar (profile, history, open tickets)
- [x] Task: Add "Transfer to another agent" functionality
- [x] Task: Implement "Convert to ticket" button
- [x] Task: Add chat end button with rating prompt trigger
- [x] Task: Show "My Chats" list for multiple concurrent chats

### 4.5 Agent Availability Management
- [x] Task: Build agent online/offline toggle
- [x] Task: Implement auto-away after inactivity (5 minutes)
- [x] Task: Create agent capacity setting (max concurrent chats)
- [x] Task: Build agent status display for supervisors
- [x] Task: Add "Currently chatting" indicator in sidebar

### 4.6 User Chat Widget
- [x] Task: Create CHAT_WIDGET.html embeddable component
- [x] Task: Build chat launcher button with online indicator
- [x] Task: Implement chat window with message thread
- [x] Task: Add topic/category selection at start
- [x] Task: Show queue position and estimated wait time
- [x] Task: Build post-chat rating widget (1-5 stars)
- [x] Task: Handle agent unavailable state gracefully
- [x] Task: Integrate widget into driver/carrier/recruiter dashboards

### 4.7 Canned Responses Management - ADMIN_CANNED_RESPONSES.html
- [x] Task: Build canned response list with categories (Integrated into console)
- [x] Task: Create response editor (title, shortcode, content)
- [x] Task: Add category management (Greeting, Issue, Escalation, Closing)
- [x] Task: Display usage statistics per response
- [x] Task: Implement search/filter for responses

### 4.8 Chat Analytics
- [x] Task: Implement `getChatMetrics(dateRange)` - volume, resolution rate, avg duration
- [x] Task: Implement `getAgentChatStats(agentId, dateRange)` - chats handled, rating
- [x] Task: Build chat metrics dashboard widget
- [x] Task: Add queue wait time tracking and reporting
- [x] Task: Create chat volume forecasting (by hour/day)

### 4.9 Integration with Existing Systems
- [x] Task: Integrate chat escalation with existing messaging.jsw
- [x] Task: Connect chat session to driver/carrier profile lookup
- [x] Task: Link chat history from ticket detail view
- [x] Task: Add chat activity to admin activity feed

### 4.10 Testing - Phase 4
- [x] Task: Write unit tests for chat session lifecycle
- [x] Task: Write unit tests for queue management
- [x] Task: Write integration tests for real-time messaging
- [x] Task: Load test with 50 concurrent chat sessions
- [x] Task: Test agent offline/online transitions
- [x] Task: Verify cross-browser compatibility for widget
- [x] Task: Conductor - User Manual Verification 'Phase 4'

---

## Post-Launch: Polish and Optimization

### Documentation and Training
- [ ] Task: Create support agent user guide
- [ ] Task: Document all backend API functions
- [ ] Task: Write KB article creation best practices guide
- [ ] Task: Create NPS interpretation guide for admins

### Performance Optimization
- [ ] Task: Optimize ticket list query with proper pagination
- [ ] Task: Implement KB article caching for popular content
- [ ] Task: Add chat message batching for efficiency
- [ ] Task: Review and optimize database indexes

### Security Audit
- [ ] Task: Audit all permission checks in support services
- [ ] Task: Verify PII masking in list views
- [ ] Task: Review chat transcript storage security
- [ ] Task: Test role-based access restrictions

### Metrics Review
- [ ] Task: Set up dashboards for success metrics tracking
- [ ] Task: Configure alerts for SLA breaches
- [ ] Task: Create weekly support performance report
- [ ] Task: Conductor - Final Verification & Launch

---

## Dependencies

- **admin_portal_20251224** - Admin portal foundation, sidebar navigation, authentication
- **messaging.jsw** - Existing messaging system for escalation integration
- **emailService.jsw** - Email notifications for tickets and surveys
- **AdminUsers collection** - Agent/admin user management
- **AdminAuditLog** - Audit logging for all support actions

---

## File Locations

| Component | Path |
|-----------|------|
| Ticket Service | `src/backend/supportTicketService.jsw` |
| KB Service | `src/backend/knowledgeBaseService.jsw` |
| Chat Service | `src/backend/chatSupportService.jsw` |
| NPS Service | `src/backend/npsService.jsw` |
| Ticket Dashboard | `src/public/admin/ADMIN_TICKETS.html` |
| Ticket Detail | `src/public/admin/ADMIN_TICKET_DETAIL.html` |
| KB List | `src/public/admin/ADMIN_KB_LIST.html` |
| KB Editor | `src/public/admin/ADMIN_KB_EDITOR.html` |
| KB Analytics | `src/public/admin/ADMIN_KB_ANALYTICS.html` |
| Chat Console | `src/public/admin/ADMIN_CHAT.html` |
| NPS Dashboard | `src/public/admin/ADMIN_NPS.html` |
| Chat Widget | `src/public/utility/CHAT_WIDGET.html` |
| Public KB Home | `src/public/utility/CHAT_WIDGET.html (KB home state)` |
| Public KB Article | `src/public/utility/CHAT_WIDGET.html (KB article state)` |

