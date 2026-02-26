# LMDR Reverse Matching Engine: Troubleshooting Guide

This guide is designed for LMDR administrators handling support escalations regarding the Reverse Matching Engine (Carrier $\rightarrow$ Driver search). 

It covers the most common issues carriers experience when searching for, viewing, and contacting drivers, alongside diagnostic steps and resolutions.

---

## 1. Search Results & Matching

### 1.1 "I'm searching for drivers but getting zero results."
* **Symptom:** The carrier runs a search with specific filters but the results list is empty.
* **Diagnosis:** 
  1. Check the Carrier's target geography vs the driver pool density.
  2. Verify if the Driver Profiles collection actually contains drivers that meet the exact combination of filters (e.g., Hazmat AND 5+ years experience AND within 50 miles of 75001).
  3. Verify the carrier has an active `pro` or `enterprise` subscription. Free users are blocked from seeing search results (they only see a count).
* **Resolution:** Advise the carrier to broaden their search criteria (e.g., remove specific endorsements or increase the radius). If they are on the free tier, they must upgrade.

### 1.2 "Why is this driver's match score so low?"
* **Symptom:** A carrier questions why a seemingly qualified driver has a score of 65%.
* **Diagnosis:**
  1. Have the carrier open the **Match Scoring Settings** (slider icon in the top right of the search interface).
  2. Review their custom weights. If they weighted "Salary Fit" at 50% but the driver's expected salary is much higher than the carrier's posted average, the overall score will plummet regardless of experience.
* **Resolution:** Instruct the carrier to adjust their Match Scoring weights to better reflect what they actually prioritize. Alternatively, they can use one of the "Quick Presets" in the settings panel.

### 1.3 "A driver applied to us yesterday, but they aren't showing up as a 'Mutual Match'."
* **Symptom:** A known interested driver is missing the "Mutual Match" priority flag.
* **Diagnosis:**
  1. Check the `DriverCarrierInterests` (or equivalent application) collection.
  2. Ensure the record links the specific `driver_id` and `carrier_dot`.
  3. Ensure the driver's profile has `is_searchable: true` and `visibility_level: 'full'`.
* **Resolution:** If the driver hid their profile after applying, they vanish from the search pool. The driver must set their profile back to visible.

---

## 2. Quotas and Subscriptions

### 2.1 "It says my view quota is exhausted, but it's a new month!"
* **Symptom:** Carrier is blocked from viewing profiles with a "Quota Exhausted" message.
* **Diagnosis:**
  1. Check the `CarrierSubscriptions` collection for that carrier.
  2. Look at the `current_period_end` date. The quota resets based on their specific billing cycle, *not* the calendar month. 
* **Resolution:** Explain the billing cycle reset date. If it *is* past the reset date and still blocked, run the `syncStripeSubscription` backend function manually to force an update.

### 2.2 "I viewed the same driver twice and it counted against my quota both times."
* **Symptom:** Carrier complains about double-billing for views.
* **Diagnosis:**
  1. Check the `CarrierDriverViews` collection.
  2. The system logic (`recordProfileView`) is designed to *ignore* duplicate views of the same driver within a 24-hour window by the same carrier.
* **Resolution:**
  - If the views were $>24$ hours apart, this is intended behavior. Profile data updates frequently, so viewing it days apart counts as a new data pull.
  - If the views were $<24$ hours apart, escalate to engineering as this indicates a bug in the `subscriptionService.jsw` deduplication check.

---

## 3. Communication & Outreach

### 3.1 "I sent a message to a driver, but they never got it."
* **Symptom:** Messages sent via the interface are not reaching the driver.
* **Diagnosis:**
  1. Check the `CarrierDriverOutreach` collection for the message record.
  2. Verify the `delivery_status` field (e.g., `sent`, `bounced`, `failed`).
  3. If it's an email, check SendGrid/mail logs via the `ADMIN_OBSERVABILITY` dashboard.
  4. If it's an SMS (Enterprise only), check Twilio logs.
* **Resolution:** If the email bounced, the driver's on-file email is invalid. The outreach record should be flagged. If the system failed to send entirely, check the Node.js logs for API key errors.

### 3.2 "The 'Generate with AI' button for messaging isn't working."
* **Symptom:** Clicking the AI compose button results in an error or infinite spinner.
* **Diagnosis:**
  1. Check the `aiUsageLog` for recent failures.
  2. Verify the AI Provider (e.g., Claude, OpenAI) is currently online and the API key is valid in Wix Secrets Manager.
* **Resolution:** Switch the active AI provider in the `ADMIN_AI_ROUTER` dashboard to a fallback (e.g., switch from Anthropic to OpenAI) to immediately restore service while investigating the primary provider outage.

---

## 4. Admin Analytics

### 4.1 "The reverse matching conversion numbers look wrong on the dashboard."
* **Symptom:** Total views are lower than total contacts, resulting in $>100\%$ contact rate.
* **Diagnosis:** This occurs if a carrier contacts a driver through means *outside* the Reverse Matching flow (e.g., direct application response) but the system still tracked the contact event.
* **Resolution:** The `getConversionMetrics` query in `reverseMatchAnalyticsService` filters outreach strictly to actions originating from the 'Reverse Match' source. Verify that frontend tracking tags are correctly passing `source: 'reverse_search'` in the `contactDriver` payload.
