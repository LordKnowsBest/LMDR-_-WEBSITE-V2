# Standard Carrier Staffing Form Pattern

> Auto-injected when editing carrier HTML or staffing-related files.

All carrier landing pages that collect staffing requests MUST use this standard form pattern to ensure data flows to the correct collections.

## Target Collections

| Collection | Purpose |
|------------|---------|
| `carrierStaffingRequests` | Stores all lead submissions from forms |
| `Carriers` | Used for DOT number lookup and `linked_carrier_id` reference |

## Template Location

Copy and customize: `src/public/_TEMPLATE_Carrier_Staffing_Form.html`

## Required Form Field IDs (DO NOT CHANGE)

```html
<!-- These IDs must match exactly for backend integration -->
<form id="carrierStaffingForm">
  <input id="companyName" name="companyName">
  <input id="contactName" name="contactName">
  <input id="email" name="email">
  <input id="phone" name="phone">
  <input id="dotNumber" name="dotNumber">        <!-- Enables carrier linking -->
  <input name="staffingType" value="emergency|strategic">
  <select id="driversNeeded" name="driversNeeded">
  <input name="driverTypes" type="checkbox">     <!-- Multi-select chips -->
  <textarea id="additionalNotes" name="additionalNotes">
  <button id="submitBtn">
  <div id="formSuccess">
  <div id="formError">
</form>
```

## Required PostMessage Bridge

The HTML form communicates with Wix Velo via PostMessage:

```javascript
// Form sends to Wix:
window.parent.postMessage({
  type: 'submitCarrierStaffingRequest',
  data: { companyName, contactName, email, phone, dotNumber, staffingType, ... }
}, '*');

// Wix responds:
{ type: 'staffingRequestResult', data: { success: true, leadId: '...' } }
```

## Required Page Code Integration

```javascript
import { submitCarrierStaffingRequest } from 'backend/carrierLeadsService';

$w.onReady(function() {
  const htmlComponent = $w('#html4'); // Adjust ID as needed

  htmlComponent.onMessage(async (event) => {
    if (event.data.type === 'submitCarrierStaffingRequest') {
      const result = await submitCarrierStaffingRequest(event.data.data);
      htmlComponent.postMessage({ type: 'staffingRequestResult', data: result });
    }
  });
});
```

## Claude Code Hook

A validation hook (`validate-carrier-form.ps1`) automatically runs when creating carrier landing pages and blocks if required elements are missing.
