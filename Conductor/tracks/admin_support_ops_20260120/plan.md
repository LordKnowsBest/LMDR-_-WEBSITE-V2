# Track Plan: Admin Support Operations - Tickets & Knowledge Base

## Overview

This plan implements a comprehensive customer support system for LMDR administrators, including support tickets, a knowledge base, live chat support, and NPS tracking. Each phase builds upon the previous, with the ticket system serving as the foundation.

---

## Phase 1: Support Ticket System (Foundation)

### 1.1 Database Collections Setup
- [ ] Task: Create `SupportTickets` collection with full schema (status, priority, SLA fields)
- [ ] Task: Create `TicketComments` collection for conversation threads
- [ ] Task: Create `TicketTags` collection for categorization
- [ ] Task: Configure indexes for efficient querying (status, priority, assigned_to, created_at)
- [ ] Task: Set up auto-incrementing ticket_number field via hook

### 1.2 Backend Service - supportTicketService.jsw
- [ ] Task: Implement `createTicket(ticketData)` with SLA calculation
- [ ] Task: Implement `getTicket(ticketId)` with comments and history
- [ ] Task: Implement `updateTicket(ticketId, updates)` with audit logging
- [ ] Task: Implement `getTicketsList(filters, pagination, sort)` with search
- [ ] Task: Implement `assignTicket(ticketId, agentId)` with notification trigger
- [ ] Task: Implement `changeTicketStatus(ticketId, status, reason)` with workflow validation
- [ ] Task: Implement `addTicketComment(ticketId, content, isInternal)` for both user and agent
- [ ] Task: Implement `escalateTicket(ticketId, reason)` with supervisor notification
- [ ] Task: Implement `mergeTickets(primaryId, secondaryId)` for duplicate handling
- [ ] Task: Implement SLA calculation helpers (response due, resolution due)

### 1.3 Ticket Dashboard UI - ADMIN_TICKETS.html
- [ ] Task: Create ticket list view with sortable columns (ID, Subject, User, Priority, Status, SLA)
- [ ] Task: Implement queue tabs (All Open, My Tickets, Unassigned, Urgent)
- [ ] Task: Build filter panel (status, priority, category, date range, assigned agent)
- [ ] Task: Add search functionality (subject, user name, email, ticket number)
- [ ] Task: Implement pagination controls (25/50/100 per page)
- [ ] Task: Add bulk selection with bulk actions (assign, change status, add tag)
- [ ] Task: Create SLA countdown indicators with color coding (green/yellow/red)
- [ ] Task: Build quick action buttons (assign to me, close, escalate)

### 1.4 Ticket Detail View - ADMIN_TICKET_DETAIL.html
- [ ] Task: Build ticket header (subject, priority dropdown, status dropdown, assignment)
- [ ] Task: Create two-column layout (ticket info left, conversation right)
- [ ] Task: Implement conversation thread with user/agent message differentiation
- [ ] Task: Build reply composer with rich text support
- [ ] Task: Add internal notes toggle (visible to agents only)
- [ ] Task: Create quick actions panel (escalate, merge, add tag, link KB article)
- [ ] Task: Display user info sidebar (profile, role, previous tickets, member since)
- [ ] Task: Implement real-time updates via polling (30-second interval)
- [ ] Task: Add ticket timeline/history view (status changes, assignments)

### 1.5 User-Facing Ticket Submission
- [ ] Task: Create `submitTicket(ticketData)` public backend function
- [ ] Task: Create `getMyTickets(userId)` for user ticket history
- [ ] Task: Build DRIVER_SUPPORT.html widget for driver portal
- [ ] Task: Build ticket submission form with category selection
- [ ] Task: Implement email notifications for ticket updates

### 1.6 SLA and Analytics
- [ ] Task: Implement `getTicketMetrics(dateRange)` - volume, resolution time, SLA compliance
- [ ] Task: Implement `getSLACompliance(dateRange)` - by priority level
- [ ] Task: Implement `getAgentPerformance(agentId, dateRange)` - tickets handled, avg resolution
- [ ] Task: Create SLA breach alerting via SystemAlerts
- [ ] Task: Build ticket metrics dashboard widget for admin home

### 1.7 Testing - Phase 1
- [ ] Task: Write unit tests for ticket creation and SLA calculation
- [ ] Task: Write unit tests for status workflow transitions
- [ ] Task: Write integration tests for ticket assignment and notifications
- [ ] Task: Test bulk actions with 100+ tickets
- [ ] Task: Verify SLA countdown accuracy across timezones
- [ ] Task: Conductor - User Manual Verification 'Phase 1'

---

## Phase 2: Knowledge Base Admin

### 2.1 Database Collections Setup
- [ ] Task: Create `KnowledgeArticles` collection with full schema
- [ ] Task: Create `ArticleCategories` collection with parent/child support
- [ ] Task: Create `ArticleVersions` collection for version history
- [ ] Task: Configure indexes for search (title, content, tags)
- [ ] Task: Set up slug auto-generation hook

### 2.2 Backend Service - knowledgeBaseService.jsw
- [ ] Task: Implement `createArticle(articleData)` with auto-versioning
- [ ] Task: Implement `getArticle(articleId)` with category info
- [ ] Task: Implement `getArticleBySlug(slug)` for public access
- [ ] Task: Implement `updateArticle(articleId, updates)` with version creation
- [ ] Task: Implement `publishArticle(articleId)` with validation
- [ ] Task: Implement `archiveArticle(articleId)` for soft delete
- [ ] Task: Implement `getCategories()` with nested structure
- [ ] Task: Implement `createCategory(categoryData)` with order management
- [ ] Task: Implement `reorderCategories(orderedIds)` for drag-drop support
- [ ] Task: Implement `searchArticles(query, filters)` with relevance ranking
- [ ] Task: Implement `getPopularArticles(limit)` by view count
- [ ] Task: Implement `getRelatedArticles(articleId)` by tags and category

### 2.3 Article Editor UI - ADMIN_KB_EDITOR.html
- [ ] Task: Build article metadata header (title, category, subcategory, status)
- [ ] Task: Implement Markdown editor with toolbar (bold, italic, headers, links, images)
- [ ] Task: Add live preview panel (side-by-side or toggle)
- [ ] Task: Build tag input with autocomplete from existing tags
- [ ] Task: Create SEO fields section (title override, meta description)
- [ ] Task: Add visibility selector (public, logged_in, admin_only)
- [ ] Task: Implement related articles picker
- [ ] Task: Build version history panel with diff view
- [ ] Task: Add revert to previous version functionality
- [ ] Task: Create save draft / preview / publish workflow buttons

### 2.4 Knowledge Base Dashboard - ADMIN_KB_LIST.html
- [ ] Task: Build article list with status badges (draft, published, archived)
- [ ] Task: Create category tree navigation sidebar
- [ ] Task: Implement drag-drop reordering within categories
- [ ] Task: Add search/filter (by category, status, author, date)
- [ ] Task: Display quick stats per article (views, helpfulness score)
- [ ] Task: Build bulk actions (publish, archive, change category)
- [ ] Task: Create "New Article" flow with category pre-selection

### 2.5 Analytics and Insights
- [ ] Task: Implement `recordArticleView(articleId, userId)` with deduplication
- [ ] Task: Implement `recordHelpfulVote(articleId, isHelpful)` tracking
- [ ] Task: Implement `getArticleAnalytics(articleId)` - views, helpfulness, search terms
- [ ] Task: Implement `getKBOverviewMetrics(dateRange)` - total views, top articles, search gaps
- [ ] Task: Build KB analytics dashboard - ADMIN_KB_ANALYTICS.html
- [ ] Task: Create "Search terms with no results" report for content gaps
- [ ] Task: Add helpfulness trend visualization

### 2.6 Public Knowledge Base
- [ ] Task: Create KB_HOME.html - category grid with popular articles
- [ ] Task: Create KB_ARTICLE.html - article display with helpful vote widget
- [ ] Task: Build KB_SEARCH.html - search results page with filters
- [ ] Task: Add breadcrumb navigation (Home > Category > Article)
- [ ] Task: Implement "Was this helpful?" widget with feedback
- [ ] Task: Add related articles sidebar
- [ ] Task: Link KB articles from ticket detail view

### 2.7 Testing - Phase 2
- [ ] Task: Write unit tests for article CRUD operations
- [ ] Task: Write unit tests for version history and revert
- [ ] Task: Write integration tests for search functionality
- [ ] Task: Test Markdown rendering edge cases
- [ ] Task: Verify analytics tracking accuracy
- [ ] Task: Conductor - User Manual Verification 'Phase 2'

---

## Phase 3: NPS/Satisfaction Tracking

### 3.1 Database Collections Setup
- [ ] Task: Create `NPSResponses` collection with segmentation fields
- [ ] Task: Create `SurveyConfig` collection for trigger configuration
- [ ] Task: Create `NPSTrends` collection for aggregated historical data
- [ ] Task: Configure indexes for time-series queries

### 3.2 Backend Service - npsService.jsw
- [ ] Task: Implement `submitNPSResponse(responseData)` with category calculation
- [ ] Task: Implement `shouldShowSurvey(userId, triggerType)` with cooldown logic
- [ ] Task: Implement `getNPSScore(dateRange, segment)` calculation
- [ ] Task: Implement `getNPSTrend(dateRange, granularity)` for charts
- [ ] Task: Implement `getSegmentBreakdown(dateRange)` by role, interaction type
- [ ] Task: Implement `getRecentFeedback(limit, category)` with filters
- [ ] Task: Implement `getSurveyConfig()` for admin settings
- [ ] Task: Implement `updateSurveyConfig(configId, updates)` with validation

### 3.3 Survey Trigger Integration
- [ ] Task: Add NPS survey trigger after ticket resolution (in supportTicketService)
- [ ] Task: Add CSAT survey trigger after chat end (in chatSupportService)
- [ ] Task: Implement periodic NPS survey via email (monthly)
- [ ] Task: Build survey rate-limiting (cooldown between surveys per user)
- [ ] Task: Create survey sample rate configuration (% of users surveyed)

### 3.4 Survey UI Components
- [ ] Task: Build NPS survey modal component (0-10 scale)
- [ ] Task: Add optional feedback text field
- [ ] Task: Create CSAT survey variant (1-5 stars)
- [ ] Task: Implement survey dismiss tracking (for follow-up)
- [ ] Task: Add thank you confirmation message
- [ ] Task: Build email survey template for periodic NPS

### 3.5 NPS Dashboard - ADMIN_NPS.html
- [ ] Task: Build current NPS score display with gauge visualization
- [ ] Task: Create Detractor/Passive/Promoter breakdown chart
- [ ] Task: Implement NPS trend line chart (daily/weekly/monthly)
- [ ] Task: Build segment breakdown cards (by role, interaction type)
- [ ] Task: Create recent feedback list with score and text
- [ ] Task: Add feedback sentiment indicators (positive/negative)
- [ ] Task: Build date range selector (7d, 30d, 90d, custom)
- [ ] Task: Create export functionality for NPS data

### 3.6 Alerting and Insights
- [ ] Task: Implement detractor alert (notify on score 0-6 with feedback)
- [ ] Task: Create weekly NPS summary email for admins
- [ ] Task: Build NPS goal tracking (target vs actual)
- [ ] Task: Add segment comparison visualizations

### 3.7 Testing - Phase 3
- [ ] Task: Write unit tests for NPS score calculation
- [ ] Task: Write unit tests for survey cooldown logic
- [ ] Task: Write integration tests for trigger points
- [ ] Task: Test survey modal across devices
- [ ] Task: Verify trend calculations with sample data
- [ ] Task: Conductor - User Manual Verification 'Phase 3'

---

## Phase 4: Chat Support Dashboard

### 4.1 Database Collections Setup
- [ ] Task: Create `ChatSessions` collection with queue and status fields
- [ ] Task: Create `ChatMessages` collection with session reference
- [ ] Task: Create `CannedResponses` collection for quick replies
- [ ] Task: Configure indexes for real-time query performance
- [ ] Task: Set up TTL index for message cleanup (optional)

### 4.2 Backend Service - chatSupportService.jsw
- [ ] Task: Implement `startChatSession(userData, topic)` with queue position
- [ ] Task: Implement `assignChatToAgent(sessionId, agentId)` with notification
- [ ] Task: Implement `endChatSession(sessionId, rating)` with metrics calculation
- [ ] Task: Implement `getAgentActiveChats(agentId)` for console
- [ ] Task: Implement `getChatQueue()` with wait time estimates
- [ ] Task: Implement `sendChatMessage(sessionId, content, senderType)` with validation
- [ ] Task: Implement `getChatHistory(sessionId)` full transcript
- [ ] Task: Implement `getChatMessagesSince(sessionId, timestamp)` for polling
- [ ] Task: Implement `convertChatToTicket(sessionId)` with transcript attachment
- [ ] Task: Implement `getCannedResponses(category)` for quick replies
- [ ] Task: Implement `createCannedResponse(responseData)` admin function
- [ ] Task: Implement `updateCannedResponse(responseId, updates)` with usage tracking

### 4.3 Real-Time Messaging
- [ ] Task: Implement optimized polling for chat updates (2-second interval)
- [ ] Task: Build message deduplication logic
- [ ] Task: Add typing indicator support
- [ ] Task: Implement message delivery confirmation
- [ ] Task: Handle reconnection gracefully (show missed messages)

### 4.4 Agent Console UI - ADMIN_CHAT.html
- [ ] Task: Build three-panel layout (queue, active chat, user info)
- [ ] Task: Create queue panel with wait time indicators
- [ ] Task: Implement "Accept from queue" action
- [ ] Task: Build active chat panel with message thread
- [ ] Task: Add message composer with send button
- [ ] Task: Create canned responses dropdown/shortcode support
- [ ] Task: Build user info sidebar (profile, history, open tickets)
- [ ] Task: Add "Transfer to another agent" functionality
- [ ] Task: Implement "Convert to ticket" button
- [ ] Task: Add chat end button with rating prompt trigger
- [ ] Task: Show "My Chats" list for multiple concurrent chats

### 4.5 Agent Availability Management
- [ ] Task: Build agent online/offline toggle
- [ ] Task: Implement auto-away after inactivity (5 minutes)
- [ ] Task: Create agent capacity setting (max concurrent chats)
- [ ] Task: Build agent status display for supervisors
- [ ] Task: Add "Currently chatting" indicator in sidebar

### 4.6 User Chat Widget
- [ ] Task: Create CHAT_WIDGET.html embeddable component
- [ ] Task: Build chat launcher button with online indicator
- [ ] Task: Implement chat window with message thread
- [ ] Task: Add topic/category selection at start
- [ ] Task: Show queue position and estimated wait time
- [ ] Task: Build post-chat rating widget (1-5 stars)
- [ ] Task: Handle agent unavailable state gracefully
- [ ] Task: Integrate widget into driver/carrier/recruiter dashboards

### 4.7 Canned Responses Management - ADMIN_CANNED_RESPONSES.html
- [ ] Task: Build canned response list with categories
- [ ] Task: Create response editor (title, shortcode, content)
- [ ] Task: Add category management (Greeting, Issue, Escalation, Closing)
- [ ] Task: Display usage statistics per response
- [ ] Task: Implement search/filter for responses

### 4.8 Chat Analytics
- [ ] Task: Implement `getChatMetrics(dateRange)` - volume, resolution rate, avg duration
- [ ] Task: Implement `getAgentChatStats(agentId, dateRange)` - chats handled, rating
- [ ] Task: Build chat metrics dashboard widget
- [ ] Task: Add queue wait time tracking and reporting
- [ ] Task: Create chat volume forecasting (by hour/day)

### 4.9 Integration with Existing Systems
- [ ] Task: Integrate chat escalation with existing messaging.jsw
- [ ] Task: Connect chat session to driver/carrier profile lookup
- [ ] Task: Link chat history from ticket detail view
- [ ] Task: Add chat activity to admin activity feed

### 4.10 Testing - Phase 4
- [ ] Task: Write unit tests for chat session lifecycle
- [ ] Task: Write unit tests for queue management
- [ ] Task: Write integration tests for real-time messaging
- [ ] Task: Load test with 50 concurrent chat sessions
- [ ] Task: Test agent offline/online transitions
- [ ] Task: Verify cross-browser compatibility for widget
- [ ] Task: Conductor - User Manual Verification 'Phase 4'

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
| Public KB Home | `src/public/landing/KB_HOME.html` |
| Public KB Article | `src/public/landing/KB_ARTICLE.html` |
