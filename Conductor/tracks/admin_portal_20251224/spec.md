# Specification: LMDR Admin Portal

## 1. Overview

The LMDR Admin Portal is a centralized command center for platform administrators to manage users, monitor system health, moderate content, configure AI services, and track business metrics. It consolidates all administrative functions into a single, role-based interface.

---

## 2. Target Users

| Role | Access Level | Primary Functions |
|------|--------------|-------------------|
| **Super Admin** | Full | All functions, system config, billing |
| **Operations Admin** | High | User management, moderation, support |
| **Compliance Admin** | Medium | DQF audits, FMCSA compliance, reviews |
| **Analytics Viewer** | Read-only | Dashboards, reports, exports |

---

## 3. Information Architecture

```
Admin Portal
├── Dashboard (Home)
│   ├── KPI Cards (Active Users, Matches Today, Revenue)
│   ├── Real-time Activity Feed
│   ├── System Health Status
│   └── Alerts & Action Items
│
├── User Management
│   ├── Drivers
│   │   ├── List/Search/Filter
│   │   ├── Profile Detail View
│   │   ├── Application History
│   │   ├── Document Verification Status
│   │   └── Actions (Suspend, Verify, Message)
│   ├── Carriers
│   │   ├── List/Search/Filter
│   │   ├── Company Profile
│   │   ├── FMCSA Data & Safety Scores
│   │   ├── Job Postings
│   │   └── Actions (Approve, Flag, Suspend)
│   ├── Recruiters
│   │   ├── List/Search/Filter
│   │   ├── Agency Associations
│   │   ├── Performance Metrics
│   │   └── Actions (Manage Carriers, Reset Access)
│   └── Admins
│       ├── Role Management
│       ├── Permission Matrix
│       └── Audit Log by Admin
│
├── Matching & Analytics
│   ├── Match Analytics
│   │   ├── Match Volume (Daily/Weekly/Monthly)
│   │   ├── Conversion Funnel
│   │   ├── Geographic Heat Map
│   │   └── Top Performing Carriers
│   ├── Driver Analytics
│   │   ├── Registration Trends
│   │   ├── Profile Completion Rates
│   │   ├── Application Success Rates
│   │   └── Cohort Analysis
│   ├── Carrier Analytics
│   │   ├── Posting Activity
│   │   ├── Response Rates
│   │   ├── Hire-to-Post Ratio
│   │   └── Retention Metrics
│   └── Revenue Analytics
│       ├── Subscription Breakdown
│       ├── MRR/ARR Tracking
│       ├── Churn Analysis
│       └── LTV by Segment
│
├── Content Moderation
│   ├── Review Queue
│   │   ├── Pending Driver Reviews
│   │   ├── Flagged Content
│   │   ├── Moderation Actions (Approve/Reject/Edit)
│   │   └── Appeal Management
│   ├── Job Postings
│   │   ├── Pending Approval
│   │   ├── Reported Listings
│   │   └── Duplicate Detection
│   └── Documents
│       ├── Unverified CDLs
│       ├── Expired Medical Cards
│       └── Manual Review Queue
│
├── AI & Enrichment
│   ├── Enrichment Status
│   │   ├── Queue Depth
│   │   ├── Processing Rate
│   │   ├── Error Log
│   │   └── Cache Hit Rate
│   ├── API Usage
│   │   ├── Claude API (Tokens/Cost)
│   │   ├── Perplexity API (Queries/Cost)
│   │   ├── FMCSA API (Calls/Limits)
│   │   └── Social Scanner Activity
│   ├── Model Performance
│   │   ├── Match Score Accuracy
│   │   ├── Enrichment Quality Scores
│   │   └── Sentiment Analysis Metrics
│   └── Configuration
│       ├── Matching Weights Editor
│       ├── Enrichment Prompts
│       ├── Cache TTL Settings
│       └── Rate Limit Config
│
├── Compliance Center
│   ├── FMCSA Compliance
│   │   ├── Carrier Safety Alerts
│   │   ├── Out-of-Service Tracking
│   │   ├── Inspection Rate Anomalies
│   │   └── Regulatory Updates
│   ├── DQF Audits
│   │   ├── Pending DQF Files
│   │   ├── Compliance Score by Carrier
│   │   ├── Missing Documents Report
│   │   └── Audit Trail
│   ├── Data Privacy
│   │   ├── Data Deletion Requests
│   │   ├── Export Requests
│   │   ├── Consent Management
│   │   └── PII Access Log
│   └── Platform Compliance
│       ├── Terms of Service Violations
│       ├── Fraud Detection Alerts
│       └── Account Verification Status
│
├── System Configuration
│   ├── Platform Settings
│   │   ├── Tier Limits (Free/Premium)
│   │   ├── Feature Flags
│   │   ├── Maintenance Mode
│   │   └── Announcement Banner
│   ├── Email Templates
│   │   ├── Transactional Emails
│   │   ├── Marketing Templates
│   │   └── Notification Settings
│   ├── Integrations
│   │   ├── API Keys Management
│   │   ├── Webhook Configuration
│   │   ├── Third-party Connections
│   │   └── OAuth Settings
│   └── Scheduled Jobs
│       ├── Job Status Monitor
│       ├── Run History
│       ├── Manual Triggers
│       └── Error Handling
│
└── Support & Communications
    ├── Support Tickets
    │   ├── Open Tickets
    │   ├── Ticket Assignment
    │   ├── Response Templates
    │   └── Escalation Rules
    ├── Broadcast Messages
    │   ├── Send to Drivers
    │   ├── Send to Carriers
    │   ├── Send to Recruiters
    │   └── Message History
    └── Feedback & Surveys
        ├── NPS Tracking
        ├── Feature Requests
        └── Bug Reports
```

---

## 4. Core Screens Specification

### 4.1 Dashboard (Home)

**Purpose:** Single-glance overview of platform health and key metrics.

**Layout:**
- Header with search, notifications, admin profile
- 4-column KPI card row
- 2-column split: Activity Feed (left), Alerts (right)
- System health status bar (footer)

**KPI Cards:**
| Metric | Source | Refresh |
|--------|--------|---------|
| Active Drivers (7d) | `DriverProfiles` | Real-time |
| Matches Today | `MatchEvents` | Real-time |
| Pending Reviews | `DriverReviews` | 5 min |
| AI Queue Depth | `CarrierEnrichments` | 1 min |

**Activity Feed Items:**
- New driver registrations
- New carrier signups
- High-value matches (90%+)
- Flagged content
- System events

**Alert Types:**
- Critical: System errors, API failures
- Warning: Enrichment queue backup, high error rate
- Info: New feature flags, scheduled maintenance

---

### 4.2 User Management - Drivers

**Purpose:** View, search, and manage driver accounts.

**List View Columns:**
| Column | Sortable | Filterable |
|--------|----------|------------|
| Name | Yes | Search |
| Email | Yes | Search |
| Status | Yes | Dropdown |
| Profile % | Yes | Range |
| Joined | Yes | Date Range |
| Last Active | Yes | Date Range |
| Applications | Yes | Range |
| Actions | No | No |

**Filters:**
- Status: Active, Pending, Suspended, Incomplete
- Verification: Verified, Unverified, Expired Docs
- Tier: Free, Premium
- Location: State/Region

**Profile Detail View:**
- Header: Photo, name, contact, status badge
- Tabs: Profile, Applications, Documents, Activity, Notes
- Quick Actions: Message, Verify, Suspend, Delete

**Bulk Actions:**
- Send message to selected
- Export to CSV
- Bulk verify
- Bulk suspend

---

### 4.3 User Management - Carriers

**Purpose:** Manage carrier company accounts and monitor compliance.

**List View Columns:**
| Column | Description |
|--------|-------------|
| Company Name | With DOT number |
| FMCSA Rating | Satisfactory/Conditional/Unsatisfactory |
| Fleet Size | Number of trucks |
| Active Jobs | Current postings |
| Safety Score | Calculated composite |
| Enrichment | Last enriched date |
| Status | Active/Pending/Flagged |

**Profile Detail View:**
- Company header with logo, DOT, MC numbers
- FMCSA Data panel (pulled from `CarrierSafetyData`)
- Enrichment preview (from `CarrierEnrichments`)
- Job postings list
- Recruiter associations
- Review summary

**Actions:**
- Refresh FMCSA data
- Force re-enrichment
- Flag for review
- Suspend account

---

### 4.4 AI & Enrichment Dashboard

**Purpose:** Monitor and configure the AI enrichment pipeline.

**Queue Monitor Panel:**
```
┌─────────────────────────────────────────────────────┐
│  ENRICHMENT QUEUE                                   │
├─────────────────────────────────────────────────────┤
│  Pending: 12    Processing: 3    Failed: 1          │
│  ████████████░░░░░░░░ 65% Complete                  │
│                                                     │
│  Avg Processing Time: 45s                           │
│  Cache Hit Rate: 78%                                │
│  Last Error: "Rate limit exceeded" (2 min ago)      │
└─────────────────────────────────────────────────────┘
```

**API Usage Panel:**
| Service | Today | This Month | Limit | Cost |
|---------|-------|------------|-------|------|
| Claude API | 1,250 | 28,400 | Unlimited | $142 |
| Perplexity | 890 | 19,200 | 50,000 | $96 |
| FMCSA | 340 | 8,100 | 10,000/day | Free |

**Configuration Panel:**
- Match Weight Sliders (location, pay, safety, etc.)
- Cache TTL inputs (enrichment: 14 days, FMCSA: 7 days)
- Batch size configuration
- Rate limit settings

---

### 4.5 Content Moderation Queue

**Purpose:** Review and moderate user-generated content.

**Queue Layout:**
- Left: List of pending items with priority indicators
- Right: Content preview with context
- Bottom: Action buttons

**Review Card:**
```
┌─────────────────────────────────────────────────────┐
│  DRIVER REVIEW - Pending Approval                   │
├─────────────────────────────────────────────────────┤
│  Carrier: Swift Transport (DOT: 123456)             │
│  Reviewer: John D. (verified driver)                │
│  Rating: ★★★★☆ (4/5)                               │
│  Submitted: Dec 24, 2025 10:32 AM                   │
├─────────────────────────────────────────────────────┤
│  "Pay is competitive but home time could be         │
│   better. Dispatch is responsive. Equipment is      │
│   newer - mostly 2022+ trucks."                     │
├─────────────────────────────────────────────────────┤
│  AI Flags: None                                     │
│  Sentiment: Neutral-Positive                        │
├─────────────────────────────────────────────────────┤
│  [Approve]  [Edit & Approve]  [Reject]  [Flag User] │
└─────────────────────────────────────────────────────┘
```

**Auto-Flag Triggers:**
- Profanity detected
- PII in review text
- Suspicious patterns (too many 5-star or 1-star)
- Reviewer has no verified employment

---

### 4.6 Compliance Center

**Purpose:** Track regulatory compliance and manage audits.

**FMCSA Alerts Dashboard:**
- Carriers with rating changes (past 30 days)
- Out-of-Service rate anomalies
- Inspection failures above threshold
- New safety violations

**DQF File Status:**
| Status | Count | Action |
|--------|-------|--------|
| Complete | 234 | View |
| Missing Docs | 45 | Notify |
| Expired | 12 | Urgent |
| Pending Review | 28 | Process |

**Audit Trail:**
- All admin actions logged
- Filterable by admin, action type, date
- Exportable for compliance reporting

---

## 5. Design Language

### Color System (Extended from Product Guidelines)

| Token | Hex | Usage |
|-------|-----|-------|
| `admin-dark` | `#0f172a` | Primary background |
| `admin-surface` | `#1e293b` | Card backgrounds |
| `admin-border` | `#334155` | Dividers, borders |
| `admin-text` | `#f1f5f9` | Primary text |
| `admin-muted` | `#94a3b8` | Secondary text |
| `accent-blue` | `#2563eb` | Primary actions |
| `accent-green` | `#10b981` | Success, positive |
| `accent-yellow` | `#f59e0b` | Warning, pending |
| `accent-red` | `#ef4444` | Error, critical |
| `accent-purple` | `#8b5cf6` | AI/ML indicators |

### Typography

- **Font Family:** Inter (consistent with platform)
- **Heading Scale:**
  - H1: 24px, Bold
  - H2: 18px, Semibold
  - H3: 14px, Bold, Uppercase, Letter-spacing
- **Body:** 14px, Regular
- **Caption:** 11px, Medium

### Component Patterns

**Data Tables:**
- Striped rows for readability
- Sticky header on scroll
- Column resizing
- Row hover highlight
- Inline actions on hover

**Cards:**
- `rounded-xl` corners
- `p-6` padding
- Subtle shadow (`shadow-lg shadow-black/10`)
- Border: `border border-admin-border`

**Status Badges:**
```css
.badge-success { @apply bg-green-500/20 text-green-400 border border-green-500/30; }
.badge-warning { @apply bg-yellow-500/20 text-yellow-400 border border-yellow-500/30; }
.badge-error   { @apply bg-red-500/20 text-red-400 border border-red-500/30; }
.badge-info    { @apply bg-blue-500/20 text-blue-400 border border-blue-500/30; }
.badge-ai      { @apply bg-purple-500/20 text-purple-400 border border-purple-500/30; }
```

---

## 6. Navigation Structure

### Sidebar Navigation

```
┌──────────────────────────┐
│  LMDR ADMIN              │
│  ────────────────────────│
│  ◉ Dashboard             │
│                          │
│  MANAGEMENT              │
│  ○ Drivers               │
│  ○ Carriers              │
│  ○ Recruiters            │
│  ○ Admins                │
│                          │
│  ANALYTICS               │
│  ○ Matches               │
│  ○ Revenue               │
│  ○ Reports               │
│                          │
│  OPERATIONS              │
│  ○ Moderation            │
│  ○ AI & Enrichment       │
│  ○ Compliance            │
│                          │
│  SYSTEM                  │
│  ○ Configuration         │
│  ○ Integrations          │
│  ○ Jobs & Logs           │
│                          │
│  ────────────────────────│
│  ⚙ Settings              │
│  ↩ Back to Site          │
└──────────────────────────┘
```

### Header Bar

```
┌─────────────────────────────────────────────────────────────────┐
│  [☰]  Admin Portal    │ 🔍 Search users, carriers...           │
│                       ├─────────────────────────────────────────│
│                       │              🔔 3  │  👤 Admin Name ▼  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Data Requirements

### New Collections Required

**AdminUsers**
| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `email` | String | Admin email |
| `name` | String | Display name |
| `role` | String | super_admin, ops_admin, compliance_admin, viewer |
| `permissions` | Array | Granular permissions |
| `lastLogin` | DateTime | Last login timestamp |
| `createdAt` | DateTime | Account creation |

**AdminAuditLog**
| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `adminId` | Reference | Admin who performed action |
| `action` | String | Action type |
| `targetType` | String | driver, carrier, system, etc. |
| `targetId` | String | ID of affected entity |
| `details` | Object | Action-specific data |
| `timestamp` | DateTime | When action occurred |
| `ipAddress` | String | Admin's IP |

**SystemAlerts**
| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | Primary key |
| `type` | String | critical, warning, info |
| `category` | String | enrichment, api, compliance, etc. |
| `message` | String | Alert description |
| `resolved` | Boolean | Whether addressed |
| `resolvedBy` | Reference | Admin who resolved |
| `createdAt` | DateTime | Alert timestamp |

### Backend Functions Required

**adminService.jsw**
```javascript
// User Management
export async function getDriversList(filters, pagination)
export async function getDriverDetail(driverId)
export async function updateDriverStatus(driverId, status, reason)
export async function getCarriersList(filters, pagination)
export async function getCarrierDetail(carrierId)

// Analytics
export async function getDashboardMetrics()
export async function getMatchAnalytics(dateRange)
export async function getRevenueAnalytics(dateRange)

// Moderation
export async function getModerationQueue(type)
export async function approveContent(contentId, type)
export async function rejectContent(contentId, type, reason)

// AI & Enrichment
export async function getEnrichmentStats()
export async function getApiUsageStats()
export async function updateMatchingWeights(weights)
export async function forceEnrichment(carrierId)

// System
export async function getSystemHealth()
export async function getScheduledJobs()
export async function triggerJob(jobName)
export async function getAuditLog(filters, pagination)
```

---

## 8. Security Requirements

### Authentication
- Wix Members authentication with admin role check
- Session timeout after 30 minutes of inactivity
- Re-authentication required for sensitive actions

### Authorization
- Role-based access control (RBAC)
- Permission checks on every backend function
- UI elements hidden based on permissions

### Audit Logging
- All admin actions logged to `AdminAuditLog`
- Log retention: 2 years minimum
- Immutable log entries (no deletion)

### Data Access
- PII masked in list views (show last 4 of email)
- Full access only in detail views with audit
- Export requires elevated permission

---

## 9. Implementation Priority

### Phase 1: Foundation (Week 1-2)
- [ ] Admin portal page structure and navigation
- [ ] Dashboard with KPI cards
- [ ] Basic driver list with search/filter
- [ ] Basic carrier list with search/filter
- [ ] Admin authentication and role check

### Phase 2: Core Management (Week 3-4)
- [ ] Driver detail view with all tabs
- [ ] Carrier detail view with FMCSA data
- [ ] User status management actions
- [ ] Content moderation queue
- [ ] Audit logging system

### Phase 3: Intelligence (Week 5-6)
- [ ] AI enrichment monitoring dashboard
- [ ] API usage tracking
- [ ] Match analytics visualizations
- [ ] Compliance center alerts
- [ ] System health monitoring

### Phase 4: Advanced (Week 7-8)
- [ ] Revenue analytics
- [ ] Broadcast messaging
- [ ] Configuration management
- [ ] Export and reporting
- [ ] Advanced search and filters

---

## 10. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Admin task completion time | -50% | Before/after timing |
| Moderation queue processing | <24 hours | Queue age tracking |
| System issue detection | <5 minutes | Alert timestamp vs. incident |
| Admin satisfaction | >4.5/5 | Internal survey |
| Audit compliance | 100% | All actions logged |
