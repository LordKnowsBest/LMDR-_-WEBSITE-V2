# Track Spec: Driver Cockpit & Application Journey

## 1. Goal
Transform the post-match experience from a dead-end "I'm Interested" click into a full application journey with document upload, status tracking, and recruiter communication - giving drivers transparency and control throughout the hiring process.

## 2. Background
*   **Current State:** Driver clicks "I'm Interested" → logged to DB → nothing happens. No docs collected, no application submitted, no status visibility.
*   **Desired State:** A progressive engagement funnel where drivers can:
    1. Signal light interest (save/favorite)
    2. Apply with required docs (CDL, resume)
    3. Complete full profile for Quick Apply & better matches
    4. Track all applications in a central dashboard
    5. See real-time status updates as recruiters move them through the pipeline

## 3. User Journey

### 3.1 Guest (No Account)
- View 2 carrier matches
- Cannot save or apply
- CTA: "Sign up to see all 10 matches"

### 3.2 Member (Free Account)
- View 10 carrier matches
- Can click "Save" to bookmark carriers (no docs required)
- Can click "Apply" which triggers doc upload flow
- CTA: "Complete your profile for Quick Apply"

### 3.3 Verified Member (Full Profile)
- All docs on file (CDL, Med Card, Resume, Work History)
- "Quick Apply" sends full packet to carrier instantly
- Higher visibility to recruiters (profile completeness score)
- Better match scores (more data = better matching)

### 3.4 Application Management
- Dashboard showing all applications
- Status for each: Saved → Applied → In Review → Contacted → Offer/Pass
- Direct messaging with recruiters (future phase)
- Notifications when status changes

## 4. Key Requirements

### 4.1 Immediate Feedback (Phase 4A)
- Modal appears after clicking "Apply"
- Shows confirmation + carrier contact info
- Links to application dashboard
- Clear next steps

### 4.2 Application Form (Phase 4B)
- Minimum required: CDL photo, contact info
- Optional: Resume, work history, references
- Progress indicator for completion
- Save & continue later capability

### 4.3 Document Management (Phase 4C)
- Upload CDL (front/back)
- Upload Medical Card
- Upload Resume (PDF/DOC)
- Work history form (carriers, dates, reason for leaving)
- All docs stored securely, reusable across applications

### 4.4 Application Tracker Dashboard (Phase 4D)
- List/card view of all applications
- Status badges (color-coded pipeline stages)
- Filter by status
- Quick actions (withdraw, message, view carrier)

### 4.5 Status Sync (Phase 4E)
- When recruiter moves driver in Kanban → driver status updates
- Email/push notifications for status changes
- Activity log showing timeline

## 5. Data Model Changes

### DriverProfiles Collection (Extend)
```
cdl_front_image: Image
cdl_back_image: Image
cdl_number: String
cdl_expiration: Date
med_card_image: Image
med_card_expiration: Date
resume_file: File
work_history: Array<{carrier, start_date, end_date, reason_left}>
profile_verified: Boolean
docs_complete: Boolean
```

### DriverCarrierInterests Collection (Extend)
```
status: String (saved | applied | in_review | contacted | offer | hired | rejected | withdrawn)
status_history: Array<{status, timestamp, updated_by}>
application_date: Date
docs_submitted: Array<String>
recruiter_notes: String (visible to driver? TBD)
```

## 6. Design Guidelines
- Mobile-first (drivers often on phone)
- Progress indicators everywhere (reduce abandonment)
- Clear status language (avoid jargon)
- Celebrate milestones (application submitted, profile complete)
