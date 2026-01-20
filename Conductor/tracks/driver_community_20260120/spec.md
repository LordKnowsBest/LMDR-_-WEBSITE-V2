# Track Spec: Driver Community - Forums, Mentorship & Wellness

## 1. Overview

Build a comprehensive community platform that addresses the unique challenges of trucking life - isolation, lack of peer support, health challenges, and the difficulty of traveling with pets. This feature set transforms LMDR from a job-matching platform into a driver lifestyle hub that increases engagement and retention.

### 1.1 Business Goals

| Goal | Metric | Target |
|------|--------|--------|
| Reduce churn | Monthly active retention | +25% |
| Increase engagement | Daily active users | +40% |
| Build moat | Unique community content | 10K posts/month |
| Driver satisfaction | NPS score | +15 points |

### 1.2 Features Summary

1. **Driver Forums** - Discussion boards for peer-to-peer knowledge sharing
2. **Mentor Matching** - Connect rookies with experienced drivers
3. **Pet-Friendly Database** - Crowdsourced trucker pet amenity guide
4. **Trucker Health Resources** - Wellness content hub for life on the road

## 2. Architecture

### 2.1 System Architecture

```
+------------------------------------------------------------------+
|                        DRIVER COMMUNITY                           |
+------------------------------------------------------------------+
|                                                                    |
|  +------------------+  +------------------+  +------------------+  |
|  |  Driver Forums   |  | Mentor Matching  |  |  Pet-Friendly    |  |
|  |                  |  |                  |  |    Database      |  |
|  |  - Categories    |  |  - Opt-in Flow   |  |                  |  |
|  |  - Threads       |  |  - Matching Algo |  |  - Locations     |  |
|  |  - Posts         |  |  - Chat Bridge   |  |  - Reviews       |  |
|  |  - Moderation    |  |  - Milestones    |  |  - Amenities     |  |
|  +--------+---------+  +--------+---------+  +--------+---------+  |
|           |                     |                     |            |
|  +--------v---------+  +--------v---------+  +--------v---------+  |
|  | Health Resources |  |   Shared Auth    |  |   Notification   |  |
|  |                  |  |   & Reputation   |  |     Service      |  |
|  |  - Content Hub   |  |                  |  |                  |  |
|  |  - Tips/Guides   |  |  - Points System |  |  - Email/Push    |  |
|  |  - Telemedicine  |  |  - Badges        |  |  - In-App        |  |
|  +------------------+  +------------------+  +------------------+  |
|                                                                    |
+------------------------------------------------------------------+
                              |
                              v
+------------------------------------------------------------------+
|                    EXISTING LMDR SERVICES                         |
+------------------------------------------------------------------+
|  DriverProfiles  |  Messaging  |  memberService  |  emailService  |
+------------------------------------------------------------------+
```

### 2.2 Component Flow

```
                    FORUMS FLOW
                    ===========

+--------+    +----------+    +---------+    +----------+
| Driver | -> | Browse   | -> | View    | -> | Reply/   |
| Login  |    | Category |    | Thread  |    | New Post |
+--------+    +----------+    +---------+    +----------+
                                   |              |
                                   v              v
                            +-------------+  +------------+
                            | Reputation  |  | Moderation |
                            | Points +5   |  | Queue      |
                            +-------------+  +------------+


                    MENTOR MATCHING FLOW
                    ====================

+--------+    +-----------+    +-----------+    +----------+
| Rookie | -> | Opt-in as | -> | View      | -> | Request  |
| Driver |    | Mentee    |    | Mentors   |    | Match    |
+--------+    +-----------+    +-----------+    +----------+
                                                     |
+----------+    +-----------+    +-----------+       |
| Mentor   | <- | Accept/   | <- | Review    | <-----+
| Notified |    | Decline   |    | Request   |
+----------+    +-----------+    +-----------+
                     |
                     v
              +-------------+
              | Chat Bridge |
              | Unlocked    |
              +-------------+
                     |
                     v
              +-------------+
              | Milestone   |
              | Tracking    |
              +-------------+
```

### 2.3 Pet-Friendly Database Flow

```
+--------+    +----------+    +-----------+    +----------+
| Driver | -> | Search   | -> | View      | -> | Submit   |
|        |    | Location |    | Details   |    | Review   |
+--------+    +----------+    +-----------+    +----------+
                  |                                  |
                  v                                  v
           +-----------+                     +------------+
           | Filter by |                     | Add New    |
           | Amenities |                     | Location   |
           | - Dog Run |                     +------------+
           | - Water   |                          |
           | - Shade   |                          v
           +-----------+                     +------------+
                                             | Moderation |
                                             | Review     |
                                             +------------+
```

## 3. Data Model

### 3.1 Forum Collections

#### ForumCategories Collection
```
_id: String (auto)
name: String                    // "Routes & Lanes", "Equipment Talk"
slug: String                    // "routes-lanes"
description: String             // Category description
icon: String                    // Icon class or emoji
order: Number                   // Display order
thread_count: Number            // Cached count
post_count: Number              // Cached count
last_activity: Date             // Last post timestamp
moderators: Array<String>       // User IDs with mod powers
is_active: Boolean              // Soft delete flag
```

#### ForumThreads Collection
```
_id: String (auto)
category_id: Reference -> ForumCategories
title: String                   // Thread title (max 200 chars)
slug: String                    // URL-friendly slug
author_id: Reference -> DriverProfiles
author_name: String             // Denormalized for display
created_at: Date
updated_at: Date
last_reply_at: Date
reply_count: Number             // Cached count
view_count: Number              // Page views
is_pinned: Boolean              // Sticky thread
is_locked: Boolean              // No new replies
is_hidden: Boolean              // Moderation flag
tags: Array<String>             // Searchable tags
```

#### ForumPosts Collection
```
_id: String (auto)
thread_id: Reference -> ForumThreads
parent_post_id: String          // For nested replies (null = top-level)
author_id: Reference -> DriverProfiles
author_name: String             // Denormalized
content: String                 // Post body (markdown)
content_html: String            // Pre-rendered HTML
created_at: Date
updated_at: Date
edited_at: Date                 // Last edit timestamp
is_hidden: Boolean              // Moderation flag
likes_count: Number             // Upvotes
is_best_answer: Boolean         // Marked by thread author
```

#### ForumReputationLog Collection
```
_id: String (auto)
user_id: Reference -> DriverProfiles
action_type: String             // "post_created", "like_received", "best_answer"
points: Number                  // Points earned (+5, +10, etc.)
source_id: String               // Thread/post that triggered
created_at: Date
```

### 3.2 Mentor Collections

#### MentorProfiles Collection
```
_id: String (auto)
driver_id: Reference -> DriverProfiles
status: String                  // "available", "paused", "inactive"
years_experience: Number        // Verified from DriverProfiles
specialties: Array<String>      // "OTR", "Flatbed", "Hazmat", "Team Driving"
bio: String                     // Why they want to mentor
availability: String            // "weekends", "evenings", "flexible"
max_mentees: Number             // How many they can handle (1-5)
current_mentees: Number         // Active count
timezone: String                // For scheduling
languages: Array<String>        // Communication languages
total_mentees_helped: Number    // Lifetime count
avg_rating: Number              // From completed mentorships
created_at: Date
updated_at: Date
```

#### MentorMatches Collection
```
_id: String (auto)
mentor_id: Reference -> MentorProfiles
mentee_id: Reference -> DriverProfiles
status: String                  // "requested", "active", "completed", "declined", "cancelled"
requested_at: Date
accepted_at: Date
completed_at: Date
goals: Array<String>            // What mentee wants to learn
milestones: Array<{
  name: String,                 // "First week survival"
  target_date: Date,
  completed_at: Date,
  notes: String
}>
chat_thread_id: String          // Link to Messages collection thread
feedback_mentor: String         // End-of-program feedback
feedback_mentee: String
rating_of_mentor: Number        // 1-5 stars
rating_of_mentee: Number
```

### 3.3 Pet-Friendly Collections

#### PetFriendlyLocations Collection
```
_id: String (auto)
name: String                    // "Love's Travel Stop #437"
address: String                 // Full street address
city: String
state: String
zip: String
latitude: Number                // For map display
longitude: Number
location_type: String           // "truck_stop", "rest_area", "park", "vet", "pet_store"
chain: String                   // "Love's", "Pilot", "TA", "Independent"
amenities: Array<String>        // ["dog_run", "pet_wash", "waste_bags", "water_station", "shade", "grass_area"]
pet_policy: String              // "dogs_welcome", "dogs_on_leash", "no_aggressive_breeds"
notes: String                   // Additional details
photos: Array<String>           // User-submitted photos
submitted_by: Reference -> DriverProfiles
verified: Boolean               // Admin verified
avg_rating: Number              // Calculated from reviews
review_count: Number
created_at: Date
updated_at: Date
```

#### PetFriendlyReviews Collection
```
_id: String (auto)
location_id: Reference -> PetFriendlyLocations
author_id: Reference -> DriverProfiles
rating: Number                  // 1-5 stars
pet_type: String                // "dog", "cat", "other"
visit_date: Date
review_text: String
amenities_confirmed: Array<String>  // Which amenities they verified
photos: Array<String>
helpful_count: Number           // Upvotes
created_at: Date
```

### 3.4 Health Resources Collections

#### HealthResources Collection
```
_id: String (auto)
title: String                   // "10-Minute Cab Workout Routine"
slug: String                    // URL-friendly
category: String                // "exercise", "nutrition", "mental_health", "sleep", "telemedicine"
content_type: String            // "article", "video", "infographic", "link"
summary: String                 // Short description
content: String                 // Full markdown content
external_url: String            // For telemedicine links
video_url: String               // Embedded video URL
thumbnail: String               // Preview image
author: String                  // Content creator
tags: Array<String>
view_count: Number
helpful_count: Number           // User ratings
is_featured: Boolean
is_community: Boolean           // User-submitted tip
created_at: Date
updated_at: Date
```

#### HealthTips Collection (Community-submitted)
```
_id: String (auto)
author_id: Reference -> DriverProfiles
category: String                // Same as HealthResources
title: String
tip_text: String                // The actual tip (max 500 chars)
helpful_count: Number
status: String                  // "pending", "approved", "rejected"
moderator_notes: String
created_at: Date
approved_at: Date
```

### 3.5 Shared Collections

#### UserReputation Collection (Extend DriverProfiles or new)
```
_id: String (auto)
driver_id: Reference -> DriverProfiles
total_points: Number            // Cumulative reputation
level: Number                   // 1-10 based on points
badges: Array<{
  badge_id: String,             // "verified_driver", "mentor_gold", "top_contributor"
  earned_at: Date
}>
forum_posts: Number             // Total posts
helpful_answers: Number         // Best answers given
mentees_helped: Number          // Completed mentorships
locations_added: Number         // Pet-friendly spots
tips_approved: Number           // Health tips approved
last_activity: Date
```

#### ReputationBadges Collection
```
_id: String (auto)
badge_id: String                // "verified_driver"
name: String                    // "Verified CDL Holder"
description: String             // How to earn it
icon: String                    // Badge image/icon
category: String                // "trust", "forum", "mentor", "contributor"
requirement_type: String        // "manual", "automatic"
requirement_threshold: Number   // Points/count needed for automatic
is_active: Boolean
```

## 4. API Design

### 4.1 Forum Service (forumService.jsw)

```javascript
// Categories
getCategories()                           // List all active categories
getCategoryBySlug(slug)                   // Single category with stats

// Threads
getThreadsByCategory(categoryId, options) // Paginated threads
getThreadBySlug(categorySlug, threadSlug) // Single thread with posts
createThread(categoryId, title, content)  // Start new discussion
updateThread(threadId, updates)           // Edit thread (author only)
togglePinThread(threadId)                 // Admin: pin/unpin
toggleLockThread(threadId)                // Admin: lock/unlock

// Posts
getPostsByThread(threadId, options)       // Paginated posts
createPost(threadId, content, parentId)   // Reply to thread
updatePost(postId, content)               // Edit post (author only)
deletePost(postId)                        // Soft delete (author/mod)
likePost(postId)                          // Upvote
markBestAnswer(postId)                    // Thread author marks solution

// Moderation
getModQueue(categoryId)                   // Hidden posts needing review
moderatePost(postId, action, reason)      // hide/unhide/warn
reportPost(postId, reason)                // User reports abuse
```

### 4.2 Mentor Service (mentorService.jsw)

```javascript
// Mentor Profiles
getMentorProfile(driverId)                // Get mentor profile
createMentorProfile(data)                 // Opt-in as mentor
updateMentorProfile(updates)              // Update availability/bio
pauseMentorProfile()                      // Temporarily unavailable

// Discovery
searchMentors(filters, options)           // Find mentors by specialty
getMentorRecommendations(menteeId)        // AI-matched suggestions

// Matching
requestMentor(mentorId, goals)            // Mentee requests match
respondToRequest(matchId, accept, message)// Mentor accepts/declines
getMyMatches()                            // Both roles see their matches
getMenteeApplications()                   // Mentor sees requests

// Progress
logMilestone(matchId, milestone)          // Record achievement
completeMatch(matchId, feedback, rating)  // End mentorship
getMentorStats(mentorId)                  // Public mentor statistics
```

### 4.3 Pet-Friendly Service (petFriendlyService.jsw)

```javascript
// Locations
searchLocations(filters, options)         // Search with geo/amenities
getLocationById(locationId)               // Single location details
submitLocation(data)                      // User adds new spot
updateLocation(locationId, updates)       // User edits their submission
verifyLocation(locationId)                // Admin verifies

// Reviews
getReviewsByLocation(locationId, options) // Paginated reviews
submitReview(locationId, data)            // Add review
markReviewHelpful(reviewId)               // Upvote
reportReview(reviewId, reason)            // Flag inappropriate

// Discovery
getNearbyLocations(lat, lng, radius)      // Geo search
getTopRatedLocations(state)               // Best rated by state
getRecentlyAdded()                        // Latest submissions
```

### 4.4 Health Service (healthService.jsw)

```javascript
// Resources
getResourcesByCategory(category, options) // Browse content
getResourceBySlug(slug)                   // Single article
getFeaturedResources()                    // Homepage highlights
searchResources(query)                    // Full-text search
markResourceHelpful(resourceId)           // User finds helpful

// Community Tips
submitTip(category, title, text)          // User submits tip
getApprovedTips(category, options)        // Browse approved tips
getTipsByAuthor(driverId)                 // User's submissions
moderateTip(tipId, action)                // Admin approve/reject
```

### 4.5 Reputation Service (reputationService.jsw)

```javascript
// Points
getReputation(driverId)                   // Full reputation profile
awardPoints(driverId, action, sourceId)   // Internal: add points
getLeaderboard(timeframe)                 // Top contributors

// Badges
getBadges(driverId)                       // User's earned badges
checkBadgeEligibility(driverId)           // Auto-award check
awardBadge(driverId, badgeId)             // Manual award
getAllBadges()                            // Badge catalog
```

## 5. UI Mockups

### 5.1 Forum Category List

```
+------------------------------------------------------------------+
|  DRIVER COMMUNITY FORUMS                              [New Thread]|
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | [icon] Routes & Lanes                         142 threads    | |
|  |        Share tips on the best routes, lanes to avoid,        | |
|  |        and regional driving advice                           | |
|  |        Last post: 5 min ago by TruckerMike                   | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | [icon] Equipment Talk                         98 threads     | |
|  |        Discuss trucks, trailers, maintenance tips,           | |
|  |        and gear recommendations                              | |
|  |        Last post: 12 min ago by DieselDan                    | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | [icon] Carrier Reviews                        256 threads    | |
|  |        Real driver experiences with carriers -               | |
|  |        the good, bad, and ugly                               | |
|  |        Last post: 2 hours ago by RoadWarrior                 | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | [icon] Life on the Road                       184 threads    | |
|  |        Staying healthy, family time, pet travel,             | |
|  |        and making the most of downtime                       | |
|  |        Last post: 1 hour ago by LoneWolf                     | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### 5.2 Thread View

```
+------------------------------------------------------------------+
|  < Back to Routes & Lanes                                         |
+------------------------------------------------------------------+
|  Best fuel stops on I-40 westbound?                               |
|  Posted by TruckerMike - 2 hours ago - 12 replies                 |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | [Avatar] TruckerMike           [Verified] [Top Contributor]  | |
|  | 5 years exp | 1,240 pts                                      | |
|  +--------------------------------------------------------------+ |
|  | Hey everyone, heading west on I-40 from Memphis to           | |
|  | Flagstaff next week. Any recommendations for fuel stops      | |
|  | with good prices and decent food? DEF availability is        | |
|  | important too.                                               | |
|  |                                                               | |
|  | [Like: 5]  [Reply]  [Report]                                 | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | [Avatar] DieselDan              [Verified]                   | |
|  | 8 years exp | 890 pts                                        | |
|  +--------------------------------------------------------------+ |
|  | Check out Love's in Amarillo - consistently good prices      | |
|  | and they have a Subway inside. The TA in Albuquerque is      | |
|  | solid too but gets crowded after 6pm.                        | |
|  |                                                               | |
|  | [Like: 8]  [Reply]  [Best Answer]                            | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  [Load more replies...]                                           |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Your Reply:                                                   | |
|  | +----------------------------------------------------------+ | |
|  | |                                                          | | |
|  | | Type your reply here...                                  | | |
|  | |                                                          | | |
|  | +----------------------------------------------------------+ | |
|  | [Post Reply]                                                  | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### 5.3 Mentor Discovery

```
+------------------------------------------------------------------+
|  FIND A MENTOR                                                    |
+------------------------------------------------------------------+
|  Connect with experienced drivers who've been in your shoes       |
|                                                                    |
|  Filters:                                                         |
|  [Specialty: All v]  [Availability: Any v]  [Experience: 5+ yr v] |
+------------------------------------------------------------------+
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | [Photo]  BigRigBob                                           | |
|  |          15 years experience | OTR Dry Van Specialist        | |
|  |          "I remember being new and scared. Let me help       | |
|  |           you avoid the mistakes I made."                    | |
|  |                                                               | |
|  |          Specialties: [OTR] [Dry Van] [Team Driving]         | |
|  |          Available: Weekends                                  | |
|  |          Mentees helped: 23 | Rating: 4.9/5                  | |
|  |                                                               | |
|  |          [Request Mentorship]                                 | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | [Photo]  FlatbedFiona                                        | |
|  |          8 years experience | Flatbed & Oversized Expert     | |
|  |          "Flatbed isn't for everyone, but if you want        | |
|  |           to learn, I'll teach you right."                   | |
|  |                                                               | |
|  |          Specialties: [Flatbed] [Oversized] [Tarping]        | |
|  |          Available: Evenings                                  | |
|  |          Mentees helped: 12 | Rating: 5.0/5                  | |
|  |                                                               | |
|  |          [Request Mentorship]                                 | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### 5.4 Pet-Friendly Search

```
+------------------------------------------------------------------+
|  PET-FRIENDLY STOPS                                    [Add New]  |
+------------------------------------------------------------------+
|                                                                    |
|  Search: [Oklahoma City, OK_________________] [radius: 50 mi v]   |
|                                                                    |
|  Amenities: [x] Dog Run  [x] Water Station  [ ] Pet Wash          |
|             [ ] Shade    [ ] Grass Area     [ ] Vet Nearby        |
|                                                                    |
|  [Search]                                                         |
+------------------------------------------------------------------+
|                                                                    |
|  Found 12 pet-friendly locations                                  |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Love's Travel Stop #247                    4.5/5 (28 reviews)| |
|  | 1234 Interstate Dr, Oklahoma City, OK                        | |
|  |                                                               | |
|  | [Dog Run] [Water Station] [Grass Area] [Waste Bags]          | |
|  |                                                               | |
|  | "Great fenced dog run behind the building. Clean and         | |
|  |  well-maintained. My pup loves it!" - PuppyPapa, 3 days ago  | |
|  |                                                               | |
|  | [View Details]  [Get Directions]                              | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  +--------------------------------------------------------------+ |
|  | Pilot Flying J #382                        4.2/5 (15 reviews)| |
|  | 5678 Highway 40, Midwest City, OK                            | |
|  |                                                               | |
|  | [Water Station] [Grass Area] [Shade]                         | |
|  |                                                               | |
|  | "Small grass patch but decent. Gets muddy after rain."       | |
|  | - TruckerTom, 1 week ago                                     | |
|  |                                                               | |
|  | [View Details]  [Get Directions]                              | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

### 5.5 Health Resources Hub

```
+------------------------------------------------------------------+
|  TRUCKER HEALTH & WELLNESS                                        |
+------------------------------------------------------------------+
|                                                                    |
|  [Exercise]  [Nutrition]  [Mental Health]  [Sleep]  [Telemedicine]|
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  FEATURED                                                         |
|  +--------------------------------------------------------------+ |
|  | [Video Thumb]  10-Minute Cab Workout - No Equipment Needed   | |
|  |                Stay fit on the road with these simple        | |
|  |                exercises you can do in your cab              | |
|  |                [Watch Now] - 12,453 views                    | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  EXERCISE GUIDES                                                  |
|  +---------------------------+  +---------------------------+     |
|  | Resistance Band Workouts  |  | Stretches for Long Drives |     |
|  | for Truck Drivers         |  | Prevent back pain with    |     |
|  | [Read More]               |  | these 5-minute routines   |     |
|  +---------------------------+  +---------------------------+     |
|                                                                    |
|  COMMUNITY TIPS                                        [Add Tip]  |
|  +--------------------------------------------------------------+ |
|  | "I keep a gallon jug filled with water as a weight for       | |
|  |  arm curls during breaks. Works great!" - StrongDriver       | |
|  |  [Helpful: 45]                                               | |
|  +--------------------------------------------------------------+ |
|  | "Park farther from the entrance to get extra walking in.     | |
|  |  Every step counts!" - HealthyHauler                         | |
|  |  [Helpful: 32]                                               | |
|  +--------------------------------------------------------------+ |
|                                                                    |
|  TELEMEDICINE PARTNERS                                            |
|  +--------------------------------------------------------------+ |
|  | [Logo] TruckerDoc - 24/7 Telehealth for CDL Drivers          | |
|  |        DOT physicals, prescriptions, mental health           | |
|  |        [Learn More] - LMDR members get 15% off               | |
|  +--------------------------------------------------------------+ |
|                                                                    |
+------------------------------------------------------------------+
```

## 6. Moderation System

### 6.1 Moderation Workflow

```
                    CONTENT MODERATION FLOW
                    =======================

+--------+    +------------+    +------------+
| User   | -> | Submit     | -> | Auto-Check |
| Action |    | Content    |    | (Spam/Lang)|
+--------+    +------------+    +------------+
                                     |
                    +----------------+----------------+
                    |                                 |
                    v                                 v
             +------------+                   +------------+
             | Pass       |                   | Flag for   |
             | Auto-check |                   | Review     |
             +------------+                   +------------+
                    |                                 |
                    v                                 v
             +------------+                   +------------+
             | Published  |                   | Mod Queue  |
             | Visible    |                   | Hidden     |
             +------------+                   +------------+
                    |                                 |
                    v                                 v
             +------------+                   +------------+
             | User       |                   | Moderator  |
             | Reports    |                   | Review     |
             +------------+                   +------------+
                    |                                 |
                    v                                 v
             +------------+            +--------------+--------------+
             | Mod Queue  |            |              |              |
             +------------+            v              v              v
                               +----------+   +----------+   +----------+
                               | Approve  |   | Remove   |   | Warn     |
                               | Publish  |   | + Notify |   | User     |
                               +----------+   +----------+   +----------+
```

### 6.2 Auto-Moderation Rules

| Check | Action | Threshold |
|-------|--------|-----------|
| Profanity filter | Flag for review | Any match |
| Spam patterns | Auto-hide | 3+ links, all caps |
| New user (<7 days) | Require approval | First 3 posts |
| Reported content | Flag for review | 2+ reports |
| Duplicate content | Auto-hide | 90% similarity |

### 6.3 Reputation Penalties

| Violation | Points Deducted | Additional Action |
|-----------|-----------------|-------------------|
| Post removed (spam) | -50 | None |
| Post removed (abuse) | -100 | Warning |
| Second offense | -200 | 7-day posting ban |
| Third offense | -500 | 30-day ban |
| Severe abuse | -1000 | Permanent ban |

### 6.4 Moderator Roles

| Role | Permissions |
|------|-------------|
| Category Mod | Review queue for assigned categories only |
| Forum Mod | All categories, can pin/lock threads |
| Community Lead | All above + warn/ban users, edit any post |
| Admin | All above + assign moderators, system settings |

## 7. Reputation System

### 7.1 Point Values

| Action | Points |
|--------|--------|
| Create post | +5 |
| Receive like | +2 |
| Post marked best answer | +25 |
| Complete mentorship (mentor) | +100 |
| Complete mentorship (mentee) | +50 |
| Add verified location | +30 |
| Location review | +10 |
| Health tip approved | +20 |

### 7.2 Levels

| Level | Points Required | Perks |
|-------|-----------------|-------|
| 1 | 0 | Basic posting |
| 2 | 100 | Can upload images |
| 3 | 250 | Can create polls |
| 4 | 500 | Early access to features |
| 5 | 1000 | Custom badge color |
| 6 | 2500 | Moderator nomination eligible |
| 7 | 5000 | Verified Top Contributor badge |
| 8 | 10000 | Community Legend badge |

### 7.3 Badges

| Badge | Requirement |
|-------|-------------|
| Verified Driver | CDL verified in system |
| Helpful Neighbor | 10 posts marked best answer |
| Mentor Bronze/Silver/Gold | 5/15/30 mentees helped |
| Pet Advocate | 10 pet-friendly locations added |
| Wellness Warrior | 5 health tips approved |
| Road Scholar | 1000+ forum posts |

## 8. Integration Points

### 8.1 Existing System Hooks

| Feature | Integrates With | Purpose |
|---------|-----------------|---------|
| Forum auth | DriverProfiles | Verified driver badge |
| Mentor chat | Messages collection | Unified messaging |
| Notifications | MemberNotifications | Activity alerts |
| Pet locations | (none) | Standalone |
| Health telemedicine | External partners | Referral links |

### 8.2 Future Integrations

- **AI Matching**: Use forum interests to improve carrier matching
- **Recruiter Insights**: Show community engagement to recruiters
- **Mobile App**: Push notifications for mentor matches
- **Maps API**: Display pet-friendly locations on map

## 9. Security Considerations

### 9.1 Data Privacy

- Forum posts are public by default (logged-in users only)
- Mentor communications are private
- Pet location reviews can be anonymous
- Health resource views are not tracked per-user

### 9.2 Content Safety

- All user content passes through profanity filter
- No PII in forum posts (auto-detect phone/email)
- Images scanned for inappropriate content (future)
- Rate limiting on all submission endpoints

### 9.3 Access Control

```javascript
// Permission checks (example)
canPost(user)         -> user.reputation >= 0 && !user.is_banned
canModerate(user, cat) -> user.moderator_for.includes(cat)
canMentor(user)       -> user.years_experience >= 5 && user.cdl_verified
canRequestMentor(user) -> user.years_experience < 1
```

## 10. Success Metrics

| Metric | Target (6 months) |
|--------|-------------------|
| Forum posts/week | 500+ |
| Active forum users | 2000+ |
| Active mentorships | 100+ |
| Pet locations added | 1000+ |
| Health content views | 10K/month |
| DAU increase | +40% |
| 30-day retention | +25% |
