# Phase 3 Frontend Migration — Product Requirements Document

> **Addendum to:** `Conductor/tracks/gcp_migration_20260218/plan.md`
> **Phase context:** Cloud SQL migration is complete (24,826 records). `lmdr-api` Cloud Run service is deployed. Airtable fully disconnected. Phase 2 microservices are in progress. This addendum covers migrating the Wix frontend to Next.js 14 on Cloud Run.
> **GCP Project:** `ldmr-velocitymatch` — Region: `us-central1`
> **Date:** 2026-03-09
> **Implementation note (2026-03-10):** The `frontend/` directory already exists with Next.js project scaffolding, Dockerfile, and cloudbuild.yaml. Pages for all 5 surfaces (driver, recruiter, carrier, admin, b2b) are in progress.

---

## 1. Executive Summary

The LMDR platform currently serves all user-facing pages through Wix Editor — a hosted, closed-source page builder that limits rendering control, prevents Server-Side Rendering (SSR), and blocks custom build pipelines. As the platform migrates its backend to GCP (Phases 1 and 2), the frontend must follow.

This document specifies migrating all 23 Wix pages and 100+ static assets to a **Next.js 14 application** deployed on **Cloud Run**, served via **Cloud CDN**. The migration eliminates Wix's rendering constraints, establishes full control over Core Web Vitals, and positions the frontend as a standalone deployable service that communicates directly with the Phase 2 Cloud Run microservices.

**Key benefits over Wix:**

| Dimension | Wix (Current) | Next.js on Cloud Run (Target) |
|-----------|--------------|-------------------------------|
| SSR control | None (Wix manages rendering) | Full — per-page SSR / SSG / ISR |
| Build pipeline | None — Wix auto-deploys on publish | Cloud Build → Cloud Run (reviewable, rollbackable) |
| Core Web Vitals | Poor (Wix injects ~180KB JS overhead) | Targets LCP < 2.5s, CLS < 0.1 |
| API access | Wix `.jsw` functions only | Direct HTTPS to Phase 2 Cloud Run services |
| SEO | Limited metadata control via Wix SEO panel | Full `generateMetadata()` API, sitemap.ts, robots.ts |
| Testing | None (no local dev for Wix pages) | Jest, Playwright, Lighthouse CI |
| Cost at scale | Wix Premium plan (fixed, not usage-based) | Cloud Run (pay-per-request, autoscales to zero) |

---

## 2. Current State Pain Points

### 2.1 Wix Editor Limitations

- **No SSR control.** All Wix pages render client-side after a heavy JS bundle load. Dashboard pages that require auth-gated data (driver job board, carrier billing) fire API calls from the browser, exposing service endpoints in network tabs and delaying First Contentful Paint by 1–3 seconds.
- **Velo restrictions.** Wix Velo (the JavaScript layer) prohibits Node.js `fs`, `path`, and most npm packages. Any business logic must be shimmed through Wix's proprietary API surface.
- **No build step.** There is no bundler, no tree-shaking, no code splitting. Every page load fetches the full Wix runtime.
- **iframe HTML components.** Interactive UI (job cards, driver cards, maps) are implemented as inline HTML iframes served from GitHub CDN via jsDelivr. This is the current workaround for Wix JS restrictions but produces layout shift, cross-origin messaging latency, and fragile PostMessage bridges.
- **No Git-based deployment for pages.** Wix page code is stored in the Wix CMS, not in version control. Rolling back a page bug requires manually reverting in the Wix Editor.
- **One global publish.** Publishing any change to any page triggers a full-site publish in Wix — there is no per-page canary or staged rollout.

### 2.2 Performance Problems

- Lighthouse Mobile scores on key pages: Performance 32–48 (industry benchmark: >90).
- LCP exceeds 4s on the Home page due to hero image served without CDN sizing hints.
- CLS on Driver Dashboard: 0.38 (caused by late-loading iframe HTML components shifting layout).
- Wix injects 6–8 third-party scripts unconditionally on every page load regardless of whether the page uses them.

### 2.3 Developer Experience

- No local development server for page code. Changes must be tested on Wix's online editor or synced to a staging site.
- No TypeScript. All Wix Velo code is plain JavaScript with no type checking.
- No shared component library. Driver cards, carrier cards, and job cards are duplicated across multiple HTML component files.

---

## 3. Target Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Users (Browser)                          │
│   Drivers / Carriers / Admins / Marketing visitors             │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              Cloud Load Balancing (Global HTTPS LB)             │
│              app.lastmiledr.com → LB IP                        │
│              Google-managed SSL certificate                     │
│              HTTP → HTTPS redirect rule                         │
└──────────────┬──────────────────────────┬───────────────────────┘
               │                          │
               │ Dynamic requests         │ Static assets
               ▼                          ▼
┌──────────────────────────┐   ┌──────────────────────────────────┐
│  Cloud Run               │   │  Cloud CDN + Cloud Storage        │
│  Service: lmdr-frontend  │   │  Bucket: lmdr-static-assets       │
│  us-central1             │   │  Path: /_next/static/**           │
│  Next.js 14 (App Router) │   │       /images/**  /fonts/**       │
│  TypeScript              │   │  Cache: 1yr (content-hashed)      │
│  Memory: 1Gi, CPU: 1     │   │  CDN URL: NEXT_PUBLIC_CDN_URL     │
│  Min: 1 / Max: 10        │   └──────────────────────────────────┘
└──────────────┬───────────┘
               │ Internal VPC or HTTPS
               ▼
┌─────────────────────────────────────────────────────────────────┐
│              Phase 2 Cloud Run Microservices                    │
│  lmdr-driver-service      lmdr-carrier-service                 │
│  lmdr-job-service         lmdr-application-service             │
│  lmdr-compliance-service  lmdr-payment-service                 │
│  lmdr-notification-service lmdr-matching-service               │
│  lmdr-admin-service                                             │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  Cloud SQL (PostgreSQL 15)                                      │
│  ldmr-velocitymatch:us-central1:lmdr-postgres                  │
│  24,826+ records / lmdr DB                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Auth layer:** Firebase Auth (Phase 4). During Phase 3, auth guards are implemented as middleware stubs that read a `DISABLE_AUTH` env var. All protected pages render with a placeholder user session for development and staging.

**Real-time layer:** Firebase Realtime Database / WebSocket (Phase 4). During Phase 3, real-time UI components (NotificationBell, StatusTimeline) render static or polled data.

---

## 4. Page Inventory

All 23 Wix pages map to Next.js App Router routes as follows:

| # | Page Name | Current Wix URL | Next.js Route | Render Strategy | Auth Required | Phase 2 Service(s) |
|---|-----------|----------------|---------------|-----------------|---------------|--------------------|
| 1 | Home / Landing | `/` | `app/page.tsx` | SSG | No | — |
| 2 | About / Company | `/about` | `app/about/page.tsx` | SSG | No | — |
| 3 | Pricing | `/pricing` | `app/pricing/page.tsx` | SSG | No | — |
| 4 | Legal / Privacy | `/legal` | `app/legal/page.tsx` | SSG | No | — |
| 5 | Contact / Support | `/contact` | `app/contact/page.tsx` | SSG + Server Action | No | `lmdr-notification-service` |
| 6 | Driver Sign Up | `/driver-signup` | `app/(auth)/driver-signup/page.tsx` | SSR | No (public) | `lmdr-driver-service` |
| 7 | Driver Dashboard | `/driver-dashboard` | `app/(driver)/dashboard/page.tsx` | SSR | Driver | `lmdr-job-service`, `lmdr-application-service` |
| 8 | Driver Job Search | `/driver-jobs` | `app/(driver)/jobs/page.tsx` | SSR + Streaming | Driver | `lmdr-job-service` |
| 9 | Driver Job Detail | `/driver-jobs/[id]` | `app/(driver)/jobs/[jobId]/page.tsx` | SSR | Driver | `lmdr-job-service`, `lmdr-matching-service` |
| 10 | Driver Applications | `/driver-applications` | `app/(driver)/applications/page.tsx` | SSR | Driver | `lmdr-application-service` |
| 11 | Driver Compliance | `/driver-compliance` | `app/(driver)/compliance/page.tsx` | SSR | Driver | `lmdr-compliance-service` |
| 12 | Driver Payments | `/driver-payments` | `app/(driver)/payments/page.tsx` | SSR | Driver | `lmdr-payment-service` |
| 13 | Driver Profile | `/driver-profile` | `app/(driver)/profile/page.tsx` | SSR | Driver | `lmdr-driver-service` |
| 14 | Carrier Sign Up | `/carrier-signup` | `app/(auth)/carrier-signup/page.tsx` | SSR | No (public) | `lmdr-carrier-service` |
| 15 | Carrier Dashboard | `/carrier-dashboard` | `app/(carrier)/dashboard/page.tsx` | SSR | Carrier | `lmdr-carrier-service`, `lmdr-job-service` |
| 16 | Carrier Post Job | `/carrier-post-job` | `app/(carrier)/jobs/new/page.tsx` | SSR | Carrier | `lmdr-job-service` |
| 17 | Carrier Manage Jobs | `/carrier-jobs` | `app/(carrier)/jobs/page.tsx` | SSR | Carrier | `lmdr-job-service` |
| 18 | Carrier Driver Search | `/carrier-drivers` | `app/(carrier)/drivers/page.tsx` | SSR + Streaming | Carrier | `lmdr-matching-service`, `lmdr-driver-service` |
| 19 | Carrier Compliance | `/carrier-compliance` | `app/(carrier)/compliance/page.tsx` | SSR | Carrier | `lmdr-compliance-service` |
| 20 | Carrier Billing | `/carrier-billing` | `app/(carrier)/billing/page.tsx` | SSR | Carrier | `lmdr-payment-service` |
| 21 | Admin Dashboard | `/admin` | `app/(admin)/dashboard/page.tsx` | SSR | Admin | `lmdr-admin-service` |
| 22 | Admin Driver Mgmt | `/admin-drivers` | `app/(admin)/drivers/page.tsx` | SSR | Admin | `lmdr-admin-service`, `lmdr-driver-service` |
| 23 | Admin Carrier Mgmt | `/admin-carriers` | `app/(admin)/carriers/page.tsx` | SSR | Admin | `lmdr-admin-service`, `lmdr-carrier-service` |
| — | Admin Compliance | `/admin-compliance` | `app/(admin)/compliance/page.tsx` | SSR | Admin | `lmdr-compliance-service` |

**Rendering strategy definitions:**
- **SSG**: Built at deploy time. No server cost per request. Used for pages with no user-specific data.
- **SSR**: Rendered per request on the server. Data fetched server-side before HTML is sent.
- **SSR + Streaming**: SSR with React Suspense streaming — above-the-fold HTML ships first, data-heavy sections stream in. Used for search pages with geo-queries.
- **ISR** (Incremental Static Regeneration): SSG with a revalidation window. Not used in Phase 3 (reserved for Phase 4 carrier profile public pages).

---

## 5. Design System Migration

### 5.1 Brand Colors

The LMDR dual-brand system uses two primary accent colors:

| Token | Hex | Usage |
|-------|-----|-------|
| `driver-yellow` | `#F5C518` | Driver-facing surfaces, CTAs, badges, highlights |
| `carrier-blue` | `#1B3A6B` | Carrier-facing surfaces, nav, primary buttons |
| `neutral-dark` | `#0F172A` | Body text, headings |
| `neutral-mid` | `#64748B` | Secondary text, labels |
| `neutral-light` | `#F1F5F9` | Page backgrounds, card backgrounds |
| `success` | `#22C55E` | Verified badges, success states |
| `warning` | `#F59E0B` | Pending states, compliance warnings |
| `danger` | `#EF4444` | Error states, suspended badges |

### 5.2 Tailwind Configuration

The Wix CSS design tokens (currently scattered across per-page `<style>` blocks and `theme-styles.css`) are consolidated into a single `tailwind.config.ts`:

```ts
// frontend/tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        'driver-yellow': '#F5C518',
        'driver-yellow-dark': '#D4A017',
        'carrier-blue': '#1B3A6B',
        'carrier-blue-light': '#2E5FA3',
        'neutral-dark': '#0F172A',
        'neutral-mid': '#64748B',
        'neutral-light': '#F1F5F9',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

### 5.3 Typography

- **Primary font:** Inter (loaded via `next/font/google` — zero layout shift, self-hosted by Next.js)
- **Headings:** Inter 700–900
- **Body:** Inter 400–500
- **Monospace:** (payment amounts, IDs) — system monospace stack

### 5.4 Surface Branding

Per the existing CLAUDE.md surface branding rule:
- Driver surfaces (`(driver)` route group): LMDR branding, `driver-yellow` primary
- Carrier surfaces (`(carrier)` route group): VelocityMatch / carrier branding, `carrier-blue` primary
- Admin surfaces (`(admin)` route group): VelocityMatch branding, `carrier-blue` primary
- Marketing surfaces (`(marketing)` route group): Dual-brand hero, neutral palette

---

## 6. Routing Strategy

Next.js 14 App Router file-based routing replaces Wix's URL-to-page mapping:

```
frontend/src/app/
├── page.tsx                          → /
├── about/page.tsx                    → /about
├── pricing/page.tsx                  → /pricing
├── legal/page.tsx                    → /legal
├── contact/page.tsx                  → /contact
├── (marketing)/
│   └── layout.tsx                    → shared marketing header/footer
├── (auth)/
│   ├── driver-signup/page.tsx        → /driver-signup
│   └── carrier-signup/page.tsx       → /carrier-signup
├── (driver)/
│   ├── layout.tsx                    → driver shell + auth guard
│   ├── dashboard/page.tsx            → /dashboard (driver)
│   ├── jobs/
│   │   ├── page.tsx                  → /jobs
│   │   └── [jobId]/page.tsx          → /jobs/123
│   ├── applications/page.tsx         → /applications
│   ├── compliance/page.tsx           → /compliance
│   ├── payments/page.tsx             → /payments
│   └── profile/page.tsx              → /profile
├── (carrier)/
│   ├── layout.tsx                    → carrier shell + auth guard
│   ├── dashboard/page.tsx            → /carrier/dashboard
│   ├── jobs/
│   │   ├── page.tsx                  → /carrier/jobs
│   │   ├── new/page.tsx              → /carrier/jobs/new
│   │   └── [jobId]/page.tsx          → /carrier/jobs/123
│   ├── drivers/page.tsx              → /carrier/drivers
│   ├── compliance/page.tsx           → /carrier/compliance
│   └── billing/page.tsx              → /carrier/billing
├── (admin)/
│   ├── layout.tsx                    → admin shell + strict auth guard
│   ├── dashboard/page.tsx            → /admin
│   ├── drivers/page.tsx              → /admin/drivers
│   ├── carriers/page.tsx             → /admin/carriers
│   └── compliance/page.tsx           → /admin/compliance
└── api/
    └── health/route.ts               → GET /api/health
```

**Route group `(admin)` URL prefix:** Admin routes render under `/admin/*` in production via middleware rewrite.

---

## 7. API Integration Strategy

### 7.1 API Client

All frontend pages communicate with Phase 2 Cloud Run microservices through a typed API client at `src/lib/api.ts`. This client:

- Uses `fetch` with `next: { revalidate }` options for SSG/ISR pages
- Uses plain `fetch` (no cache) for SSR pages
- Reads the base URL for each service from environment variables
- Forwards Firebase Auth ID tokens in `Authorization: Bearer <token>` headers on all authenticated requests (Phase 4 — stub in Phase 3)

### 7.2 Service URL Environment Variables

```bash
# .env.production
LMDR_DRIVER_SERVICE_URL=https://lmdr-driver-service-<hash>-uc.a.run.app
LMDR_CARRIER_SERVICE_URL=https://lmdr-carrier-service-<hash>-uc.a.run.app
LMDR_JOB_SERVICE_URL=https://lmdr-job-service-<hash>-uc.a.run.app
LMDR_APPLICATION_SERVICE_URL=https://lmdr-application-service-<hash>-uc.a.run.app
LMDR_COMPLIANCE_SERVICE_URL=https://lmdr-compliance-service-<hash>-uc.a.run.app
LMDR_PAYMENT_SERVICE_URL=https://lmdr-payment-service-<hash>-uc.a.run.app
LMDR_NOTIFICATION_SERVICE_URL=https://lmdr-notification-service-<hash>-uc.a.run.app
LMDR_MATCHING_SERVICE_URL=https://lmdr-matching-service-<hash>-uc.a.run.app
LMDR_ADMIN_SERVICE_URL=https://lmdr-admin-service-<hash>-uc.a.run.app
```

Service URLs are mounted as Cloud Run secrets in production; they are not committed to the repository.

### 7.3 Server-Side vs Client-Side Fetching

| Context | Pattern | Auth header source |
|---------|---------|-------------------|
| SSG page build | `fetch(url, { cache: 'force-cache' })` at build time | None (public data only) |
| SSR page (`async` Server Component) | `fetch(url, { cache: 'no-store' })` | Firebase Admin SDK token (Phase 4 stub) |
| Client component (search, forms) | `fetch` in `useEffect` or Server Action | Firebase client SDK `getIdToken()` (Phase 4 stub) |
| Server Action (form submit) | Direct call inside `'use server'` action | Firebase Admin SDK token (Phase 4 stub) |

---

## 8. Auth Integration

### 8.1 Phase 3 Auth Strategy (Stubs)

Firebase Auth implementation is Phase 4. During Phase 3:

- `src/middleware.ts` reads a `DISABLE_AUTH=true` environment variable. When set, all protected routes pass without token validation.
- Protected layouts (`(driver)/layout.tsx`, `(carrier)/layout.tsx`, `(admin)/layout.tsx`) render a hardcoded mock session object for development.
- All API calls from the frontend to Phase 2 services include a static `Authorization: Bearer dev-token` header when `DISABLE_AUTH=true`.
- The middleware structure, route protection logic, and session context are fully implemented — they simply skip Firebase token verification until Phase 4 supplies real tokens.

### 8.2 Phase 4 Integration Points (Stubs to be Activated)

```ts
// src/middleware.ts — Phase 3 stub, Phase 4 activates real check
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (process.env.DISABLE_AUTH === 'true') return NextResponse.next();
  // Phase 4: verify Firebase ID token from cookie here
  // const token = request.cookies.get('firebase-token')?.value;
  // const decoded = await verifyFirebaseToken(token);
  return NextResponse.next();
}
```

### 8.3 Role-Based Access

Three roles gate three route groups:

| Role | Route group | Enforcement |
|------|-------------|-------------|
| `driver` | `(driver)` | Middleware checks token custom claim `role === 'driver'` |
| `carrier` | `(carrier)` | Middleware checks `role === 'carrier'` |
| `admin` | `(admin)` | Middleware checks `role === 'admin'` (strict — no elevation) |

---

## 9. Static Asset Strategy

### 9.1 Cloud Storage Bucket

A new GCS bucket `lmdr-static-assets` is provisioned in `us-central1`:
- Uniform bucket-level access enabled
- Public read access for CDN serving
- Versioning disabled (content-hashed filenames make versioning redundant)

### 9.2 Asset Categories and Cache Policy

| Asset type | Example paths | Cache-Control | CDN TTL |
|-----------|---------------|--------------|---------|
| Next.js static chunks | `/_next/static/**` | `public, max-age=31536000, immutable` | 1 year |
| Images (content-hashed) | `/images/hero-<hash>.webp` | `public, max-age=31536000, immutable` | 1 year |
| Fonts | `/fonts/inter-*.woff2` | `public, max-age=31536000, immutable` | 1 year |
| HTML (ISR pages) | `/` | `public, max-age=60, s-maxage=3600` | 1 hour |
| Favicon / robots.txt | `/favicon.ico`, `/robots.txt` | `public, max-age=86400` | 1 day |

### 9.3 Next.js Image Optimization

`next.config.js` configures the CDN URL as the image loader:

```js
module.exports = {
  images: {
    domains: ['storage.googleapis.com'],
    loader: 'custom',
    loaderFile: './src/lib/imageLoader.ts',
  },
  env: {
    NEXT_PUBLIC_CDN_URL: process.env.NEXT_PUBLIC_CDN_URL,
  },
};
```

### 9.4 Wix Asset Migration

100+ static assets from the current Wix site are migrated:
- HTML component templates (driver cards, job cards, carrier cards) → decomposed into Next.js Server Components
- CSS stylesheets → merged into Tailwind config and component-scoped CSS modules
- JavaScript widget files → reimplemented as React components (`JobCard`, `DriverCard`, Maps integration)
- Images / logos / hero images → converted to WebP, uploaded to `lmdr-static-assets` bucket
- JSON config files (feature flags, content config) → migrated to Secret Manager secrets and Next.js env vars

---

## 10. SEO Requirements

### 10.1 Metadata

Every page exports a `generateMetadata()` function (or static `metadata` object for SSG pages) supplying:
- `title` — page-specific, follows pattern `{Page Name} | LMDR - LastMileDR`
- `description` — 120–160 character summary of page content
- `openGraph.title`, `openGraph.description`, `openGraph.image` — for social sharing
- `openGraph.type` — `website` for marketing pages, `article` for blog/legal

### 10.2 Technical SEO

- `app/sitemap.ts` — dynamically generated XML sitemap, submitted to Google Search Console
- `app/robots.ts` — `robots.txt` disallowing `/admin/*`, `/(driver)/*`, `/(carrier)/*`, `/(auth)/*`
- Canonical URLs set via `alternates.canonical` in metadata
- Structured data (JSON-LD) on the Home page (Organization schema) and Pricing page (Product schema)

### 10.3 Performance Impact on SEO

SSG for all marketing pages ensures Googlebot receives fully-rendered HTML on first request (no client-side hydration needed for indexable content). Core Web Vitals compliance (LCP < 2.5s) directly supports Google ranking signals.

---

## 11. Performance Targets

| Metric | Target | Measurement method |
|--------|--------|--------------------|
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse CI (mobile simulated 4G) |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse CI |
| FID / INP (Interaction to Next Paint) | < 100ms | Web Vitals library (client-side) |
| TTFB (Time to First Byte) — SSR pages | < 500ms | Cloud Run cold start budget |
| JS bundle size (initial, gzipped) | < 150KB | next build output |
| Image payload per page (home) | < 200KB | WebP + lazy load |
| Lighthouse Performance score (mobile) | > 85 | Lighthouse CI in Cloud Build |

Performance budgets are enforced in `next.config.js` via `experimental.bundlePagesExternals` and a custom webpack `performance.maxAssetSize` setting. Lighthouse CI will fail the Cloud Build pipeline if scores drop below threshold.

---

## 12. Progressive Migration Strategy

The Wix site remains live and canonical throughout Phase 3. The new Next.js frontend is deployed behind a feature flag and traffic is cut over page-by-page.

### 12.1 Feature Flag

A Secret Manager secret `FRONTEND_CUTOVER_PHASE` controls routing:

| Value | Behavior |
|-------|---------|
| `wix` | All traffic routes to Wix (default at Phase 3 start) |
| `split` | Marketing pages route to Cloud Run; dashboard pages route to Wix |
| `cloudrun` | All traffic routes to Cloud Run (final state) |

The Load Balancer uses URL map rules to route based on path prefix. The `FRONTEND_CUTOVER_PHASE` value is read by a Cloud Run gateway service (or by `middleware.ts` if using a redirect approach) to determine which origin to serve.

### 12.2 Cutover Order

1. **Marketing pages** (`/`, `/about`, `/pricing`, `/legal`, `/contact`) — lowest risk, no auth, SSG
2. **Auth flows** (`/driver-signup`, `/carrier-signup`) — standalone forms, minimal backend dependency
3. **Driver dashboards** (all `/(driver)/*` pages) — requires Phase 2 driver/job/application services
4. **Carrier dashboards** (all `/(carrier)/*` pages) — requires Phase 2 carrier/job/payment services
5. **Admin dashboard** (all `/(admin)/*` pages) — internal only, cut over last

Each group has a smoke test checklist that must pass before DNS cutover proceeds (see Task 12 in PLAN.md).

### 12.3 DNS Cutover Procedure

1. Lower Wix DNS TTL to 60 seconds 24 hours before planned cutover
2. Deploy Cloud Run `lmdr-frontend` service and verify health check at `GET /api/health`
3. Update Load Balancer URL map to point target path prefix to Cloud Run backend
4. Monitor Cloud Run error rate and response time in Cloud Monitoring for 15 minutes
5. If clean: proceed. If errors: revert URL map to Wix origin (< 5 minutes)

---

## 13. Rollback Strategy

**Trigger:** Any of the following within 30 minutes of DNS cutover:
- Cloud Run error rate > 1% on any page group
- LCP > 5s on Lighthouse synthetic test
- User-reported broken auth flow

**Rollback procedure:**
1. In Cloud Console Load Balancing → URL Maps: revert the path prefix rule to point to Wix origin
2. DNS propagation is immediate (Wix origin is still live, just not receiving traffic)
3. Total rollback time: < 5 minutes
4. Wix requires zero changes — it continues serving as if it were primary

**Post-rollback:** Investigate Cloud Run logs in Cloud Logging (`lmdr-frontend` service filter), fix the issue, re-deploy, re-run smoke tests, re-attempt cutover.

---

## 14. Out of Scope (Phase 3)

The following are explicitly excluded from this phase and are planned for later phases:

| Item | Phase |
|------|-------|
| Firebase Auth implementation (login, session management, token refresh) | Phase 4 |
| Real-time notifications (Firebase Realtime DB / WebSockets) | Phase 4 |
| File upload (driver document upload to Cloud Storage) | Phase 4 |
| Mobile app (React Native or PWA shell) | Post-Phase 4 |
| Business logic rewrite (Phase 2 microservices) | Phase 2 |
| BigQuery analytics dashboard | Separate track |
| Email/SMS notification service | Separate track |
| A/B testing framework | Post-launch |

---

## 15. Success Criteria

Phase 3 is complete when all of the following are true:

| Criterion | Measurement |
|-----------|------------|
| All 23 pages deployed to `lmdr-frontend` Cloud Run service | `gcloud run services describe lmdr-frontend` shows all routes healthy |
| All marketing pages score Lighthouse Performance > 85 (mobile) | Lighthouse CI in Cloud Build passes |
| LCP < 2.5s on Home page (Lighthouse simulated mobile 4G) | Lighthouse CI report |
| CLS < 0.1 on Driver Dashboard | Lighthouse CI report |
| All 23 pages pass smoke test checklist | Smoke test checklist signed off per page group |
| DNS fully cut over to Cloud Run (`FRONTEND_CUTOVER_PHASE=cloudrun`) | `dig app.lastmiledr.com` resolves to LB IP |
| Wix site offline / redirect-only | Wix dashboard set to redirect mode |
| Zero P0 console errors across 5 critical paths | Evidence Pack DevTools run passes (`quality_gate.json: pass: true`) |
| `sitemap.xml` submitted and indexed in Google Search Console | Search Console Coverage report |
| Cloud Build pipeline passes on every merge to `main` | Cloud Build history |
| `metadata.json` `status` updated to `COMPLETE` | `metadata.json` in this track |

---

*End of PRD — Phase 3 Frontend Migration*


---

## Section 16 — Canonical Page-to-HTML Source Registry

### 16.1 Purpose

This section is the authoritative, implementation-binding mapping between the **Wix `src/pages/` folder** (the source of truth for which pages exist on the live platform) and their corresponding **static HTML source files** in `src/public/`. It supersedes the planning-level page inventory in Section 4 wherever the two differ.

**Scope boundary (critical):** The project contains 158+ HTML files across `src/public/`. The vast majority were built under the old CDN/jsDelivr iframe-embedded architecture and are **explicitly excluded from the GCP migration**. Only the 22 pages listed below — each correlating to a JS file in `src/pages/` — are in scope. All other HTML files in `src/public/` are legacy artifacts and will not be served from GCP.

---

### 16.2 Excluded Files in `src/pages/`

The following files exist in the pages folder but are **not** migrated:

| File | Reason Excluded |
|---|---|
| `masterPage.js` | Wix global page template — no direct Next.js equivalent |
| `README.md` | Documentation only |
| `RECRUITER_OS.zriuj.js.bak` | Backup of `RECRUITER_OS.zriuj.js` — not a page |

---

### 16.3 Canonical Page-to-HTML Source Registry (22 Pages)

| # | Wix Pages File | HTML Source File | Source Dir (under `src/public/`) | Next.js App Router Route | URL Slug | Render Strategy |
|---|---|---|---|---|---|---|
| 1 | `HOME.c1dmp.js` | `Homepage.HTML` | `landing/` | `app/(marketing)/page.tsx` | `/` | SSG |
| 2 | `ABOUT.dkz1k.js` | `About_page.html` | `landing/` | `app/(marketing)/about/page.tsx` | `/about` | SSG |
| 3 | `PRICING.o5c9o.js` | `CDL Driver Recruitment Pricing.html` | `landing/` | `app/(marketing)/pricing/page.tsx` | `/pricing` | SSG |
| 4 | `TRUCK DRIVERS.gsx0g.js` | `Truck_Driver_Page.html` | `landing/` | `app/(marketing)/drivers/page.tsx` | `/drivers` | SSG |
| 5 | `ALLURE Refrigerated-Premium Opportunity.bg2us.js` | `ALLURE Refrigerated-Premium Opportunity.html` | `landing/` | `app/(marketing)/allure-refrigerated/page.tsx` | `/allure-refrigerated` | SSG |
| 6 | `PRIVACY POLICY.cb4ub.js` | *(text-only — no static HTML source)* | — | `app/(marketing)/privacy-policy/page.tsx` | `/privacy-policy` | SSG (MDX or inline) |
| 7 | `INSIGHTS.b06oz.js` | *(dynamic listing — no static HTML source)* | — | `app/(marketing)/insights/page.tsx` | `/insights` | ISR |
| 8 | `Post.vjkjy.js` | *(dynamic CMS item — no static HTML source)* | — | `app/(marketing)/insights/[slug]/page.tsx` | `/insights/[slug]` | ISR |
| 9 | `AI - MATCHING.rof4w.js` | `AI_MATCHING.html` | `driver/` | `app/(driver)/ai-matching/page.tsx` | `/ai-matching` | SSR |
| 10 | `DRIVER_OS.nd0gp.js` | `DriverOS.html` | `driver/` | `app/(driver)/driver/page.tsx` | `/driver` | SSR |
| 11 | `Driver Opportunities - Your Next Career .lb0uy.js` | `Driver Opportunities - Your Next Career.html` | `driver/` | `app/(driver)/jobs/page.tsx` | `/jobs` | ISR |
| 12 | `Driver Jobs (Item).s0js1.js` | `Driver Jobs.html` | `driver/` | `app/(driver)/jobs/[jobId]/page.tsx` | `/jobs/[jobId]` | ISR |
| 13 | `CARRIER_OS.cbszn.js` | `Carrier_Welcome.html` | `carrier/` | `app/(carrier)/carrier/page.tsx` | `/carrier` | SSR |
| 14 | `RECRUITER_OS.zriuj.js` | `RecruiterOS.html` | `recruiter/os/` | `app/(admin)/recruiter/page.tsx` | `/recruiter` | SSR |
| 15 | `ADMIN_OS.g9bjq.js` | `AdminOS.html` | `admin/os/` | `app/(admin)/admin/page.tsx` | `/admin` | SSR |
| 16 | `B2B_OS.nt4hm.js` | `B2B_DASHBOARD.html` | `admin/` | `app/(admin)/admin/b2b/page.tsx` | `/admin/b2b` | SSR |
| 17 | `DEV_OS.upto8.js` | *(no static HTML — tooling/dev UI only)* | — | `app/(admin)/dev/page.tsx` | `/dev` | SSR |
| 18 | `Member Page.k40gh.js` | *(Wix member area — replaced by role-based OS routing)* | — | *(redirect to role-specific OS on login)* | `/member` → redirect | N/A (deprecated) |
| 19 | `Checkout.kbyzk.js` | `STRIPE_PAYMENT_ELEMENT.html` | `utility/` | `app/(marketing)/checkout/page.tsx` | `/checkout` | SSR |
| 20 | `PLACEMENT_SUCCESS.tz647.js` | `Placement_Success.html` | `utility/` | `app/(marketing)/placement-success/page.tsx` | `/placement-success` | SSG |
| 21 | `SUBSCRIPTION SUCCESS.o76p8.js` | `Subscription_Success.html` | `utility/` | `app/(marketing)/subscription/success/page.tsx` | `/subscription/success` | SSG |
| 22 | `SUBSCRIPTION_CANCELED.exqj3.js` | `Subscription_Canceled.html` | `utility/` | `app/(marketing)/subscription/canceled/page.tsx` | `/subscription/canceled` | SSG |

---

### 16.4 HTML Files Explicitly Excluded from Migration (Legacy CDN Artifacts)

The following directories contain HTML files that were purpose-built for the old jsDelivr CDN / Wix iframe-embedded architecture. **None of these are migrated.** They are listed here for clarity so implementors do not accidentally port them:

| Directory | Example Files (not exhaustive) | Architecture |
|---|---|---|
| `src/public/landing/` (non-registry) | `AI vs Traditional.html`, `ALLURE Onboarding.html`, `Apply for CDL.html`, `CDL Class A.html`, `DOT Compliance.html`, `Home Nightly.html`, `Last Mile Staffing.html`, `OTR Truck Driver Placement.html`, `Quick Apply.html`, `Rapid Response.html`, `48-Hour CDL.html`, `Unified_Recruiter_Pricing.html`, `lmdr-cdl-driver-landing-iframe-optimized.html` | Legacy CDN iframe |
| `src/public/driver/` (non-registry) | `DRIVER_DASHBOARD.html`, `CHALLENGES.html`, `DRIVER_APPLICATIONS.html`, `DRIVER_EARNINGS.html`, `DRIVER_PROFILE.html`, + ~10 others | Legacy CDN iframe |
| `src/public/carrier/` (non-registry) | `Trucking Companies.html`, `CARRIER_APPLICATIONS.html`, `CARRIER_BILLING.html`, + ~10 others | Legacy CDN iframe |
| `src/public/recruiter/` (non-registry) | `LMDR_Recruiter_OS_v4.html`, `RECRUITER_PIPELINE.html`, `RECRUITER_ANALYTICS.html`, + ~17 others | Legacy CDN iframe |
| `src/public/admin/` (non-registry) | `ADMIN_DASHBOARD.html`, `ADMIN_ANALYTICS.html`, `ADMIN_USERS.html`, + ~32 others | Legacy CDN iframe |
| `src/public/utility/` (non-registry) | All utility files not in the registry above | Legacy CDN iframe |
| `src/public/collateral/` | `LMDR-Placement-Service-Carrier-OnePager.html` | Static collateral |

> **Decision:** These files may be archived or deleted once the GCP platform is live and all traffic has been cutover. They should not be referenced in any Next.js route, API handler, or CDN configuration.

---

### 16.5 URL Slug Hosting Requirements

All 22 routes in Section 16.3 must be reachable via GCP Cloud CDN / Cloud Run with the following requirements:

1. **Root domain routing:** `/` must resolve to the home page (no redirect to `/home`).
2. **Dynamic segments:** `/insights/[slug]` and `/jobs/[jobId]` must be handled by Cloud Run SSR; static fallbacks via ISR cache on CDN.
3. **Trailing slash normalization:** All slugs without trailing slashes. Set `trailingSlash: false` in `next.config.js`.
4. **`/member` redirect:** The Wix member page has no GCP equivalent. Implement a permanent 301 redirect from `/member` to the user's appropriate OS route based on role: driver -> `/driver`, carrier -> `/carrier`, recruiter -> `/recruiter`, admin -> `/admin`. If role cannot be determined pre-auth, redirect to `/login`.
5. **`/dev` access control:** The `/dev` route must be protected behind admin-role auth middleware. It is never publicly accessible.
6. **Checkout & subscription routes:** `/checkout`, `/subscription/success`, `/subscription/canceled` must be HTTPS-only with `Strict-Transport-Security` headers; no CDN caching of these pages.
7. **Static HTML source files as implementation reference only:** The HTML files listed in Section 16.3 are the UI source of truth for their respective pages. They are ported to Next.js components -- they are **not** served as raw HTML from GCP. The CDN/Cloud Run serves Next.js-rendered output only.

---

*Appended to PRD -- Phase 3 Frontend Migration | Session: gcp_migration_20260218*