# Product Guidelines: LMDR AI Matching Platform

## 1. Brand Philosophy
*   **Core Principle:** Contrast and Clarity.
*   **Dual Audience Strategy:**
    *   **Drivers (LEFT):** Warm, action-oriented, urgent tone.
        *   *Emotional Appeal:* Opportunity, freedom, better life.
        *   *Value Prop:* "AI-matched to carriers that fit your life."
    *   **Carriers (RIGHT):** Cool, trust-focused, ROI-driven tone.
        *   *Emotional Appeal:* Efficiency, reliability, cost savings.
        *   *Value Prop:* "Pre-qualified drivers delivered in 24-48 hours."
*   **Positioning Rule:** Drivers ALWAYS appear LEFT. Carriers ALWAYS appear RIGHT.

## 2. Visual Identity & Color System
*   **Primary Palette:**
    *   **LMDR Dark:** `#0f172a` (Slate-900) - Used for dark cards, footers, emphasis.
    *   **LMDR Blue:** `#2563eb` (Blue-600) - Carrier CTAs, trust markers.
    *   **LMDR Yellow:** `#fbbf24` (Amber-400) - Driver CTAs, highlights.
    *   **Canvas:** `#f9fafb` (Gray-50) - Backgrounds.
    *   **Content:** `#ffffff` (White) - Card bodies.
    *   **Body Text:** `#475569` (Slate-600) - Secondary text, body copy.
*   **Gradients:**
    *   *Driver Highlight:* "Yellow Momentum" (Linear gradient #F9FF80 to #FFD700).
    *   *Brand Text:* "Blue Authority" (Linear gradient #2563eb to #1e40af).
*   **Semantic Colors:**
    *   **Success:** `green-100` bg / `green-600` text.
    *   **Warning:** `yellow-100` bg / `yellow-600` text.
    *   **Error:** `red-100` bg / `red-600` text.
*   **Category Colors:**
    *   **Driver Tips:** `blue-600`
    *   **Carrier Resources:** `emerald-600`
    *   **Industry News:** `purple-600`
    *   **Compliance:** `orange-600`
    *   **Company News:** `slate-600`

## 3. Typography
*   **Font Family:** **Inter** (Weights: 300-900).
*   **Scale:**
    *   **Hero Headline:** `text-4xl md:text-6xl font-black`
    *   **Section Title:** `text-3xl md:text-5xl font-black`
    *   **Card Heading:** `text-xl font-bold`
    *   **Body Large:** `text-lg text-gray-600`
    *   **Body:** `text-base text-slate-600`
    *   **Meta Label:** `text-xs font-bold uppercase tracking-wider`

## 4. UI Components & Layout
*   **Container:** Max width `max-w-6xl`, centered `mx-auto`.
*   **Spacing:**
    *   **Section Padding:** `py-20` (standard), `py-10` (compact), `py-10` (stats strip).
*   **Grid Gaps:** `gap-8` (standard), `lg:gap-12` (large).
*   **Cards:**
    *   *Standard:* `rounded-xl`, `p-6`.
    *   *Hero:* `rounded-3xl`, `p-8`.
    *   *Driver Card:* Dark bg (`bg-slate-900`), Yellow CTA.
    *   *Carrier Card:* White bg, Blue/Dark CTA.
*   **Iconography:** Font Awesome 6.4 (Solid).
    *   *Driver Icons:* Routes, Pay, Home Time.
    *   *Carrier Icons:* Growth, Verification, Speed.
*   **Core Components (Reference Classes in Brand Skill):**
    *   **Hero Cards:** Driver card left (dark/yellow), Carrier card right (white/blue/dark).
    *   **Stats Strip:** 2x2 or 4x1 grid, numeric emphasis.
    *   **How It Works:** 4-step grid, AI step can pulse.
    *   **Split Benefits:** Driver column light; Carrier column dark.
    *   **Application Section:** Dark container with white form card.
    *   **CTA Band:** Blue background, white primary CTA.
    *   **Content Cards:** Standard, featured, resource download, testimonial variants.
    *   **Navigation/Footer:** Light header, dark footer.

## 5. Voice & Tone
*   **Driver Copy:** Direct, time-sensitive, numbers-driven.
    *   *Example:* "Matches in < 24hrs", "100% free for drivers."
*   **Carrier Copy:** ROI-heavy, outcome-driven, professional.
    *   *Example:* "Stop losing $500/day", "Pre-qualified drivers in 24 hours."

## 6. Animations
*   **Principle:** Use motion sparingly. Every animation must earn its place.
*   **Keyframes:** `fadeInUp` (Section reveals), `float` (Decorative elements), `animate-pulse` (AI icons).

## 7. Page Templates
*   **Dual Audience Landing:** Header, dual hero cards, how-it-works, stats, split benefits, optional content, application, CTA band, footer.
*   **Driver Recruitment:** Driver-emphasized hero, driver stats, benefits, how-it-works, application, CTA band.
*   **Carrier Partnership:** Carrier-emphasized hero, ROI stats, benefits, trust section, application, CTA band.
*   **Blog/Content:** Featured hero, content grid, optional category filters, CTA band.
*   **Confirmation/Thank You:** Simplified header, success message, next steps, CTA, footer.

## 8. Responsive Breakpoints
*   **Mobile:** default (no prefix)
*   **Tablet:** `md:` (768px+)
*   **Desktop:** `lg:` (1024px+)

## 9. SEO & Accessibility
*   **SEO:** One H1 per page, clear H2 section titles, H3 for cards/benefits.
*   **Accessibility:** WCAG AA contrast, visible focus states, descriptive alt text, semantic HTML.

## 10. Validation Checklist (Ship Gate)
*   Inter imported and applied globally.
*   Color tokens match palette exactly.
*   Drivers LEFT / Carriers RIGHT (dual layouts).
*   Yellow CTAs for driver actions; blue/dark CTAs for carrier actions.
*   Stats strip included for credibility.
*   Card radius min `rounded-xl` (hero `rounded-3xl`).
*   Hover states defined (shadow/scale).
*   Mobile responsive at `md` and `lg`.
*   Font Awesome CDN loaded for icons.
*   CTA band or strong closing section present.
