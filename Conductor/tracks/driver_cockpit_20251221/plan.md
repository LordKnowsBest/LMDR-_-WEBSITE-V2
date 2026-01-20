# Track Plan: Driver Cockpit & Application Journey

## Phase 4A: Immediate Feedback Modal [checkpoint: 60ea10a]
- [x] Task: Create `InterestConfirmationModal` component in AI_MATCHING.html
- [x] Task: Display carrier contact info (phone, email) from carrier data
- [x] Task: Add "View My Applications" button linking to dashboard
- [x] Task: Add "Apply Now" button to trigger doc upload flow
- [x] Task: Update `interestLogged` handler to show modal instead of silent update
- [x] Task: Conductor - User Manual Verification 'Phase 4A: Immediate Feedback Modal'

## Phase 4B: Application Form & Document Upload [checkpoint: 8572001]
- [x] Task: Create `applicationService.jsw` with `submitApplication()` function
- [x] Task: Build application form modal with contact fields (phone, email, availability, message)
- [x] Task: Create `validateApplicationForm()` to check minimum requirements (phone, email)
- [x] Task: Update `DriverCarrierInterests` status from "interested" to "applied"
- [x] Task: Connect Apply button to show application form modal
- [x] Task: Add applicationSubmitted handler in HTML and Velo page
- [x] Task: Add file upload UI for CDL (front/back) and Medical Card
- [x] Task: Implement base64 file encoding and validation (5MB limit)
- [x] Task: Update backend with `uploadDocument()` helper using wix-media-backend
- [x] Task: Store document URLs in DriverCarrierInterests (cdl_front_url, cdl_back_url, med_card_url)
- [x] Task: Send confirmation email to driver after application
- [x] Task: Conductor - User Manual Verification 'Phase 4B: Application Form' [5655]

## Phase 4C: Driver Profile Completion (Quick Apply)
- [x] Task: Extend `DriverProfiles` schema with doc fields (cdl_image, med_card, resume)
- [x] Task: Create profile completion wizard/stepper UI
- [x] Task: Implement document upload to driver profile (reusable across applications)
- [x] Task: Calculate and display profile completeness percentage
- [x] Task: Add "Quick Apply" button that auto-submits stored docs
- [x] Task: Show "Complete Profile" CTA on match cards for incomplete profiles
- [x] Task: Expand application form with all driver fields (name, location, CDL class, endorsements, experience, equipment, routes, home time, MVR)
- [x] Task: Fix page code to pass all new fields to backend (was filtering out new fields)
- [x] Task: Conductor - User Manual Verification 'Phase 4C: Profile Completion' [verified 2026-01-14]

## Phase 4D: Application Tracker Dashboard
- [x] Task: Create new Wix page `Driver-Dashboard` (or embed in Member Page)
- [x] Task: Build dashboard HTML component showing all applications
- [x] Task: Implement status badges (Saved, Applied, In Review, Contacted, Offer, etc.)
- [x] Task: Add filter/sort by status, date, carrier name
- [x] Task: Display carrier info card for each application
- [x] Task: Add quick actions (Withdraw, View Carrier, Contact)
- [x] Task: Create `getDriverApplications()` backend function
- [x] Task: Conductor - User Manual Verification 'Phase 4D: Application Dashboard'

## Phase 4E: Status Sync & Notifications [checkpoint: 4341660]
- [x] Task: Create `updateApplicationStatus()` function (called by recruiter actions)
- [x] Task: Add `status_history` array to track all status changes with timestamps
- [x] Task: Implement real-time status updates on dashboard (polling)
- [x] Task: Create email notification templates for status changes
- [x] Task: Send notification when recruiter moves driver in pipeline
- [x] Task: Add activity timeline view showing all status changes
- [x] Task: Conductor - User Manual Verification 'Phase 4E: Status Sync'

## Phase 4F: Agency Model & Multi-Carrier Support
- [x] Task: Refactor `recruiterService` to support multiple carriers per recruiter
- [x] Task: Create `RecruiterCarriers` collection for access management
- [x] Task: Implement `addCarrier`, `removeCarrier`, `switchCarrier` in backend
- [x] Task: Update Recruiter Console UI to include Carrier Switcher dropdown
- [x] Task: Create "Add Carrier" onboarding flow for new recruiters
- [x] Task: Update all data fetching (pipeline, stats) to respect current carrier context

## Phase 4G: Recruiter-Driver Messaging Enhancement
- [x] Task: Fix sender_type param bug in Driver Dashboard
- [x] Task: Fix function name mismatch (markAsRead)
- [x] Task: Add sender validation (validateSenderPermission)
- [x] Task: Add content sanitization (stripHtml, length limit)
- [x] Task: Add email notification on new message (sendMessageNotification)
- [x] Task: Create messagingRealtime.jsw with getNewMessages, getUnreadCountForUser
- [x] Task: Implement smart polling with exponential backoff (both dashboards)
- [x] Task: Add unread message badges (both dashboards)
- [x] Task: Conductor - User Manual Verification 'Phase 4G: Messaging'
