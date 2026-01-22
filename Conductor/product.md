# Product Guide: LMDR AI Matching Platform

## 1. Initial Concept
An AI-driven matching platform for CDL drivers and carriers, leveraging a 3-stage AI enrichment pipeline (FMCSA data, Social scanning) to provide real-time safety ratings and deep carrier insights.

## 2. Target Users
*   **CDL Truck Drivers:** Seeking transparent, high-quality job matches.
*   **Trucking Carriers:** Sourcing qualified drivers.
*   **Recruitment Agencies:** Managing placements.

## 3. Core Features & Requirements

### 3.1. Profile Persistence & Management (Critical Upgrade)
*   **Current State:** Session-based only.
*   **Required State:** Fully persistent member records.
    *   **Saved Preferences:** Experience (Years driving, equipment experience), Pay Requirements, Equipment Preferences, Carrier Blacklists.
    *   **Multiple Profiles:** Support for distinct search profiles (e.g., "OTR Long-Haul," "Regional Weekend," "Local Delivery").
    *   **Job Management:** Save/Favorite jobs, Archive/Remove jobs, track "Applied Applications" with status updates.

### 3.2. Advanced Search & Matching
*   **Two-Way Search:** Advanced filtering capabilities for both drivers and carriers.
*   **Filters:** Safety Rating (Satisfactory, etc.), Posting Date (Newest), Pay Rates.
*   **Red Flag Warnings:** Visual alerts for critical issues:
    *   🔴 **Safety Alert:** Unsatisfactory FMCSA rating.
    *   🟡 **Pay Concern:** Potential pay discrepancies.
    *   🟠 **Equipment Mismatch.**
*   **Quick Apply:** Auto-fill applications from driver profile (CDL Class, endorsements, Home Zip).

### 3.3. Carrier Insights & Native Reviews
*   **Expanded Carrier Details:** Visualize underused data (Inspections, Out-of-Service rates, Behavior analysis).
*   **Native Reviews:** Supplement existing social scraping with direct user reviews.
    *   **Star Rating:** 1-5 overall.
    *   **Categories:** Pay accuracy, Equipment quality, etc.
    *   **Verification:** Optional verification that the driver worked for the carrier.
    *   **Moderation:** Queue for free-text reviews.

### 3.4. Driver Dashboard & Tools
*   **Dashboard:** View match history (last 30 days) and application funnel status.
*   **Resume Enhancement:** Keyword matching, gap analysis (missing endorsements), and interview prep.
*   **Job Alerts:** Real-time notifications for new matches, company updates, or location-based opportunities.
*   **Home Time Calculator:** Tool to estimate time off based on routes.

### 3.5. Recruiter Subscription Tiers
*   **Free Tier ($0/month):**
    *   1 active job posting
    *   Basic company profile
    *   Receive driver applications
    *   No driver search access
*   **Pro Tier ($249/month):**
    *   5 active job postings
    *   AI-powered driver search
    *   25 driver profile views per month
    *   Direct messaging with drivers
    *   Priority customer support
*   **Enterprise Tier ($749/month):**
    *   Unlimited job postings
    *   Unlimited driver profile views
    *   API access for ATS integration
    *   Dedicated account manager
    *   Custom branding options

### 3.6. Subscription Management
*   **Stripe Integration:** Secure checkout via Stripe Checkout Sessions
*   **Billing Portal:** Self-service subscription management via Stripe Customer Portal
*   **Quota Enforcement:** Real-time tracking of driver profile views
*   **Automatic Renewal:** Monthly billing with quota reset on billing cycle

### 3.7. Carrier Compliance Suite
*   **Compliance Calendar:** Automated tracking of expirations (Drug tests, Physicals, CDL, MVR).
*   **Document Vault:** Secure storage for carrier and driver documents with version history.
*   **DQ File Tracker:** FMCSA Qualification File completeness tracking per driver.
*   **CSA Monitor:** Real-time tracking of BASIC scores, trend analysis, and alerts.
*   **Incident Reporting:** DOT-compliant accident/incident documentation and investigation workflow.

## 4. Implementation Strategy (Phased Rollout)
*   **Week 1: Core Driver UX:** Implement persistent profile, Job Save/Favorite, Basic Application Tracking.
*   **Week 2: Engagement:** Launch Native Reviews system and Red Flag Warnings.
*   **Week 3: Advanced Features:** Roll out Multiple Preference Profiles and Resume Enhancement tools.
*   **Week 4: Monetization:** Launch Stripe subscription system with tiered pricing.
