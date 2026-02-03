# Page Code <-> HTML Parity Report

This report maps Wix Velo page code files (`src/pages/*.js`) to their corresponding HTML files (`src/public/**/*.html`).
The goal is to identify outliers where a page code file exists without a corresponding HTML file, or vice versa.

## Matched Pairs
These pairs were identified by exact or fuzzy name matching.

| Page Code File | HTML File |
|---|---|
| Carrier Welcome.gnhma.js | src/public/carrier/Carrier_Welcome.html |
| OTR Truck Driver Placement.t1alo.js | src/public/landing/OTR Truck Driver Placement.html |
| RECRUITER DRIVER SEARCH.qtecw.js | src/public/recruiter/RECRUITER_DRIVER_SEARCH.html |
| Home Nightly - Regional CDL Careers.uixmh.js | src/public/landing/Home Nightly - Regional CDL Careers.html |
| RECRUITER_COST_ANALYSIS.hc0dz.js | src/public/recruiter/RECRUITER_COST_ANALYSIS.html |
| Quick Apply - Upload Your CDL & Resume.pa6f5.js | src/public/landing/Quick Apply - Upload Your CDL & Resume.html |
| RECRUITER_COMPETITOR_INTEL.hvbs4.js | src/public/recruiter/RECRUITER_COMPETITOR_INTEL.html |
| Subscription Canceled.exqj3.js | src/public/utility/Subscription_Canceled.html |
| CARRIER_INCIDENT_REPORTING.dfobc.js | src/public/carrier/CARRIER_INCIDENT_REPORTING.html |
| ALLURE Refrigerated-Premium Opportunity.bg2us.js | src/public/landing/ALLURE Refrigerated-Premium Opportunity.html |
| AI vs Traditional Recruiting Methods.z4qqg.js | src/public/landing/AI vs Traditional Recruiting Methods.html |
| DOT Compliance in Driver Hiring.ydkkc.js | src/public/landing/DOT Compliance in Driver Hiring.html |
| Apply for CDL Driving Jobs.e4a6t.js | src/public/landing/Apply for CDL Driving Jobs.html |
| DRIVER_ANNOUNCEMENTS.jgkc4.js | src/public/driver/DRIVER_ANNOUNCEMENTS.html |
| Placement Success.tz647.js | src/public/utility/Placement_Success.html |
| CARRIER_COMPLIANCE_CALENDAR.ww0h3.js | src/public/carrier/CARRIER_COMPLIANCE_CALENDAR.html |
| CDL Driver Recruitment Pricing.o5c9o.js | src/public/landing/CDL Driver Recruitment Pricing.html |
| CDL Class A Driver Recruitment.mysoi.js | src/public/landing/CDL Class A Driver Recruitment.html |
| RECRUITER_FUNNEL.c87yk.js | src/public/recruiter/RECRUITER_FUNNEL.html |
| CARRIER_DQ_TRACKER.sb2ig.js | src/public/carrier/CARRIER_DQ_TRACKER.html |
| Subscription Success.o76p8.js | src/public/utility/Subscription_Success.html |
| CARRIER_DOCUMENT_VAULT.yl5oe.js | src/public/carrier/CARRIER_DOCUMENT_VAULT.html |
| CARRIER_POLICIES.m76is.js | src/public/carrier/CARRIER_POLICIES.html |
| Driver Dashboard.ctupv.js | src/public/driver/DRIVER_DASHBOARD.html |
| CARRIER_ANNOUNCEMENTS.zmhem.js | src/public/carrier/CARRIER_ANNOUNCEMENTS.html |
| RECRUITER_PREDICTIONS.g78id.js | src/public/recruiter/RECRUITER_PREDICTIONS.html |
| CARRIER_CSA_MONITOR.bov8u.js | src/public/carrier/CARRIER_CSA_MONITOR.html |
| ALLURE Onboarding.u45iu.js | src/public/landing/ALLURE Onboarding.html |
| Driver Opportunities - Your Next Career .lb0uy.js | src/public/driver/Driver Opportunities - Your Next Career.html |
| Rapid Response - Job Description.av1bx.js | src/public/landing/Rapid Response - Job Description.html |
| Trucking Companies.iq65y.js | src/public/carrier/Trucking Companies.html |
| RECRUITER_ATTRIBUTION.f8zdu.js | src/public/recruiter/RECRUITER_ATTRIBUTION.html |
| Last Mile Delivery Driver Staffing.ubhv0.js | src/public/landing/Last Mile Delivery Driver Staffing.html |
| Carrier Solutions - Retention-Focused.o3sez.js | src/public/carrier/Carrier Solutions - Retention-Focused.html |
| Driver Retention Best Practices.ypq30.js | src/public/driver/Driver Retention Best Practices.html |

## Likely Matches (Manual Verification)
These pairs have different names but likely correspond to each other based on context or partial similarity.

| Page Code File | HTML File | Notes |
|---|---|---|
| AI - Matching.rof4w.js | src/public/driver/AI_MATCHING.html | Hyphen vs Underscore |
| Road Utilities.xzvqe.js | src/public/driver/DRIVER_ROAD_UTILITIES.html | "Road Utilities" in name |
| HealthWellness_Bridge_Reference.js | src/public/driver/HEALTH_WELLNESS.html | Bridge Reference matches HTML content |
| PetFriendly_Bridge_Reference.js | src/public/driver/PET_FRIENDLY.html | Bridge Reference matches HTML content |
| Retention Dashboard.k2ez4.js | src/public/recruiter/Recruiter_Retention_Dashboard.html | Dashboard for Retention |
| Recruiter Console.zriuj.js | src/public/recruiter/RecruiterDashboard.html | Likely match |
| About.dkz1k.js | src/public/landing/About_page.html | "About" |
| Truck Drivers .gsx0g.js | src/public/landing/Truck_Driver_Page.html | "Truck Drivers" vs "Truck_Driver_Page" |

## Outliers: Page Code Only (Missing HTML)
These files exist in `src/pages` but no corresponding HTML file was found in `src/public`.

*   **Member Page.k40gh.js**: Standard Wix Members Area page.
*   **Post.vjkjy.js**: Standard Wix Blog Post page.
*   **masterPage.js**: Global site code (runs on all pages).
*   **Checkout.kbyzk.js**: Standard Wix Stores Checkout page.
*   **Home.c1dmp.js**: Homepage. Might correspond to a landing page HTML but no direct match found.
*   **Driver Jobs (Item).s0js1.js**: Dynamic Item Page for Driver Jobs.
*   **LMDR Privacy Policy.cb4ub.js**: Privacy Policy page code.
*   **Blog.b06oz.js**: Standard Wix Blog Feed page.

## Outliers: HTML Only (Missing Page Code)
These HTML files exist in `src/public` but no corresponding page code file was found in `src/pages`.

### Admin Pages
*   src/public/admin/ADMIN_OBSERVABILITY.html
*   src/public/admin/ADMIN_FEATURE_ADOPTION.html
*   src/public/admin/ADMIN_MODERATION.html
*   src/public/admin/ADMIN_PROMPTS.html
*   src/public/admin/ADMIN_DRIVERS.html
*   src/public/admin/ADMIN_CARRIERS.html
*   src/public/admin/ADMIN_AUDIT_LOG.html
*   src/public/admin/B2B_ACCOUNT_DETAIL.html
*   src/public/admin/B2B_RESEARCH_PANEL.html
*   src/public/admin/B2B_ANALYTICS.html
*   src/public/admin/B2B_PIPELINE.html
*   src/public/admin/Admin_Portal_Dashboard.html
*   src/public/admin/B2B_DASHBOARD.html
*   src/public/admin/B2B_LEAD_CAPTURE.html
*   src/public/admin/ADMIN_DASHBOARD.html
*   src/public/admin/ADMIN_GAMIFICATION_ANALYTICS.html
*   src/public/admin/ADMIN_AI_ROUTER.html
*   src/public/admin/B2B_CAMPAIGNS.html
*   src/public/admin/B2B_OUTREACH.html
*   src/public/admin/ADMIN_CONTENT.html
*   src/public/admin/ADMIN_MATCHES.html

### Driver Pages
*   src/public/driver/DRIVER_FORUMS.html
*   src/public/driver/CHALLENGES.html
*   src/public/driver/DRIVER_MY_CAREER.html
*   src/public/driver/DRIVER_DOCUMENT_UPLOAD.html
*   src/public/driver/Driver Jobs.html (Might map to `Driver Jobs (Item)`)
*   src/public/driver/DRIVER_POLICIES.html
*   src/public/driver/DRIVER_GAMIFICATION.html
*   src/public/driver/DRIVER_BADGES.html

### Recruiter Pages
*   src/public/recruiter/Recruiter_Pipeline_Page.html
*   src/public/recruiter/Recruiter_Pricing.html
*   src/public/recruiter/Recruiter_Pricing_Page.html
*   src/public/recruiter/Recruiter_Console_Infograph.html
*   src/public/recruiter/Recruiting_Landing_Page.html
*   src/public/recruiter/RECRUITER_ONBOARDING_DASHBOARD.html
*   src/public/recruiter/RECRUITER_LEADERBOARD.html
*   src/public/recruiter/RECRUITER_GAMIFICATION.html
*   src/public/recruiter/Recruiter_Telemetry.html
*   src/public/recruiter/RECRUITER_LIFECYCLE_MONITOR.html

### Landing & Utility
*   src/public/landing/Unified_Recruiter_Pricing.html
*   src/public/landing/lmdr-cdl-driver-landing-iframe-optimized.html
*   src/public/landing/48-Hour CDL Driver Placement.html
*   src/public/collateral/LMDR-Placement-Service-Carrier-OnePager.html
*   src/public/utility/Orientation_Scheduler.html
*   src/public/utility/DQF_Compliance_Portal.html
*   src/public/utility/application_confirmation_email.html
*   src/public/utility/GAMIFICATION_HELP.html
*   src/public/utility/Office_Management.html
*   src/public/utility/SETTINGS_SIDEBAR.html
*   src/public/utility/_TEMPLATE_Carrier_Staffing_Form.html
*   src/public/utility/Sidebar.html
*   src/public/utility/PRICING PAGE TEMPLATE.html
*   src/public/carrier/Carrier_Intake_Questionnaire.html
*   src/public/carrier/CARRIER_WEIGHT_PREFERENCES.html
