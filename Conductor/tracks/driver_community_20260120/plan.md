# Track Plan: Driver Community - Forums, Mentorship & Wellness

## Phase 1: Driver Forums (Foundation)

The forum system provides the foundation for all community interactions and establishes the reputation system used across features.

### 1.1 Backend Infrastructure
- [x] Task: Create `ForumCategories` collection in Wix with schema from spec
- [x] Task: Create `ForumThreads` collection with proper indexes (category_id, created_at, is_pinned)
- [x] Task: Create `ForumPosts` collection with indexes (thread_id, created_at)
- [x] Task: Create `ForumReputationLog` collection for point tracking
- [x] Task: Create `UserReputation` collection (or extend DriverProfiles)
- [x] Task: Create `ReputationBadges` collection with initial badge definitions

### 1.2 Forum Service Backend
- [x] Task: Create `forumService.jsw` with category CRUD operations
- [x] Task: Implement `getCategories()` with cached thread/post counts
- [x] Task: Implement `getCategoryBySlug()` with stats aggregation
- [x] Task: Implement `getThreadsByCategory()` with pagination (limit, offset, sort)
- [x] Task: Implement `getThreadBySlug()` including first page of posts
- [x] Task: Implement `createThread()` with author validation and slug generation
- [x] Task: Implement `updateThread()` with author-only permission check
- [x] Task: Implement `getPostsByThread()` with pagination and nested reply support
- [x] Task: Implement `createPost()` with parent_post_id for nested replies
- [x] Task: Implement `updatePost()` with edit history tracking
- [x] Task: Implement `deletePost()` as soft delete (is_hidden = true)
- [x] Task: Implement `likePost()` with duplicate prevention
- [x] Task: Implement `markBestAnswer()` with thread author validation

### 1.3 Reputation Service Backend
- [x] Task: Create `reputationService.jsw` for point management
- [x] Task: Implement `awardPoints()` with action type validation
- [x] Task: Implement `getReputation()` returning full profile with badges
- [x] Task: Implement `getLeaderboard()` with timeframe filtering (week, month, all)
- [x] Task: Implement `checkBadgeEligibility()` for automatic badge awards
- [x] Task: Implement `awardBadge()` for manual badge assignment
- [x] Task: Add reputation hooks to forum actions (post created, like received, best answer)

### 1.4 Moderation Backend
- [x] Task: Create auto-moderation utility with profanity filter integration
- [x] Task: Implement `reportPost()` for user-submitted reports
- [x] Task: Implement `getModQueue()` for moderator review queue
- [x] Task: Implement `moderatePost()` with action logging (approve, hide, warn)
- [x] Task: Add new-user approval flow (first 3 posts require review)
- [x] Task: Implement spam detection patterns (multiple links, all caps)
- [x] Task: Create moderator role check utilities (`canModerate()`, `canBan()`)

### 1.5 Forum UI - Category List
- [x] Task: Create `DRIVER_FORUMS.html` in `src/public/driver/`
- [x] Task: Build category list component with icons and stats
- [x] Task: Add last activity timestamp with relative time display
- [x] Task: Implement "New Thread" button with category pre-selection
- [x] Task: Add search bar for full-text thread search
- [x] Task: Style with LMDR theme variables (dark mode support)

### 1.6 Forum UI - Thread View
- [x] Task: Create thread detail view component
- [x] Task: Build post card component with author info and reputation badges
- [x] Task: Implement like button with optimistic UI update
- [x] Task: Add "Best Answer" marking UI (thread author only)
- [x] Task: Build reply composer with markdown support
- [x] Task: Add nested reply threading UI (indent levels)
- [x] Task: Implement post edit mode with cancel/save
- [x] Task: Add report button with reason selection modal

### 1.7 Forum UI - Create Thread
- [x] Task: Create new thread modal/page
- [x] Task: Build title input with character counter (200 max)
- [x] Task: Implement rich text editor for post body
- [x] Task: Add tag input with autocomplete suggestions
- [x] Task: Add category selector dropdown
- [x] Task: Implement form validation and error states
- [x] Task: Add preview mode before posting

### 1.8 Moderation UI
- [x] Task: Create `ADMIN_MODERATION.html` in `src/public/admin/`
- [x] Task: Build moderation queue list with filters (pending, reported)
- [x] Task: Add post preview with full context (thread, author history)
- [x] Task: Implement quick action buttons (approve, hide, warn, ban)
- [x] Task: Add moderator notes field for internal tracking
- [x] Task: Build user warning/ban interface with reason templates

### 1.9 Wix Page Integration
- [x] Task: Create "Community Forums" page in Wix Editor
- [x] Task: Add HTML component and connect to DRIVER_FORUMS.html
- [x] Task: Set up postMessage bridge for backend calls
- [x] Task: Configure page permissions (members only)
- [x] Task: Add forum link to driver dashboard navigation
- [ ] Task: Update masterPage.js with forum notification badge

### 1.10 Testing - Forums
- [x] Task: Write unit tests for `forumService.jsw` CRUD operations
- [x] Task: Write unit tests for `reputationService.jsw` point calculations
- [x] Task: Write unit tests for moderation auto-filter rules
- [x] Task: Test thread creation with various edge cases (long titles, special chars)
- [x] Task: Test nested reply threading to 3 levels deep
- [x] Task: Test pagination with 100+ posts per thread
- [ ] Task: Manual test: full forum flow as new user (post approval required)
- [ ] Task: Manual test: moderation queue workflow
- [x] Task: Conductor - User Manual Verification 'Phase 1: Driver Forums'

---

## Phase 2: Pet-Friendly Database (Quick Win)

A crowdsourced database of trucker-friendly pet amenities. Quick to build, high emotional value.

### 2.1 Backend Collections
- [x] Task: Create `PetFriendlyLocations` collection with schema from spec
- [x] Task: Create `PetFriendlyReviews` collection with location reference
- [x] Task: Add geolocation indexes for proximity search (latitude, longitude)
- [x] Task: Seed initial data with 50 popular truck stop locations

### 2.2 Pet-Friendly Service Backend
- [x] Task: Create `petFriendlyService.jsw` for location management
- [x] Task: Implement `searchLocations()` with filter support (amenities, type, chain)
- [x] Task: Implement `getNearbyLocations()` with geo radius calculation
- [x] Task: Implement `getLocationById()` with reviews included
- [x] Task: Implement `submitLocation()` with required field validation
- [x] Task: Implement `updateLocation()` with author-only permission
- [x] Task: Implement `verifyLocation()` for admin verification flow
- [x] Task: Implement `getReviewsByLocation()` with pagination
- [x] Task: Implement `submitReview()` with rating validation (1-5)
- [x] Task: Implement `markReviewHelpful()` with duplicate prevention
- [x] Task: Implement `reportReview()` for inappropriate content
- [x] Task: Implement `getTopRatedLocations()` by state aggregation
- [x] Task: Implement `getRecentlyAdded()` for discovery feed

### 2.3 Pet-Friendly UI - Search
- [x] Task: Create `PET_FRIENDLY.html` in `src/public/driver/`
- [x] Task: Build search form with location input (city, state, zip)
- [x] Task: Add radius selector dropdown (10, 25, 50, 100 miles)
- [x] Task: Create amenity filter checkboxes (dog run, water, shade, etc.)
- [x] Task: Add location type filter (truck stop, rest area, park, vet)
- [x] Task: Implement search results list with cards

### 2.4 Pet-Friendly UI - Location Card
- [x] Task: Build location card component with name, address, rating
- [x] Task: Display amenity badges with icons
- [x] Task: Show review snippet from most recent review
- [x] Task: Add "Get Directions" button (Google Maps link)
- [x] Task: Add "View Details" button for full location modal

### 2.5 Pet-Friendly UI - Location Detail
- [x] Task: Create location detail modal/page
- [x] Task: Display full location info with all amenities
- [x] Task: Show photo gallery (user-submitted)
- [x] Task: Build reviews list with pagination
- [x] Task: Add "Write Review" form with rating stars
- [x] Task: Implement photo upload for reviews
- [x] Task: Add "Confirm Amenities" checklist in review form

### 2.6 Pet-Friendly UI - Add Location
- [x] Task: Create "Add New Location" modal
- [x] Task: Build address input with autocomplete (Google Places API optional)
- [x] Task: Add location type selector
- [x] Task: Create amenity multi-select checkboxes
- [x] Task: Add pet policy selector (dogs welcome, leash required, etc.)
- [x] Task: Implement photo upload for location
- [x] Task: Add notes/description textarea
- [x] Task: Show "Pending Verification" message after submission

### 2.7 Admin Verification
- [x] Task: Add pet locations to admin moderation queue
- [x] Task: Build verification checklist UI for admins
- [x] Task: Implement bulk verify action for multiple locations
- [x] Task: Add "Featured Location" toggle for admin curation

### 2.8 Wix Integration
- [x] Task: Create "Pet-Friendly Stops" page in Wix Editor
- [x] Task: Add HTML component and connect to PET_FRIENDLY.html
- [x] Task: Set up postMessage bridge for backend calls
- [x] Task: Add page to driver dashboard navigation
- [x] Task: Award reputation points for location submissions

### 2.9 Testing - Pet-Friendly
- [x] Task: Write unit tests for `petFriendlyService.jsw` search functions
- [x] Task: Test geo proximity calculations with known coordinates
- [x] Task: Test filter combinations (amenities + type + radius)
- [x] Task: Test review submission with edge cases (empty text, rating bounds)
- [ ] Manual test: full flow from search to review submission
- [ ] Manual test: admin verification workflow
- [x] Task: Conductor - User Manual Verification 'Phase 2: Pet-Friendly Database'

---

## Phase 3: Trucker Health Resources (Content Hub)

A curated content hub for driver wellness with community-contributed tips.

### 3.1 Backend Collections
- [x] Task: Create `HealthResources` collection with schema from spec
- [x] Task: Create `HealthTips` collection for community submissions
- [x] Task: Seed initial content: 10 exercise articles, 10 nutrition guides, 5 mental health resources
- [x] Task: Add telemedicine partner data (TruckerDoc, MedExpress, etc.)

### 3.2 Health Service Backend
- [x] Task: Create `healthService.jsw` for resource management
- [x] Task: Implement `getResourcesByCategory()` with pagination
- [x] Task: Implement `getResourceBySlug()` for single article view
- [x] Task: Implement `getFeaturedResources()` for homepage highlights
- [x] Task: Implement `searchResources()` with full-text search
- [x] Task: Implement `markResourceHelpful()` for user ratings
- [x] Task: Implement `submitTip()` for community contributions
- [x] Task: Implement `getApprovedTips()` with category filter
- [x] Task: Implement `getTipsByAuthor()` for user's submissions
- [x] Task: Implement `moderateTip()` for admin approval workflow

### 3.3 Health UI - Hub Page
- [x] Task: Create `HEALTH_WELLNESS.html` in `src/public/driver/`
- [x] Task: Build category tabs (Exercise, Nutrition, Mental Health, Sleep, Telemedicine)
- [x] Task: Create featured content hero section
- [x] Task: Build resource card grid with thumbnails
- [x] Task: Add community tips section with "Add Tip" button
- [x] Task: Create telemedicine partners section with referral links

### 3.4 Health UI - Article View
- [x] Task: Build article detail view with markdown rendering
- [x] Task: Add video embed support for video content
- [x] Task: Implement "Mark Helpful" button with count display
- [x] Task: Add social share buttons (optional)
- [x] Task: Show related resources sidebar
- [x] Task: Add "Back to Hub" navigation

### 3.5 Health UI - Community Tips
- [x] Task: Build tips list component with voting
- [x] Task: Create "Submit Tip" modal with category selector
- [x] Task: Add character counter for tip text (500 max)
- [x] Task: Show submission status badge (pending/approved)
- [x] Task: Display author reputation badges on tips

### 3.6 Content Management
- [x] Task: Create `ADMIN_HEALTH_CONTENT.html` for content management
- [x] Task: Build resource CRUD interface for admins
- [x] Task: Add rich text editor for article content
- [x] Task: Implement tip moderation queue
- [x] Task: Add "Feature" toggle for homepage highlights
- [x] Task: Create content scheduling (publish date)

### 3.7 Wix Integration
- [x] Task: Create "Health & Wellness" page in Wix Editor
- [x] Task: Add HTML component and connect to HEALTH_WELLNESS.html
- [x] Task: Set up postMessage bridge for backend calls
- [x] Task: Add page to driver dashboard navigation
- [x] Task: Award reputation points for approved tips
- [x] Task: Track resource views in analytics

### 3.8 Testing - Health Resources
- [x] Task: Write unit tests for `healthService.jsw` functions
- [x] Task: Test category filtering and pagination
- [x] Task: Test tip submission and moderation flow
- [x] Task: Test helpful count increment with duplicate prevention
- [x] Task: Manual test: browse all categories and view articles
- [x] Task: Manual test: submit and moderate community tip
- [x] Task: Conductor - User Manual Verification 'Phase 3: Health Resources'

---

## Phase 4: Mentor Matching (Complex Feature)

Connect new drivers with experienced mentors through an opt-in matching program.

### 4.1 Backend Collections
- [x] Task: Create `MentorProfiles` collection with schema from spec
- [x] Task: Create `MentorMatches` collection with status tracking
- [x] Task: Add indexes for mentor search (specialties, availability, status)
- [x] Task: Define milestone templates for common mentorship goals

### 4.2 Mentor Profile Backend
- [x] Task: Create `mentorService.jsw` for mentor management
- [x] Task: Implement `getMentorProfile()` with stats aggregation
- [x] Task: Implement `createMentorProfile()` with experience validation (5+ years)
- [x] Task: Implement `updateMentorProfile()` for availability/bio changes
- [x] Task: Implement `pauseMentorProfile()` for temporary unavailability
- [x] Task: Implement mentor eligibility check (`canBeMentor()`)

### 4.3 Mentor Discovery Backend
- [x] Task: Implement `searchMentors()` with filters (specialty, availability, language)
- [x] Task: Implement `getMentorRecommendations()` with matching logic
- [x] Task: Matching factors: specialty match, timezone proximity, availability overlap
- [x] Task: Implement `getMentorStats()` for public profile stats

### 4.4 Matching Backend
- [x] Task: Implement `requestMentor()` with goals and intro message
- [x] Task: Implement `respondToRequest()` for mentor accept/decline
- [x] Task: Create notification triggers for match status changes
- [x] Task: Implement `getMyMatches()` for both mentor and mentee views
- [x] Task: Implement `getMenteeApplications()` for mentor's pending requests
- [x] Task: Create chat thread on match acceptance (link to Messages)

### 4.5 Progress Tracking Backend
- [x] Task: Implement `logMilestone()` for recording achievements
- [x] Task: Create milestone completion notifications
- [x] Task: Implement `completeMatch()` with feedback and rating
- [x] Task: Update mentor stats on completion (total helped, avg rating)
- [x] Task: Award reputation points on successful completion
- [x] Task: Implement match expiry after 90 days inactive

### 4.6 Mentor UI - Opt-In Flow
- [x] Task: Create `MENTOR_PROGRAM.html` in `src/public/driver/`
- [x] Task: Build program introduction/explainer section
- [x] Task: Create "Become a Mentor" flow for experienced drivers
- [x] Task: Build specialty selection multi-select
- [x] Task: Add availability preference selector
- [x] Task: Create bio/motivation textarea
- [x] Task: Add max mentees capacity selector (1-5)
- [x] Task: Show requirements checklist (5+ years, verified CDL)

### 4.7 Mentor UI - Discovery
- [x] Task: Build mentor search/browse interface
- [x] Task: Create filter panel (specialty, availability, experience)
- [x] Task: Build mentor card component with photo, bio, stats
- [x] Task: Display specialty badges and rating stars
- [x] Task: Add "Request Mentorship" button

### 4.8 Mentor UI - Request Flow
- [x] Task: Create mentor request modal
- [x] Task: Add goals selection (checklist of common goals)
- [x] Task: Add intro message textarea
- [x] Task: Show expected response time
- [x] Task: Display confirmation after request sent

### 4.9 Mentor UI - Dashboard
- [x] Task: Create mentor dashboard section in driver dashboard
- [x] Task: Build active mentorships list with status
- [x] Task: Show pending requests for mentors (accept/decline)
- [x] Task: Display milestone progress tracker
- [x] Task: Add "Message" button linking to chat
- [x] Task: Create "Complete Mentorship" flow with feedback form

### 4.10 Mentor UI - Profile View
- [x] Task: Create public mentor profile page
- [x] Task: Display full bio, specialties, experience
- [x] Task: Show mentorship history (count, rating, testimonials)
- [x] Task: Add "Request Mentorship" CTA
- [x] Task: Display earned badges

### 4.11 Chat Integration
- [x] Task: Extend messaging system for mentor-mentee threads
- [x] Task: Add mentor match context to message thread
- [x] Task: Create milestone notification messages
- [x] Task: Add "Report Issue" option for mentor problems
- [x] Task: Implement mentor-specific message templates

### 4.12 Notifications
- [x] Task: Create email template: mentor request received
- [x] Task: Create email template: mentor request accepted
- [x] Task: Create email template: mentor request declined
- [x] Task: Create email template: milestone achieved
- [x] Task: Create email template: mentorship completed
- [x] Task: Add in-app notifications for all mentor events

### 4.13 Admin Tools
- [x] Task: Add mentor program stats to admin dashboard
- [x] Task: Create mentor approval queue (optional manual review)
- [x] Task: Build mentorship dispute resolution interface
- [x] Task: Add mentor ban/suspension capability
- [x] Task: Create mentor program health metrics

### 4.14 Wix Integration
- [x] Task: Create "Mentor Program" page in Wix Editor
- [x] Task: Add HTML component and connect to MENTOR_PROGRAM.html
- [x] Task: Set up postMessage bridge for backend calls
- [x] Task: Add mentor badge display in driver profiles
- [x] Task: Update driver dashboard with mentorship section
- [ ] Task: Configure member permissions for mentor features

### 4.15 Testing - Mentor Matching
- [x] Task: Write unit tests for `mentorService.jsw` CRUD operations
- [x] Task: Test mentor eligibility validation (experience, CDL)
- [x] Task: Test match request flow with various statuses
- [x] Task: Test recommendation algorithm with test data
- [x] Task: Test milestone tracking and completion
- [x] Task: Manual test: complete mentor opt-in flow
- [x] Task: Manual test: mentee request and mentor response
- [x] Task: Manual test: full mentorship lifecycle to completion
- [x] Task: Manual test: chat integration between mentor/mentee
- [x] Task: Conductor - User Manual Verification 'Phase 4: Mentor Matching'

---

## Post-Launch Tasks

### Analytics & Monitoring
- [ ] Task: Add community engagement metrics to admin dashboard
- [ ] Task: Track forum post volume and response times
- [ ] Task: Monitor mentor match success rate
- [ ] Task: Track pet-friendly database growth
- [ ] Task: Measure health content engagement

### Performance Optimization
- [ ] Task: Implement forum post caching for popular threads
- [ ] Task: Add lazy loading for long comment threads
- [ ] Task: Optimize geo queries for pet-friendly search
- [ ] Task: Cache mentor recommendations

### Future Enhancements
- [ ] Task: Mobile app push notifications for community
- [ ] Task: Gamification badges for community milestones
- [ ] Task: AI-powered mentor matching improvements
- [ ] Task: Interactive map for pet-friendly locations
- [ ] Task: Video call integration for mentorship
