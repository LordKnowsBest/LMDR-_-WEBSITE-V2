# LMDR Mobile Optimization & Brand Implementation Guide
**Target Device:** iPhone 12/13 (390px x 844px)
**Brand Identity:** Last Mile Driver Recruiting (LMDR)

This guide combines industry-standard mobile best practices with the specific LMDR visual identity to ensure high-conversion experiences on mobile devices.

---

## 1. iPhone 12/13 Specifications & Constraints
*   **Viewport Width:** `390px` (CSS pixels)
*   **Viewport Height:** `844px`
*   **Safe Areas:**
    *   **Top (Notch/Dynamic Island):** ~47px
    *   **Bottom (Home Indicator):** ~34px
*   **Key Constraint:** Avoid placing critical buttons or text in the bottom 34px or top 47px to prevent overlap with system gestures.

---

## 2. LMDR Mobile Design System

### A. Color & Visual Hierarchy
*   **Backgrounds:** Use `bg-slate-50` (Canvas) for general content to reduce glare, `bg-white` for cards.
*   **Primary Actions (Drivers):**
    *   **Color:** `bg-amber-400` (#fbbf24) text `text-slate-900`.
    *   **Style:** High contrast, urgent.
*   **Primary Actions (Carriers):**
    *   **Color:** `bg-blue-600` (#2563eb) text `text-white`.
    *   **Style:** Professional, trustworthy.
*   **Text:**
    *   **Headlines:** `text-slate-900` (Inter Black).
    *   **Body:** `text-slate-600` (Inter Regular).

### B. Typography (Mobile Scale)
*   **H1 (Hero):** `text-3xl` (30px) or `text-4xl` (36px). *Avoid `text-5xl+` on mobile to prevent word wrapping issues.*
*   **H2 (Section):** `text-2xl` (24px).
*   **Body:** `text-base` (16px). *Crucial: Inputs must be at least 16px to prevent iOS auto-zoom.*
*   **Meta/Labels:** `text-xs` or `text-sm`.

### C. Touch Targets
*   **Minimum Size:** 44x44px for all interactive elements.
*   **Buttons:** `py-3` or `py-4` is standard.
*   **Links:** Ensure inline links have `p-2` padding to expand the clickable area.

---

## 3. Implementation Checklist (Tailwind CSS)

### Step 1: Viewport & Base Settings
Ensure the HTML head contains the correct viewport tag for iOS:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
```
*Note: `viewport-fit=cover` allows background colors to extend into safe areas.*

### Step 2: Safe Area Spacing
Use utility classes to respect the notch and home indicator.
```css
/* Add to custom CSS or global styles */
.pt-safe { padding-top: env(safe-area-inset-top); }
.pb-safe { padding-bottom: env(safe-area-inset-bottom); }
```
**Usage:**
*   Add `.pb-safe` to your fixed bottom navigation or sticky CTA bands.
*   Add `.pt-safe` to your header or top banner.

### Step 3: Layout Adaptations (Mobile-First)

**1. Stacked Layouts:**
Change all horizontal grids to vertical stacks by default.
```html
<!-- BAD -->
<div class="grid grid-cols-2">...</div>

<!-- GOOD (LMDR Standard) -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">...</div>
```

**2. Padding Reduction:**
Standard desktop padding (`px-12`) is too wide for 390px screens. Use `px-4`.
```html
<section class="px-4 py-10 md:px-8 md:py-20">
```

**3. Card Simplification:**
On mobile, remove complex hover effects or decorative blurs that cause performance lag.
```html
<div class="rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
    <!-- Content -->
</div>
```

### Step 4: Component Specifics

**Hero Section:**
*   **Image:** Place image *below* text on mobile (or hide if purely decorative) to prioritize the value prop.
*   **Badges:** Stack "Floating Badges" statically below the image on mobile to avoid covering the visual.

**Forms:**
*   **Input Height:** Minimum `h-12` (48px).
*   **Font Size:** `text-base` (16px) minimum.
*   **Submit Button:** Full width (`w-full`) fixed at the bottom of the viewport or end of form.

**Navigation:**
*   **Hamburger Menu:** Essential for mobile. Don't try to squeeze links.
*   **Sticky CTA:** For long landing pages, keep a "Apply Now" button sticky at the bottom (`bottom-0 fixed w-full z-50`).

---

## 4. Code Snippets for LMDR

### Mobile Sticky CTA (Driver)
```html
<div class="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:hidden">
    <a href="/apply" class="flex items-center justify-center w-full bg-amber-400 text-slate-900 font-black py-4 rounded-xl text-lg shadow-lg">
        Start Application <i class="fa-solid fa-arrow-right ml-2"></i>
    </a>
</div>
```

### Mobile Hero Typography
```html
<h1 class="text-4xl font-black text-slate-900 leading-tight">
    Get <span class="bg-gradient-to-r from-amber-400 to-yellow-300 px-2 rounded transform -skew-x-3 inline-block">Multiple Offers</span>
    <br>in 48 Hours
</h1>
```

### Safe Area Padding Utility
```css
@supports (padding-bottom: env(safe-area-inset-bottom)) {
    .pb-safe {
        padding-bottom: env(safe-area-inset-bottom);
    }
}
```

---

## 5. Testing Protocol (iPhone 12/13)

1.  **Landscape Check:** Does content break when rotated?
2.  **Thumb Zone:** Can you reach the primary CTA with your thumb while holding the phone with one hand?
3.  **Readable Text:** Is any text smaller than 14px? (Should be rare).
4.  **Touch Spacing:** Are links at least 8px apart?
