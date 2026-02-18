# Track Plan: Carrier Lead Form UX Enhancement

> **Pattern:** Progressive Disclosure + Inline Validation + Micro-interactions (3+2+5)

---

## Overview

Refactor the carrier staffing lead form on `Trucking Companies.html` to improve conversion rates through:
1. **Progressive Disclosure** - Start minimal, reveal fields based on input
2. **Inline Validation** - Real-time feedback with visual indicators
3. **Micro-interactions** - Smooth animations and polished transitions

### Target Flow

```
INITIAL STATE (4 fields visible):
┌─────────────────────────────────────┐
│  [Contact Name]     [Email]         │
│  [Phone]            [Drivers Needed]│
└─────────────────────────────────────┘
                 ↓ User selects "Drivers Needed"

REVEAL STAGE 1:
┌─────────────────────────────────────┐
│  [Contact Name ✓]   [Email ✓]       │
│  [Phone ✓]          [6-10 drivers]  │
│  ┌─────────────────────────────────┐│
│  │ Driver Types (slide in)         ││
│  │ [OTR] [Regional] [Local] ...    ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
                 ↓ User checks any driver type

REVEAL STAGE 2:
┌─────────────────────────────────────┐
│  ... (previous fields)             │
│  ┌─────────────────────────────────┐│
│  │ Equipment / Endorsements        ││
│  │ [Dry Van] [Reefer] [Hazmat] ... ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ Company Details (optional)      ││
│  │ [Company Name] [DOT Number]     ││
│  │ [Additional Notes]              ││
│  └─────────────────────────────────┘│
│  [Get Drivers Now →]               │
└─────────────────────────────────────┘
```

---

## Phase 1: Progressive Form Structure

### 1.1 HTML Restructure
- [x] Task: Wrap form sections in reveal containers with `data-reveal` attributes
- [x] Task: Add `form-section` class with hidden state for progressive fields
- [x] Task: Reorder fields: Contact → Drivers Needed → Driver Types → Equipment → Company/Notes
- [x] Task: Mark essential fields (Name, Email, Phone, Drivers Needed) as always visible
- [x] Task: Add `data-reveal-trigger` attributes to trigger fields

### 1.2 Progressive Reveal CSS
- [x] Task: Add `.form-section` base styles (hidden by default)
- [x] Task: Add `.form-section.revealed` styles (visible state)
- [x] Task: Add CSS transitions for smooth reveal (max-height, opacity)
- [x] Task: Ensure mobile-responsive reveal behavior

### 1.3 Progressive Reveal JavaScript
- [x] Task: Create `revealSection(sectionId)` function with animation
- [x] Task: Add event listener to "Drivers Needed" dropdown → reveal Driver Types
- [x] Task: Add event listener to Driver Types checkboxes → reveal Equipment section
- [x] Task: Add event listener to Equipment checkboxes → reveal Company/Notes section
- [x] Task: Ensure revealed sections stay visible (no re-hiding)

---

## Phase 2: Inline Validation

### 2.1 Validation State CSS
- [x] Task: Add `.input-valid` class with green border and checkmark icon
- [x] Task: Add `.input-invalid` class with red border and error styling
- [x] Task: Add `.input-error-message` for inline error text
- [x] Task: Add checkmark/error icons as pseudo-elements or inline SVG
- [x] Task: Style validation states for all input types (text, email, tel, select)

### 2.2 Validation Functions
- [x] Task: Create `validateField(input)` returning `{ valid, message }`
- [x] Task: Implement email validation with regex
- [x] Task: Implement phone validation (10+ digits)
- [x] Task: Implement required field validation
- [x] Task: Create `showValidationState(input, isValid, message)` function

### 2.3 Real-time Validation Events
- [x] Task: Add `blur` event listeners to all required inputs
- [x] Task: Add `input` event listeners for real-time feedback (debounced)
- [x] Task: Validate on form submit and focus first invalid field
- [x] Task: Clear validation state when user starts typing

### 2.4 Phone Auto-formatting
- [x] Task: Implement phone number auto-format as user types: (555) 123-4567
- [x] Task: Handle paste events for phone field
- [x] Task: Strip non-numeric characters for submission

---

## Phase 3: Micro-interactions & Polish

### 3.1 Input Focus Effects
- [x] Task: Add floating label animation (placeholder → label above on focus)
- [x] Task: Add subtle scale/shadow on input focus
- [x] Task: Add smooth border-color transition on focus

### 3.2 Reveal Animations
- [x] Task: Implement staggered animation for checkbox grids (chips appear sequentially)
- [x] Task: Add slide-down + fade-in for revealed sections
- [x] Task: Use CSS `@keyframes` for smooth 300ms transitions

### 3.3 Submit Button States
- [x] Task: Add hover animation (slight lift with shadow)
- [x] Task: Add loading state with spinner
- [x] Task: Add success state with checkmark animation
- [x] Task: Disable button during submission with visual feedback

### 3.4 Checkbox/Chip Interactions
- [x] Task: Add scale bounce on checkbox selection
- [x] Task: Add background color transition on selection
- [x] Task: Add subtle haptic-style feedback (transform pulse)

### 3.5 Success State
- [x] Task: Add success message slide-in animation
- [x] Task: Add confetti or subtle celebration effect (optional)
- [x] Task: Smooth transition from form to success state

---

## Phase 4: Integration & Testing

### 4.1 PostMessage Bridge Verification
- [x] Task: Verify form data collection includes all fields (visible and hidden)
- [x] Task: Test submission with minimal fields (progressive not triggered)
- [x] Task: Test submission with all fields revealed and filled
- [x] Task: Verify backend receives correct data structure

### 4.2 Mobile Testing
- [x] Task: Test progressive reveal on mobile viewport
- [x] Task: Verify touch targets meet 44px minimum
- [x] Task: Test validation states on mobile
- [x] Task: Verify animations respect `prefers-reduced-motion`

### 4.3 Cross-browser Testing
- [x] Task: Test on Chrome, Safari, Firefox
- [x] Task: Verify CSS animations work across browsers
- [x] Task: Test form validation across browsers

---

## Implementation Notes

### CSS Variables to Add
```css
--reveal-duration: 300ms;
--reveal-easing: cubic-bezier(0.4, 0, 0.2, 1);
--valid-color: #12B76A;
--invalid-color: #EF4444;
--focus-ring: 0 0 0 3px rgba(59, 130, 246, 0.15);
```

### JavaScript Event Flow
```
Drivers Needed (change)
    → revealSection('driverTypes')
    → staggeredReveal(checkboxes)

Driver Type (any checked)
    → revealSection('equipment')
    → revealSection('companyDetails')

Input (blur)
    → validateField(input)
    → showValidationState()

Form (submit)
    → validateAll()
    → if valid: submit via postMessage
    → else: focusFirstInvalid()
```

### Accessibility Considerations
- Use `aria-hidden` for unrevealed sections
- Announce validation errors to screen readers
- Maintain focus order through progressive reveal
- Respect `prefers-reduced-motion` for animations

---

## Success Metrics

- Form completion rate increase (target: +15%)
- Reduced form abandonment
- Faster time-to-submit for simple requests
- Positive user feedback on form experience

---

## Files Modified

| File | Changes |
|------|---------|
| `src/public/Trucking Companies.html` | Form restructure, CSS additions, JavaScript enhancements |

---

## 
## Phase 5: Verification Plan

### 5.1 Automated Browser Testing (Manual or Scripted)
- [x] **Test Case 1: Initial Load**
    - Verify only "Contact Name", "Email", "Phone", "Drivers Needed" are visible.
    - Verify "Driver Types", "Equipment", "Company Details" are hidden (`display: none` or `height: 0`).
- [x] **Test Case 2: Progressive Reveal**
    - Select "6-10 drivers" -> Verify "Driver Types" section slides down.
    - Check "OTR" -> Verify "Equipment" section slides down.
    - Check "Dry Van" -> Verify "Company Details" section slides down.
- [x] **Test Case 3: Validation**
    - Enter invalid email "test@" -> Verify red border and error message on blur.
    - Enter valid email "test@example.com" -> Verify green border/checkmark.
    - Submit empty form -> Verify focus jumps to first invalid field (Name).
- [x] **Test Case 4: Phone Formatting**
    - Type "5551234567" -> Verify input value becomes "(555) 123-4567".
    - Delete characters -> Verify formatting adjusts correctly.

### 5.2 Code Quality Verification
- [x] **Linting**: Run `npm run lint` to ensure no new errors in `Trucking Companies.html` (JS/CSS).
- [x] **Performance**: Check Chrome DevTools Performance tab for Main Thread blocking interaction < 100ms during reveals.

### 5.3 Data Integrity
- [x] **Submission Test**: Fill out form completely and submit.
    - Check Network tab for `postMessage` payload.
    - Verify payload contains all fields:
        - `contactName`, `email`, `phone`, `driversNeeded`
        - `driverTypes` (array)
        - `equipment` (array)
        - `companyName`, `dotNumber`, `notes`

