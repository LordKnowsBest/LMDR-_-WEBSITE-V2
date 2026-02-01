# Compliance Page Setup Guide

**Track:** carrier_journey_activation_20260131
**Phase:** 3 - Compliance Suite Page Bridges

## Overview

The 5 compliance pages need to be created in the **Wix Editor** (pages cannot be created from code alone). Each page uses the shared `complianceBridge.jsw` backend module that centralizes all PostMessage routing.

## Prerequisites

- `src/backend/complianceBridge.jsw` exists (handles all backend routing)
- All 5 backend services exist from `carrier_compliance_20260120` track
- All 5 HTML files exist in `src/public/carrier/`

## Pages to Create

| # | Page Name | URL Slug | HTML File | Page Type |
|---|-----------|----------|-----------|-----------|
| 1 | Carrier Compliance Calendar | `/carrier-compliance-calendar` | `CARRIER_COMPLIANCE_CALENDAR.html` | `calendar` |
| 2 | Carrier Document Vault | `/carrier-document-vault` | `CARRIER_DOCUMENT_VAULT.html` | `vault` |
| 3 | Carrier DQ Tracker | `/carrier-dq-tracker` | `CARRIER_DQ_TRACKER.html` | `dqTracker` |
| 4 | Carrier CSA Monitor | `/carrier-csa-monitor` | `CARRIER_CSA_MONITOR.html` | `csaMonitor` |
| 5 | Carrier Incident Reporting | `/carrier-incident-reporting` | `CARRIER_INCIDENT_REPORTING.html` | `incidents` |

## Step-by-Step: Creating Each Page

### 1. In Wix Editor
1. Go to Pages → Add New Page
2. Name it (e.g., "Carrier Compliance Calendar")
3. Set URL slug (e.g., `carrier-compliance-calendar`)
4. Add an HTML iFrame element pointing to the correct HTML file
5. Set HTML component ID to `#complianceHtml` (or note whichever ID Wix assigns)

### 2. Page Code Template

After creating the page in the Editor, a page code file will appear in `src/pages/` with an auto-generated hash name. Paste this template code, changing only the `PAGE_TYPE` constant:

```javascript
/**
 * Carrier Compliance Page
 * Uses shared complianceBridge.jsw for all backend routing
 *
 * CHANGE THIS: Set PAGE_TYPE to match the page
 *   'calendar' | 'vault' | 'dqTracker' | 'csaMonitor' | 'incidents'
 */

import wixUsers from 'wix-users';
import wixLocation from 'wix-location';
import { handleComplianceMessage, getCompliancePageData } from 'backend/complianceBridge';
import { getCarrierIdentity } from 'backend/recruiter_service';

// *** CHANGE THIS for each page ***
const PAGE_TYPE = 'calendar';

$w.onReady(async function () {
  console.log(`[VELO] Compliance page ready: ${PAGE_TYPE}`);

  // Auth check
  const user = wixUsers.currentUser;
  if (!user.loggedIn) {
    wixUsers.promptLogin();
    return;
  }

  // Get carrier identity
  const identity = await getCarrierIdentity();

  if (!identity.success || identity.needsOnboarding) {
    console.warn('[VELO] No carrier identity, redirecting to welcome');
    wixLocation.to('/carrier-welcome');
    return;
  }

  const dot = identity.dotNumber;
  console.log(`[VELO] Carrier DOT: ${dot}, Company: ${identity.companyName}`);

  // Attach handlers to all possible HTML component IDs
  const possibleIds = ['#html1', '#html2', '#html3', '#html4', '#html5', '#complianceHtml'];
  for (const id of possibleIds) {
    try {
      const comp = $w(id);
      if (comp && typeof comp.onMessage === 'function') {
        console.log(`[VELO] Attaching compliance handlers to ${id}`);

        // Handle messages from HTML
        comp.onMessage(async (event) => {
          const msg = event.data;
          if (!msg || !msg.type) return;

          console.log(`[VELO] Received: ${msg.type}`);

          // Handle navigation messages
          if (msg.type === 'navigateTo' && msg.data?.page) {
            const routes = {
              'dashboard': '/recruiter-console',
              'compliance-calendar': '/carrier-compliance-calendar',
              'document-vault': '/carrier-document-vault',
              'dq-tracker': '/carrier-dq-tracker',
              'csa-monitor': '/carrier-csa-monitor',
              'incident-reporting': '/carrier-incident-reporting'
            };
            const route = routes[msg.data.page] || msg.data.page;
            wixLocation.to(route);
            return;
          }

          // Route to compliance bridge
          const result = await handleComplianceMessage(PAGE_TYPE, dot, msg);
          if (result) {
            comp.postMessage(result);
          }
        });

        // Send initial data after a brief delay (let HTML initialize)
        const initialData = await getCompliancePageData(PAGE_TYPE, dot);
        if (initialData) {
          setTimeout(() => {
            comp.postMessage(initialData);
            console.log(`[VELO] Sent initial ${PAGE_TYPE} data`);
          }, 500);
        }
      }
    } catch (e) {
      // Component doesn't exist - skip
    }
  }
});
```

### 3. PAGE_TYPE Values

| Page | PAGE_TYPE |
|------|-----------|
| Compliance Calendar | `'calendar'` |
| Document Vault | `'vault'` |
| DQ File Tracker | `'dqTracker'` |
| CSA Score Monitor | `'csaMonitor'` |
| Incident Reporting | `'incidents'` |

## PostMessage Protocol Reference

### Compliance Calendar
- **Ready signal:** `calendarReady`
- **Data request:** `getComplianceData`
- **Data response:** `setComplianceData` → `{ events: [], summary: {} }`
- **Action:** `createComplianceEvent` → `eventCreated`

### Document Vault
- **Ready signal:** `vaultReady`
- **Data request:** `getDocuments`
- **Data response:** `setDocuments` → `{ documents: [] }`
- **Action:** `uploadDocument` → `documentUploaded`

### DQ File Tracker
- **Ready signal:** `dqTrackerReady`
- **Data request:** `getDQFiles`
- **Data response:** `setDQFiles` → `{ files: [], summary: {} }`
- **Action:** `generateAuditReport` → `auditReportGenerated`

### CSA Score Monitor
- **Ready signal:** `csaMonitorReady`
- **Data request:** `getCSAData`
- **Data response:** `setCSAData` → `{ basics: {}, history: [], recommendations: [] }`

### Incident Reporting
- **Ready signal:** `incidentsReady`
- **Data request:** `getIncidents`
- **Data response:** `setIncidents` → `{ incidents: [], stats: {} }`
- **Action:** `createIncidentReport` → `incidentCreated`

## Demo Data Fallback

All 5 HTML files have a 5-second timeout. If no page code responds within 5 seconds, they render demo/mock data. This means:
- Pages work standalone (just with fake data) before wiring
- The bridge only needs to respond within 5 seconds to show real data
