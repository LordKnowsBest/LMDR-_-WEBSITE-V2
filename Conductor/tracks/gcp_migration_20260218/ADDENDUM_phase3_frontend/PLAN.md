# Phase 3 Frontend Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Migrate all 23 LMDR Wix pages and 100+ static assets to a Next.js 14 application deployed on Cloud Run (`lmdr-frontend`) behind Cloud CDN and a Global HTTPS Load Balancer.

**GCP Project:** `ldmr-velocitymatch` — Region: `us-central1`

**Working directory for all commands:** `C:\Users\nolan\LMDR_WEBSITE_V2\LMDR-_-WEBSITE-V2\frontend\`
(create this folder in Task 1 — it is a sibling of `src/` and `cloud-run-api/`)

**Tech Stack:** Next.js 14 (App Router), TypeScript 5, Tailwind CSS 3, Zod, React 18

**Estimated total effort:** 6–8 weeks

---

## Manual Setup Checklist — Complete Before Running Any Task

The following items cannot be automated and must be done by Levy before a fresh Claude session executes this plan. Each is marked `[MANUAL]`.

| # | What | Where | Status |
|---|------|--------|--------|
| M1 | Confirm `lmdr-api` Cloud Run service is healthy | `gcloud run services describe lmdr-api --region us-central1` | ☐ |
| M2 | Confirm Phase 2 microservice URLs are known or placeholders documented | Phase 2 PLAN.md | ☐ |
| M3 | Create GCS bucket `lmdr-static-assets` in `us-central1` | Cloud Console → Cloud Storage | ☐ |
| M4 | Enable Cloud CDN on the bucket | Cloud Console → Cloud CDN | ☐ |
| M5 | Create Cloud Run service account `lmdr-frontend-sa` | IAM & Admin → Service Accounts | ☐ |
| M6 | Grant `lmdr-frontend-sa` roles: `roles/secretmanager.secretAccessor`, `roles/storage.objectViewer` | IAM | ☐ |
| M7 | Run `gcloud auth configure-docker us-central1-docker.pkg.dev` | Terminal | ☐ |
| M8 | Confirm Google Maps API key is available in Secret Manager as `lmdr-maps-api-key` | Secret Manager | ☐ |
| M9 | Export Wix static assets (images, logos, HTML templates) to `wix-export/` directory | Wix Dashboard → Site History | ☐ |

---

## Task 1: Next.js Project Scaffold

> **Estimated effort:** 1–2 days
> **Goal:** Bootstrap a production-ready Next.js 14 project with LMDR brand config, API client, base components, middleware stubs, Docker, and CI/CD.

### 1.1 Initialize the Next.js App

From the repo root (`C:\Users\nolan\LMDR_WEBSITE_V2\LMDR-_-WEBSITE-V2\`):

```bash
npx create-next-app@14 frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --no-eslint \
  --import-alias "@/*"
```

Verify the scaffold:

```bash
cd frontend
ls src/app/
# Expected: layout.tsx  page.tsx  globals.css
```

### 1.2 Install Core Dependencies

```bash
cd frontend
npm install zod react-hook-form @hookform/resolvers
npm install @googlemaps/js-api-loader
npm install clsx tailwind-merge
npm install -D @types/google.maps
```

### 1.3 Configure Tailwind with LMDR Brand Tokens

Replace `frontend/tailwind.config.ts` with:

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'driver-yellow':      '#F5C518',
        'driver-yellow-dark': '#D4A017',
        'driver-yellow-light':'#FDF3C0',
        'carrier-blue':       '#1B3A6B',
        'carrier-blue-light': '#2E5FA3',
        'carrier-blue-pale':  '#E8EFF9',
        'neutral-dark':       '#0F172A',
        'neutral-mid':        '#64748B',
        'neutral-light':      '#F1F5F9',
        'neutral-border':     '#E2E8F0',
        'status-active':      '#22C55E',
        'status-pending':     '#F59E0B',
        'status-verified':    '#3B82F6',
        'status-suspended':   '#EF4444',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
      },
    },
  },
  plugins: [],
};

export default config;
```

### 1.4 Set Up Environment Variable Files

Create `frontend/.env.local` (for local dev — gitignored):

```bash
# Phase 2 Cloud Run service URLs (use placeholder until Phase 2 deploys)
LMDR_DRIVER_SERVICE_URL=http://localhost:3001
LMDR_CARRIER_SERVICE_URL=http://localhost:3002
LMDR_JOB_SERVICE_URL=http://localhost:3003
LMDR_APPLICATION_SERVICE_URL=http://localhost:3004
LMDR_COMPLIANCE_SERVICE_URL=http://localhost:3005
LMDR_PAYMENT_SERVICE_URL=http://localhost:3006
LMDR_NOTIFICATION_SERVICE_URL=http://localhost:3007
LMDR_MATCHING_SERVICE_URL=http://localhost:3008
LMDR_ADMIN_SERVICE_URL=http://localhost:3009

# CDN
NEXT_PUBLIC_CDN_URL=https://storage.googleapis.com/lmdr-static-assets

# Auth (Phase 3: stubs)
DISABLE_AUTH=true

# Maps
NEXT_PUBLIC_MAPS_API_KEY=your-dev-key-here

# GCP
GCP_PROJECT_ID=ldmr-velocitymatch
```

Create `frontend/.env.production` (values injected by Cloud Run secrets at deploy time — commit file with empty values):

```bash
LMDR_DRIVER_SERVICE_URL=
LMDR_CARRIER_SERVICE_URL=
LMDR_JOB_SERVICE_URL=
LMDR_APPLICATION_SERVICE_URL=
LMDR_COMPLIANCE_SERVICE_URL=
LMDR_PAYMENT_SERVICE_URL=
LMDR_NOTIFICATION_SERVICE_URL=
LMDR_MATCHING_SERVICE_URL=
LMDR_ADMIN_SERVICE_URL=
NEXT_PUBLIC_CDN_URL=
DISABLE_AUTH=false
NEXT_PUBLIC_MAPS_API_KEY=
GCP_PROJECT_ID=ldmr-velocitymatch
```

Add `.env.local` to `.gitignore`.

### 1.5 Create the Typed API Client

Create `frontend/src/lib/api.ts`:

```ts
// src/lib/api.ts
// Typed API client for all Phase 2 Cloud Run microservices.
// All functions are safe to call from Server Components (SSR/SSG) and Server Actions.

type RequestOptions = {
  token?: string;
  revalidate?: number | false;
};

async function apiFetch<T>(
  serviceUrl: string,
  path: string,
  options: RequestInit & RequestOptions = {}
): Promise<T> {
  const { token, revalidate, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${serviceUrl}${path}`, {
    ...fetchOptions,
    headers,
    next: revalidate !== undefined ? { revalidate } : { revalidate: 0 },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status} from ${serviceUrl}${path}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// Service URL helpers (read from env at runtime — safe for Server Components)
const urls = {
  driver:      () => process.env.LMDR_DRIVER_SERVICE_URL!,
  carrier:     () => process.env.LMDR_CARRIER_SERVICE_URL!,
  job:         () => process.env.LMDR_JOB_SERVICE_URL!,
  application: () => process.env.LMDR_APPLICATION_SERVICE_URL!,
  compliance:  () => process.env.LMDR_COMPLIANCE_SERVICE_URL!,
  payment:     () => process.env.LMDR_PAYMENT_SERVICE_URL!,
  notification:() => process.env.LMDR_NOTIFICATION_SERVICE_URL!,
  matching:    () => process.env.LMDR_MATCHING_SERVICE_URL!,
  admin:       () => process.env.LMDR_ADMIN_SERVICE_URL!,
};

export const api = { urls, apiFetch };
```

Add per-service typed modules as needed (e.g., `src/lib/api/drivers.ts`, `src/lib/api/jobs.ts`) during each task.

### 1.6 Create Auth Middleware Stub

Create `frontend/src/middleware.ts`:

```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard', '/jobs', '/applications', '/compliance',
  '/payments', '/profile',
  '/carrier',
  '/admin',
];

export function middleware(request: NextRequest) {
  // Phase 3: Auth disabled. Phase 4 will replace this with Firebase token verification.
  if (process.env.DISABLE_AUTH === 'true') {
    return NextResponse.next();
  }
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p));
  if (isProtected) {
    // Phase 4: check Firebase token from cookie here
    // const token = request.cookies.get('firebase-token')?.value;
    // if (!token) return NextResponse.redirect(new URL('/driver-signup', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/health).*)'],
};
```

### 1.7 Create Health Check API Route

Create `frontend/src/app/api/health/route.ts`:

```ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'lmdr-frontend',
    version: process.env.NEXT_PUBLIC_VERSION ?? 'dev',
    timestamp: new Date().toISOString(),
  });
}
```

### 1.8 Set Up Base Component Directory

```bash
mkdir -p frontend/src/components/ui
mkdir -p frontend/src/components/maps
mkdir -p frontend/src/components/layout
```

### 1.9 Configure `next.config.js`

Replace `frontend/next.config.js` with:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['storage.googleapis.com'],
  },
  experimental: {
    serverComponentsExternalPackages: [],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.performance = {
        maxAssetSize: 250000,
        maxEntrypointSize: 400000,
        hints: 'warning',
      };
    }
    return config;
  },
};

module.exports = nextConfig;
```

The `output: 'standalone'` setting produces a minimal Docker image (copies only required files).

### 1.10 Write the Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

Create `frontend/.dockerignore`:

```
node_modules
.next
.env.local
*.log
```

### 1.11 Write `cloudbuild.yaml`

Create `frontend/cloudbuild.yaml`:

```yaml
steps:
  # Build Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'us-central1-docker.pkg.dev/ldmr-velocitymatch/lmdr-repo/lmdr-frontend:$COMMIT_SHA'
      - '-t'
      - 'us-central1-docker.pkg.dev/ldmr-velocitymatch/lmdr-repo/lmdr-frontend:latest'
      - '-f'
      - 'frontend/Dockerfile'
      - 'frontend'

  # Push image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - 'us-central1-docker.pkg.dev/ldmr-velocitymatch/lmdr-repo/lmdr-frontend:$COMMIT_SHA'

  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'lmdr-frontend'
      - '--image=us-central1-docker.pkg.dev/ldmr-velocitymatch/lmdr-repo/lmdr-frontend:$COMMIT_SHA'
      - '--region=us-central1'
      - '--service-account=lmdr-frontend-sa@ldmr-velocitymatch.iam.gserviceaccount.com'
      - '--memory=1Gi'
      - '--cpu=1'
      - '--min-instances=1'
      - '--max-instances=10'
      - '--port=3000'
      - '--allow-unauthenticated'
      - '--update-secrets=LMDR_DRIVER_SERVICE_URL=lmdr-driver-service-url:latest'
      - '--update-secrets=NEXT_PUBLIC_MAPS_API_KEY=lmdr-maps-api-key:latest'

  # Run Lighthouse CI
  - name: 'node:20'
    entrypoint: 'npx'
    args: ['lhci', 'autorun']
    dir: 'frontend'
    env:
      - 'LHCI_BUILD_CONTEXT__CURRENT_HASH=$COMMIT_SHA'

images:
  - 'us-central1-docker.pkg.dev/ldmr-velocitymatch/lmdr-repo/lmdr-frontend:$COMMIT_SHA'
  - 'us-central1-docker.pkg.dev/ldmr-velocitymatch/lmdr-repo/lmdr-frontend:latest'

options:
  logging: CLOUD_LOGGING_ONLY
```

**Checklist:**
- [ ] `npx create-next-app@14 frontend --typescript --tailwind --app --src-dir` runs successfully
- [ ] `npm run dev` starts without errors
- [ ] `GET /api/health` returns `{ status: 'ok' }` locally
- [ ] `Dockerfile` builds locally: `docker build -t lmdr-frontend . -f frontend/Dockerfile frontend`
- [ ] Tailwind brand colors resolve in browser dev tools

---

## Task 2: Marketing Pages (SSG)

> **Estimated effort:** 2–3 days
> **Goal:** Build all 5 marketing pages as statically generated routes with full SEO metadata.

### 2.1 Marketing Layout

Create `frontend/src/app/(marketing)/layout.tsx`:
- Renders shared `<Header>` (logo + nav links: Home, Pricing, About, Contact, Sign Up CTAs)
- Renders shared `<Footer>` (links, legal, social icons)
- Uses `carrier-blue` for nav, `driver-yellow` accents on CTAs

### 2.2 Home / Landing Page

File: `frontend/src/app/page.tsx`
- Hero section: dual CTA — "Find Driving Jobs" (driver yellow) and "Post a Job" (carrier blue)
- Value prop section: 3-column grid (speed, compliance, pay transparency)
- Stats bar: animated counters (driver count, carrier count, jobs posted)
- Testimonials strip
- Final CTA section

```ts
export const metadata = {
  title: 'LMDR — LastMileDR | CDL Driver Recruiting Marketplace',
  description: 'Connect CDL truck drivers with verified carriers. Search jobs, submit compliance docs, and get hired faster.',
  openGraph: {
    title: 'LMDR — LastMileDR',
    description: 'CDL Driver Recruiting Marketplace',
    images: [`${process.env.NEXT_PUBLIC_CDN_URL}/images/og-home.jpg`],
  },
};
```

### 2.3 About Page

File: `frontend/src/app/about/page.tsx`
- Company mission section
- Team grid (static data — sourced from content file, not API)
- Brand story timeline

### 2.4 Pricing Page

File: `frontend/src/app/pricing/page.tsx`
- 3-tier pricing table (Starter, Growth, Enterprise) — carrier-facing
- Feature comparison table
- FAQ accordion

### 2.5 Legal / Privacy Page

File: `frontend/src/app/legal/page.tsx`
- Tabbed layout: Terms of Service | Privacy Policy | Cookie Policy
- Static Markdown content rendered via `remark` or `next-mdx-remote`
- Last updated date per tab

### 2.6 Contact / Support Page

File: `frontend/src/app/contact/page.tsx`
- Contact form (name, email, subject, message) — submitted via Server Action to `lmdr-notification-service`
- Support ticket categories (driver support, carrier support, billing, general)
- Zod validation on form fields

### 2.7 Sitemap and Robots

Create `frontend/src/app/sitemap.ts`:

```ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://app.lastmiledr.com', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://app.lastmiledr.com/about', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: 'https://app.lastmiledr.com/pricing', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: 'https://app.lastmiledr.com/legal', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://app.lastmiledr.com/contact', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];
}
```

Create `frontend/src/app/robots.ts`:

```ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/about', '/pricing', '/legal', '/contact'],
      disallow: ['/admin/', '/driver-signup', '/carrier-signup', '/dashboard', '/carrier/', '/jobs', '/applications'],
    },
    sitemap: 'https://app.lastmiledr.com/sitemap.xml',
  };
}
```

**Checklist:**
- [ ] All 5 marketing pages render with `npm run build && npm start`
- [ ] `curl https://localhost:3000/sitemap.xml` returns valid XML
- [ ] `curl https://localhost:3000/robots.txt` disallows `/admin/`
- [ ] Home page Lighthouse Performance (mobile) > 85 locally

---

## Task 3: Driver Sign Up Flow

> **Estimated effort:** 2 days
> **Goal:** Implement the multi-step driver registration form with Zod validation and `lmdr-driver-service` integration.

### 3.1 Driver Sign Up Page

File: `frontend/src/app/(auth)/driver-signup/page.tsx`

Multi-step form with 4 steps, managed via React Context:
- **Step 1: Personal Info** — first name, last name, email, phone, home state
- **Step 2: CDL Info** — CDL class (A/B/C), endorsements (multi-select), years experience, freight preference
- **Step 3: Documents** — file upload placeholders (actual upload is Phase 4). Step renders `FileUploadZone` component with a "documents will be requested after signup" message.
- **Step 4: Review** — summary of entered data, submit button

State management: `React.createContext` + `useReducer` in `DriverSignupProvider`.

Zod schema per step — each step validates independently before advancing.

On final submit: `POST /drivers` to `lmdr-driver-service`.

API call:

```ts
// src/lib/api/drivers.ts
import { api } from '@/lib/api';
import type { CreateDriverPayload, DriverProfile } from '@/types/driver';

export async function createDriver(payload: CreateDriverPayload): Promise<DriverProfile> {
  return api.apiFetch<DriverProfile>(
    api.urls.driver(),
    '/drivers',
    { method: 'POST', body: JSON.stringify(payload) }
  );
}
```

Error handling: show inline field errors from API (422 validation errors), toast for 500 errors.

### 3.2 Auth Layout

Create `frontend/src/app/(auth)/layout.tsx`:
- Minimal layout — logo, no nav, no footer
- Centered card container
- Dual-brand: shows LMDR logo for driver-signup, VelocityMatch logo for carrier-signup (detected by pathname)

**Checklist:**
- [ ] Step 1 → 2 → 3 → 4 navigation works with back/forward
- [ ] Zod errors show inline below each field
- [ ] Submit fires `POST /drivers` (verified in Network tab with mock service)
- [ ] Form clears on successful submission and shows success screen

---

## Task 4: Driver Dashboard Pages

> **Estimated effort:** 4–5 days
> **Goal:** Build all 8 driver-facing dashboard pages behind auth guard.

### 4.1 Driver Shell Layout

File: `frontend/src/app/(driver)/layout.tsx`
- Left sidebar nav (collapsible on mobile): Dashboard, Find Jobs, Applications, Compliance, Payments, Profile
- Top bar: LMDR logo, user avatar (Phase 4 stub: initials only), notification bell (Phase 4 stub)
- Auth guard: if `DISABLE_AUTH=false` and no valid session → redirect to `/driver-signup`
- `driver-yellow` accent on active nav item

### 4.2 Driver Dashboard

File: `frontend/src/app/(driver)/dashboard/page.tsx`
- Quick stats strip: Active Applications, Jobs Available Near You, Compliance Items Pending, Last Payout
- Recent job listings grid (4 cards) — from `lmdr-job-service GET /jobs?limit=4&near={lat},{lng}`
- Active applications list (top 3) — from `lmdr-application-service GET /applications?status=active&limit=3`
- Compliance alert banner if any items are overdue

### 4.3 Driver Job Search

File: `frontend/src/app/(driver)/jobs/page.tsx`
- Search bar (keyword) + geo-filter (city/zip radius slider) + freight type filter
- Results grid — `JobCard` components
- Map view toggle (Google Maps with job pins) — `src/components/maps/JobMap.tsx`
- Streaming: above-the-fold search bar renders immediately; job results stream in via React Suspense
- Pagination with `useSearchParams` for URL-persisted filter state

### 4.4 Driver Job Detail

File: `frontend/src/app/(driver)/jobs/[jobId]/page.tsx`
- Fetches job via `lmdr-job-service GET /jobs/:jobId` (SSR)
- Carrier profile summary card (company name, DOT, safety score, rating)
- Job details: pay rate, freight type, route, home time, CDL requirements
- "Apply Now" button → fires `POST /applications` to `lmdr-application-service`
- Match score badge (from `lmdr-matching-service GET /match?driverId=X&jobId=Y`) — rendered via Suspense

### 4.5 Driver Application Status

File: `frontend/src/app/(driver)/applications/page.tsx`
- Tabbed view: All | Active | Pending | Rejected | Hired
- Application list with `StatusTimeline` component per row showing stages
- Link to job detail for each application
- Data from `lmdr-application-service GET /applications`

### 4.6 Driver Compliance

File: `frontend/src/app/(driver)/compliance/page.tsx`
- `ComplianceChecklist` component: ordered list of required documents with status badges
- Statuses: Not Started | Uploaded | Under Review | Verified | Expired
- File upload placeholder for each item (`FileUploadZone` — Phase 4)
- Data from `lmdr-compliance-service GET /compliance/driver/:driverId`

### 4.7 Driver Payments

File: `frontend/src/app/(driver)/payments/page.tsx`
- Earnings summary card: MTD, YTD, last payout date + amount
- Payout history table with pagination: date, amount, status, reference ID
- Data from `lmdr-payment-service GET /payments/driver/:driverId`

### 4.8 Driver Profile

File: `frontend/src/app/(driver)/profile/page.tsx`
- Editable profile form (pre-populated from `lmdr-driver-service GET /drivers/:driverId`)
- Same Zod schema as sign-up but in edit mode
- Document status section (same as compliance checklist — Phase 4 for actual upload)
- Save via `PUT /drivers/:driverId` to `lmdr-driver-service`

**Checklist:**
- [ ] Driver shell sidebar renders and navigates between all 6 driver pages
- [ ] Job search returns results (mock or real from Phase 2 service)
- [ ] Apply button on job detail fires the correct API call
- [ ] `StatusTimeline` renders all application stages correctly
- [ ] `ComplianceChecklist` renders all statuses with correct badge colors

---

## Task 5: Carrier Sign Up Flow

> **Estimated effort:** 1 day
> **Goal:** Multi-step carrier registration form.

### 5.1 Carrier Sign Up Page

File: `frontend/src/app/(auth)/carrier-signup/page.tsx`

Multi-step form with 3 steps:
- **Step 1: Company Info** — company name, DOT number, MC number, state, address, fleet size
- **Step 2: Contact Info** — hiring manager name, email, phone, role
- **Step 3: Review** — summary + submit

DOT number field: on blur, call `lmdr-carrier-service GET /carriers/dot/:dotNumber` to pre-fill FMCSA data (company name, state, safety rating). Show a loading spinner during lookup.

On submit: `POST /carriers` to `lmdr-carrier-service`.

Zod schema enforces DOT number format (`/^\d{1,8}$/`).

**Checklist:**
- [ ] DOT lookup pre-fills company name and state on blur
- [ ] All 3 steps validate independently
- [ ] Submit fires `POST /carriers` and shows confirmation screen

---

## Task 6: Carrier Dashboard Pages

> **Estimated effort:** 4–5 days
> **Goal:** Build all 7 carrier-facing dashboard pages behind auth guard.

### 6.1 Carrier Shell Layout

File: `frontend/src/app/(carrier)/layout.tsx`
- Sidebar nav: Dashboard, My Jobs, Post a Job, Find Drivers, Compliance, Billing
- `carrier-blue` accent on active nav item, `carrier-blue` sidebar background
- Top bar: VelocityMatch logo, carrier company name (from session stub), notification bell placeholder

### 6.2 Carrier Dashboard

File: `frontend/src/app/(carrier)/dashboard/page.tsx`
- Stats strip: Active Job Postings, Total Applications Received, Drivers Hired, Open Compliance Items
- Active job postings list (top 4) with applicant count badges
- Recent driver applications (top 5) needing review

### 6.3 Carrier Job Listings

File: `frontend/src/app/(carrier)/jobs/page.tsx`
- Table of all carrier's job postings with status badges (Active | Paused | Closed | Draft)
- Inline actions: Edit, Pause/Resume, Close, Delete (soft delete)
- "Post New Job" button → `/carrier/jobs/new`
- Data from `lmdr-job-service GET /jobs?carrierId=X`

### 6.4 Post New Job

File: `frontend/src/app/(carrier)/jobs/new/page.tsx`
- Multi-field job creation form: title, freight type, pay rate (CPM or flat), CDL requirement, route description, home time policy, start date, positions available
- Zod validation
- `POST /jobs` to `lmdr-job-service`

### 6.5 Job Detail (Carrier View)

File: `frontend/src/app/(carrier)/jobs/[jobId]/page.tsx`
- Job info (editable inline — same form as new job, pre-populated)
- Driver applications list with `StatusTimeline` per applicant
- "Hire" / "Reject" / "Request More Info" actions per applicant
- Application status updates via `PUT /applications/:id` to `lmdr-application-service`

### 6.6 Carrier Driver Search

File: `frontend/src/app/(carrier)/drivers/page.tsx`
- Search and filter: CDL class, years experience, home state, freight preference, availability
- Results as `DriverCard` grid
- "Invite to Apply" button per driver card
- Streaming results via React Suspense
- Data from `lmdr-matching-service POST /match/search` and `lmdr-driver-service`

### 6.7 Carrier Compliance View

File: `frontend/src/app/(carrier)/compliance/page.tsx`
- Table of all hired/active drivers with compliance status
- Columns: Driver Name, CDL Expiry, Medical Card Expiry, MVR Status, Drug Test Status, Overall Status
- Filter by compliance status
- Data from `lmdr-compliance-service GET /compliance/carrier/:carrierId`

### 6.8 Carrier Billing

File: `frontend/src/app/(carrier)/billing/page.tsx`
- Current plan card (tier name, billing cycle, next invoice date, amount)
- Invoice history table with download links (PDF links — Phase 4)
- Rate cards section (shows per-hire fee or subscription price)
- Data from `lmdr-payment-service GET /billing/carrier/:carrierId`

**Checklist:**
- [ ] Carrier shell sidebar renders and navigates between all 6 carrier pages
- [ ] New job form submits and redirects to job listings
- [ ] Driver search renders `DriverCard` grid with filter state in URL
- [ ] Compliance table renders all columns correctly

---

## Task 7: Admin Dashboard Pages

> **Estimated effort:** 3 days
> **Goal:** Build 4 admin pages behind strict auth guard (admin role only).

### 7.1 Admin Shell Layout

File: `frontend/src/app/(admin)/layout.tsx`
- Sidebar: Overview, Drivers, Carriers, Compliance
- `carrier-blue` branding (VelocityMatch admin)
- Strict auth check: role must be `admin` — any other role redirects to `/`

### 7.2 Admin Dashboard

File: `frontend/src/app/(admin)/dashboard/page.tsx`
- Platform metrics: total drivers, total carriers, total active jobs, total applications today
- System health strip: status of each Phase 2 microservice (ping `/health` on each)
- Recent activity feed (last 10 admin-visible events) — from `lmdr-admin-service`

### 7.3 Admin Driver Management

File: `frontend/src/app/(admin)/drivers/page.tsx`
- Full-featured data table: search, filter (state, CDL class, status), sort
- Columns: Name, Email, CDL Class, Status, Joined Date, Compliance Status, Actions
- Actions: View Profile, Suspend, Reinstate, Delete (soft)
- Pagination — server-side via `lmdr-admin-service GET /admin/drivers?page=X&filter=Y`
- Bulk actions: Export CSV, Bulk Suspend

### 7.4 Admin Carrier Management

File: `frontend/src/app/(admin)/carriers/page.tsx`
- Full-featured data table for carriers: DOT, Company Name, State, Fleet Size, Status, Tier, Joined Date
- Actions: View, Suspend, Edit Tier
- Data from `lmdr-admin-service GET /admin/carriers`

### 7.5 Admin Compliance Overview

File: `frontend/src/app/(admin)/compliance/page.tsx`
- Summary stats: Drivers with expired CDL, expiring in 30 days, drivers with pending MVR, drivers flagged
- Downloadable compliance report (CSV export button)
- Filterable table of compliance issues
- Data from `lmdr-compliance-service GET /compliance/admin/overview`

**Checklist:**
- [ ] Admin pages are only accessible when `role === 'admin'` (verify middleware blocks other roles)
- [ ] Driver management table paginator works with server-side data
- [ ] Bulk actions show confirmation modal before firing
- [ ] Compliance overview CSV export triggers download

---

## Task 8: Shared Component Library

> **Estimated effort:** 3–4 days
> **Goal:** Build the LMDR design system component library used across all pages.

### 8.1 Base UI Components

All files live in `frontend/src/components/ui/`.

**Button** (`Button.tsx`)
- Variants: `primary` (yellow), `secondary` (outline), `carrier` (blue), `danger` (red), `ghost`
- Sizes: `sm`, `md`, `lg`
- States: `loading` (spinner), `disabled`

**Card, CardHeader, CardBody, CardFooter** (`Card.tsx`)
- White / neutral-light background, `border-neutral-border`, `rounded-card`, soft shadow

**Input, Select, Textarea, Checkbox** (`Input.tsx`, `Select.tsx`, `Textarea.tsx`, `Checkbox.tsx`)
- Consistent border, focus ring using `driver-yellow` for driver surfaces, `carrier-blue` for carrier surfaces
- Error state with red border and inline error message

**Badge** (`Badge.tsx`)
- Status variants: `active` (green), `pending` (amber), `verified` (blue), `suspended` (red), `draft` (gray)

**Modal, Drawer** (`Modal.tsx`, `Drawer.tsx`)
- Focus trap, Escape key dismiss, backdrop click dismiss
- Drawer slides from right (mobile-friendly)

**Table, Pagination** (`Table.tsx`, `Pagination.tsx`)
- Sortable column headers
- Pagination: page number buttons + prev/next, page size selector

**JobCard** (`JobCard.tsx`)
- Fields: job title, carrier name, freight type, pay rate, location, CDL requirement, posted date
- "Apply" CTA button
- Match score badge (optional, shown when `matchScore` prop is provided)
- `driver-yellow` accent

**DriverCard** (`DriverCard.tsx`)
- Fields: driver name (initials avatar), CDL class, years experience, home state, freight preference, compliance badge
- "Invite to Apply" CTA
- `carrier-blue` accent

**CarrierCard** (`CarrierCard.tsx`)
- Fields: company name, DOT, safety rating badge, fleet size, freight type, state
- FMCSA data integration (pre-populated from enrichment)

**StatusTimeline** (`StatusTimeline.tsx`)
- Vertical stepper showing application stages: Applied → Reviewed → Interview → Offer → Hired / Rejected
- Active step highlighted in `driver-yellow`, completed steps in `status-active`, pending steps in `neutral-border`

**ComplianceChecklist** (`ComplianceChecklist.tsx`)
- Ordered list of compliance items with `Badge` for each status
- Expandable detail row per item (expiry date, upload date, reviewer notes)

**FileUploadZone** (`FileUploadZone.tsx`)
- Drag-and-drop zone placeholder
- Phase 3: shows "Upload available after Phase 4" message
- Phase 4: connects to Cloud Storage signed URL upload

**NotificationBell** (`NotificationBell.tsx`)
- Bell icon with unread count badge
- Phase 3: renders static count of `0`
- Phase 4: subscribes to Firebase Realtime DB notification feed

### 8.2 Maps Component

File: `frontend/src/components/maps/JobMap.tsx`
- Uses `@googlemaps/js-api-loader` to load Maps JavaScript API
- Renders pins for each job in search results
- Click on pin → shows `JobCard` info window
- Geo-search: "Search this area" button re-fires job search API with current map bounds

### 8.3 Storybook (Optional but Recommended)

```bash
cd frontend
npx storybook@latest init
```

Create stories for: `Button`, `Badge`, `JobCard`, `DriverCard`, `StatusTimeline`, `ComplianceChecklist`.

**Checklist:**
- [ ] All UI components render in isolation (Storybook or local test page)
- [ ] `Button` primary variant renders `driver-yellow` background
- [ ] `Badge` renders all 5 status variants with correct colors
- [ ] `JobCard` renders with and without `matchScore` prop
- [ ] `StatusTimeline` correctly highlights active step and grays out pending steps
- [ ] `JobMap` renders Google Maps and places a pin for a hardcoded test location

---

## Task 9: Static Asset Migration to Cloud Storage

> **Estimated effort:** 1–2 days
> **Goal:** Upload all Wix static assets to `lmdr-static-assets` GCS bucket and configure CDN.

### 9.1 GCS Bucket Configuration

The bucket `lmdr-static-assets` was created in M3. Configure it:

```bash
# Set default ACL to public-read
gsutil iam ch allUsers:objectViewer gs://lmdr-static-assets

# Set CORS policy for font/image requests
cat > cors.json <<EOF
[{
  "origin": ["https://app.lastmiledr.com", "http://localhost:3000"],
  "method": ["GET", "HEAD"],
  "responseHeader": ["Content-Type", "Cache-Control"],
  "maxAgeSeconds": 3600
}]
EOF
gsutil cors set cors.json gs://lmdr-static-assets
```

### 9.2 Upload Assets

```bash
# Upload images (from Wix export in wix-export/images/)
gsutil -m cp -r wix-export/images/ gs://lmdr-static-assets/images/

# Upload fonts
gsutil -m cp -r wix-export/fonts/ gs://lmdr-static-assets/fonts/

# Set cache headers: images → 1 year
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" \
  gs://lmdr-static-assets/images/**

gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" \
  gs://lmdr-static-assets/fonts/**
```

### 9.3 Configure Cloud CDN

```bash
# Create a backend bucket pointing to lmdr-static-assets
gcloud compute backend-buckets create lmdr-static-backend \
  --gcs-bucket-name=lmdr-static-assets \
  --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC \
  --default-ttl=3600 \
  --project=ldmr-velocitymatch

# Add signed URL key for invalidation (optional)
gcloud compute backend-buckets add-signed-url-key lmdr-static-backend \
  --key-name=lmdr-cdn-key \
  --key-file=cdn-key.bin
```

### 9.4 Verify CDN URL in Next.js

Confirm `NEXT_PUBLIC_CDN_URL=https://storage.googleapis.com/lmdr-static-assets` is set.

Test image rendering in Next.js:

```tsx
<img
  src={`${process.env.NEXT_PUBLIC_CDN_URL}/images/hero-home.webp`}
  alt="LMDR Hero"
  width={1200}
  height={600}
/>
```

**Checklist:**
- [ ] `gsutil ls gs://lmdr-static-assets/images/` shows uploaded assets
- [ ] Hero image loads from CDN URL in browser (check Network tab — response has `x-cache: Hit from cloudfront` or GCP CDN equivalent)
- [ ] Cache-Control headers are `max-age=31536000, immutable` on image responses

---

## Task 10: Cloud Run Deployment

> **Estimated effort:** 1 day
> **Goal:** Deploy `lmdr-frontend` to Cloud Run and verify with health check.

### 10.1 Build and Push Docker Image

```bash
cd frontend

# Build
docker build \
  -t us-central1-docker.pkg.dev/ldmr-velocitymatch/lmdr-repo/lmdr-frontend:latest \
  -f Dockerfile \
  .

# Push
docker push us-central1-docker.pkg.dev/ldmr-velocitymatch/lmdr-repo/lmdr-frontend:latest
```

### 10.2 Deploy to Cloud Run

```bash
gcloud run deploy lmdr-frontend \
  --image=us-central1-docker.pkg.dev/ldmr-velocitymatch/lmdr-repo/lmdr-frontend:latest \
  --region=us-central1 \
  --project=ldmr-velocitymatch \
  --service-account=lmdr-frontend-sa@ldmr-velocitymatch.iam.gserviceaccount.com \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=1 \
  --max-instances=10 \
  --port=3000 \
  --allow-unauthenticated \
  --update-secrets="LMDR_DRIVER_SERVICE_URL=lmdr-driver-service-url:latest" \
  --update-secrets="LMDR_CARRIER_SERVICE_URL=lmdr-carrier-service-url:latest" \
  --update-secrets="LMDR_JOB_SERVICE_URL=lmdr-job-service-url:latest" \
  --update-secrets="LMDR_APPLICATION_SERVICE_URL=lmdr-application-service-url:latest" \
  --update-secrets="LMDR_COMPLIANCE_SERVICE_URL=lmdr-compliance-service-url:latest" \
  --update-secrets="LMDR_PAYMENT_SERVICE_URL=lmdr-payment-service-url:latest" \
  --update-secrets="LMDR_NOTIFICATION_SERVICE_URL=lmdr-notification-service-url:latest" \
  --update-secrets="LMDR_MATCHING_SERVICE_URL=lmdr-matching-service-url:latest" \
  --update-secrets="LMDR_ADMIN_SERVICE_URL=lmdr-admin-service-url:latest" \
  --update-secrets="NEXT_PUBLIC_MAPS_API_KEY=lmdr-maps-api-key:latest" \
  --set-env-vars="NEXT_PUBLIC_CDN_URL=https://storage.googleapis.com/lmdr-static-assets,DISABLE_AUTH=true,GCP_PROJECT_ID=ldmr-velocitymatch"
```

### 10.3 Verify Deployment

```bash
# Get the Cloud Run URL
SERVICE_URL=$(gcloud run services describe lmdr-frontend \
  --region=us-central1 \
  --project=ldmr-velocitymatch \
  --format='value(status.url)')

# Health check
curl "$SERVICE_URL/api/health"
# Expected: {"status":"ok","service":"lmdr-frontend",...}

# Home page
curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/"
# Expected: 200
```

**Checklist:**
- [ ] `gcloud run services list --region us-central1` shows `lmdr-frontend` as READY
- [ ] `GET <service-url>/api/health` returns HTTP 200
- [ ] Home page (`/`) returns HTTP 200
- [ ] No ERROR-level entries in Cloud Logging for `lmdr-frontend` service in first 5 minutes

---

## Task 11: Cloud CDN + Global HTTPS Load Balancer Setup

> **Estimated effort:** 1–2 days
> **Goal:** Route `app.lastmiledr.com` to Cloud Run via Global HTTPS LB with CDN for static assets.

### 11.1 Create Network Endpoint Group for Cloud Run

```bash
gcloud compute network-endpoint-groups create lmdr-frontend-neg \
  --region=us-central1 \
  --network-endpoint-type=serverless \
  --cloud-run-service=lmdr-frontend \
  --project=ldmr-velocitymatch
```

### 11.2 Create Backend Service

```bash
gcloud compute backend-services create lmdr-frontend-backend \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --protocol=HTTPS \
  --global \
  --project=ldmr-velocitymatch

gcloud compute backend-services add-backend lmdr-frontend-backend \
  --network-endpoint-group=lmdr-frontend-neg \
  --network-endpoint-group-region=us-central1 \
  --global \
  --project=ldmr-velocitymatch

# Enable CDN on the backend service
gcloud compute backend-services update lmdr-frontend-backend \
  --enable-cdn \
  --cache-mode=USE_ORIGIN_HEADERS \
  --global \
  --project=ldmr-velocitymatch
```

### 11.3 Create URL Map and CDN Policy

```bash
# URL map: static assets → backend bucket CDN; everything else → Cloud Run backend
gcloud compute url-maps create lmdr-frontend-urlmap \
  --default-service=lmdr-frontend-backend \
  --project=ldmr-velocitymatch

# Path matcher: /_next/static/** and /images/** go to static assets backend
gcloud compute url-maps add-path-matcher lmdr-frontend-urlmap \
  --path-matcher-name=static-matcher \
  --default-service=lmdr-frontend-backend \
  --backend-bucket-path-rules="/_next/static/*=lmdr-static-backend,/images/*=lmdr-static-backend,/fonts/*=lmdr-static-backend" \
  --project=ldmr-velocitymatch
```

### 11.4 SSL Certificate and HTTPS Proxy

```bash
# Google-managed SSL certificate
gcloud compute ssl-certificates create lmdr-frontend-cert \
  --domains=app.lastmiledr.com \
  --project=ldmr-velocitymatch

# Target HTTPS proxy
gcloud compute target-https-proxies create lmdr-frontend-https-proxy \
  --url-map=lmdr-frontend-urlmap \
  --ssl-certificates=lmdr-frontend-cert \
  --project=ldmr-velocitymatch

# Global forwarding rule (HTTPS)
gcloud compute forwarding-rules create lmdr-frontend-https-rule \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --network-tier=PREMIUM \
  --target-https-proxy=lmdr-frontend-https-proxy \
  --global \
  --ports=443 \
  --project=ldmr-velocitymatch

# HTTP → HTTPS redirect rule
gcloud compute forwarding-rules create lmdr-frontend-http-rule \
  --load-balancing-scheme=EXTERNAL_MANAGED \
  --network-tier=PREMIUM \
  --target-http-proxy=lmdr-frontend-http-proxy \
  --global \
  --ports=80 \
  --project=ldmr-velocitymatch
```

### 11.5 Get Load Balancer IP

```bash
gcloud compute forwarding-rules describe lmdr-frontend-https-rule \
  --global \
  --project=ldmr-velocitymatch \
  --format='value(IPAddress)'
```

Record this IP for DNS configuration in Task 12.

**Checklist:**
- [ ] `curl -I https://app.lastmiledr.com/api/health` returns HTTP 200 (once DNS is pointed)
- [ ] `curl -I https://app.lastmiledr.com/_next/static/chunks/main.js` has `Cache-Control: max-age=31536000`
- [ ] HTTP to HTTPS redirect works: `curl -I http://app.lastmiledr.com/` returns 301
- [ ] SSL certificate shows as ACTIVE in Cloud Console

---

## Task 12: Progressive DNS Cutover

> **Estimated effort:** 2 days (spread across migration window)
> **Goal:** Cut over traffic from Wix to Cloud Run page-by-page, with smoke tests and rollback capability.

### 12.1 Pre-Cutover Preparation

1. Lower Wix DNS TTL to 60 seconds (do this 24 hours before first cutover)
2. Document current Wix DNS records (screenshot from Wix Domain panel)
3. Set `FRONTEND_CUTOVER_PHASE=wix` in Secret Manager (verify current value)
4. Confirm `lmdr-frontend` Cloud Run service health check passes

### 12.2 Smoke Test Checklist (Per Page Group)

Run the following checks before and after each page group cutover:

**Marketing pages smoke test:**
- [ ] `GET /` returns 200, page contains text "Find Driving Jobs"
- [ ] `GET /about` returns 200
- [ ] `GET /pricing` returns 200, contains 3 pricing tiers
- [ ] `GET /legal` returns 200
- [ ] `GET /contact` returns 200, form renders
- [ ] `GET /sitemap.xml` returns valid XML
- [ ] `GET /robots.txt` disallows `/admin/`
- [ ] No P0 console errors on home page (DevTools Evidence Pack)

**Auth flows smoke test:**
- [ ] `GET /driver-signup` returns 200, Step 1 form renders
- [ ] `GET /carrier-signup` returns 200, Step 1 form renders
- [ ] Step progression works without JavaScript errors

**Driver dashboard smoke test:**
- [ ] `GET /dashboard` returns 200 (with `DISABLE_AUTH=true`)
- [ ] `GET /jobs` returns 200, job search UI renders
- [ ] `GET /applications` returns 200
- [ ] `GET /compliance` returns 200
- [ ] `GET /payments` returns 200
- [ ] `GET /profile` returns 200

**Carrier dashboard smoke test:**
- [ ] `GET /carrier/dashboard` returns 200
- [ ] `GET /carrier/jobs` returns 200, job listing table renders
- [ ] `GET /carrier/jobs/new` returns 200, form renders
- [ ] `GET /carrier/drivers` returns 200
- [ ] `GET /carrier/compliance` returns 200
- [ ] `GET /carrier/billing` returns 200

**Admin dashboard smoke test:**
- [ ] `GET /admin` returns 200
- [ ] `GET /admin/drivers` returns 200, driver table renders
- [ ] `GET /admin/carriers` returns 200
- [ ] `GET /admin/compliance` returns 200

### 12.3 Cutover Order and Commands

**Step 1: Marketing pages (lowest risk)**

```bash
# Update DNS: add A record pointing app.lastmiledr.com to LB IP
# (Do this in your DNS registrar or Wix Domain settings)
# LB IP obtained from Task 11.5

# Verify (after DNS propagates ~60s):
curl -I https://app.lastmiledr.com/
# Must return: Server: Google Frontend (or similar) — confirms it's hitting Cloud Run, not Wix
```

Run marketing pages smoke test. If pass: proceed to Step 2.

**Step 2: Auth flows**

Auth flow pages are already deployed. DNS cutover covers them with the same A record. Verify `GET /driver-signup` smoke test passes.

**Step 3: Driver dashboards**

Confirm Phase 2 `lmdr-driver-service`, `lmdr-job-service`, `lmdr-application-service` are deployed and reachable. Run driver dashboard smoke test.

**Step 4: Carrier dashboards**

Confirm Phase 2 `lmdr-carrier-service`, `lmdr-payment-service` are deployed. Run carrier dashboard smoke test.

**Step 5: Admin dashboard**

Run admin smoke test. Set `DISABLE_AUTH=false` after Phase 4 auth is ready.

### 12.4 Full DNS Cutover

After all page groups pass smoke tests:

```bash
# Update Secret Manager
echo -n "cloudrun" | gcloud secrets versions add lmdr-frontend-cutover-phase \
  --data-file=- \
  --project=ldmr-velocitymatch

# Confirm Wix site is set to redirect mode in Wix Dashboard
# (Wix → Domain → Redirect to external URL)
```

### 12.5 Rollback Procedure

If any smoke test fails after DNS cutover:

```bash
# Revert DNS: change the A record for app.lastmiledr.com back to the old Wix IP
# (Wix IP was documented in pre-cutover preparation step)
# TTL is 60s — propagation takes ~1 minute

# Wix does not need any changes — it continues serving on its domain
```

**Rollback target time: < 5 minutes from decision to Wix serving traffic again.**

---

## Task 13: Performance and SEO Validation

> **Estimated effort:** 1–2 days
> **Goal:** Confirm Core Web Vitals targets are met and SEO is properly configured.

### 13.1 Lighthouse CI Setup

Create `frontend/lighthouserc.js`:

```js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/about',
        'http://localhost:3000/pricing',
      ],
      startServerCommand: 'npm run start',
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.90 }],
        'categories:seo': ['error', { minScore: 0.90 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

Run locally:

```bash
cd frontend
npm install -g @lhci/cli
lhci autorun
```

### 13.2 Google Search Console Setup

1. Go to [Google Search Console](https://search.google.com/search-console/)
2. Add property: `https://app.lastmiledr.com`
3. Verify via DNS TXT record (add to domain registrar)
4. Submit sitemap: `https://app.lastmiledr.com/sitemap.xml`
5. Run URL Inspection on `https://app.lastmiledr.com/` — confirm "URL is on Google"

### 13.3 Performance Baseline Measurement

After full DNS cutover, measure real-user Core Web Vitals using the Web Vitals library:

```tsx
// src/app/layout.tsx — add to root layout
import { Analytics } from '@vercel/analytics/react'; // or custom Web Vitals reporting
```

Or use Google's `web-vitals` npm package to report LCP/CLS/FID to Cloud Monitoring via a custom metric.

### 13.4 Evidence Pack Run

Per CLAUDE.md protocol, before marking Phase 3 DONE, run the DevTools Evidence Pack:

```bash
claude --agent evidence-pack
```

Required passing criteria:
- Zero P0 console errors across 5 critical paths (Home, Driver Jobs, Carrier Dashboard, Admin Dashboard, Contact)
- All required DOM selectors visible on each page
- All pages reach ready state within timeout
- Zero HTTP 500 errors on LMDR endpoints
- 5 screenshots captured and non-blank

Attach the `run_id` to `metadata.json` `verification_run` field.

**Checklist:**
- [ ] `lhci autorun` passes with Performance > 0.85 on all 3 marketing pages
- [ ] LCP < 2.5s on Home page in Lighthouse report
- [ ] CLS < 0.1 on all pages
- [ ] `sitemap.xml` indexed in Google Search Console (Coverage: Valid count > 0)
- [ ] Evidence Pack `quality_gate.json` shows `pass: true`
- [ ] Cloud Build pipeline runs `lhci autorun` on every push to `main` and fails build if thresholds not met

---

## Final Deliverables Checklist

| Deliverable | File / Resource | Done |
|-------------|----------------|------|
| Next.js 14 app | `frontend/` directory | ☐ |
| 5 marketing pages (SSG) | `app/page.tsx`, `about`, `pricing`, `legal`, `contact` | ☐ |
| Driver sign up (multi-step) | `app/(auth)/driver-signup/page.tsx` | ☐ |
| 7 driver dashboard pages | `app/(driver)/**/page.tsx` | ☐ |
| Carrier sign up | `app/(auth)/carrier-signup/page.tsx` | ☐ |
| 7 carrier dashboard pages | `app/(carrier)/**/page.tsx` | ☐ |
| 4 admin dashboard pages | `app/(admin)/**/page.tsx` | ☐ |
| Shared component library | `src/components/ui/**` | ☐ |
| Google Maps integration | `src/components/maps/JobMap.tsx` | ☐ |
| Static assets in GCS | `gs://lmdr-static-assets` | ☐ |
| CDN + Load Balancer | `lmdr-frontend-urlmap`, Cloud CDN enabled | ☐ |
| Cloud Run service | `lmdr-frontend` in `us-central1` | ☐ |
| Dockerfile | `frontend/Dockerfile` | ☐ |
| Cloud Build pipeline | `frontend/cloudbuild.yaml` | ☐ |
| Lighthouse CI | `frontend/lighthouserc.js` | ☐ |
| DNS cutover complete | `app.lastmiledr.com` → LB IP | ☐ |
| Wix in redirect mode | Wix Dashboard | ☐ |
| Evidence Pack passing | `artifacts/devtools/<run_id>/quality_gate.json` | ☐ |
| `metadata.json` updated | `status: COMPLETE`, `verification_run: <run_id>` | ☐ |

---

## Timeline Estimate

| Week | Tasks |
|------|-------|
| Week 1 | Task 1 (Scaffold), Task 2 (Marketing pages) |
| Week 2 | Task 3 (Driver signup), Task 5 (Carrier signup), Task 8 (Component library — base UI) |
| Week 3 | Task 4 (Driver dashboards) |
| Week 4 | Task 6 (Carrier dashboards), Task 8 (Component library — domain components) |
| Week 5 | Task 7 (Admin dashboards), Task 9 (Asset migration to GCS) |
| Week 6 | Task 10 (Cloud Run deploy), Task 11 (Load Balancer + CDN) |
| Week 7 | Task 12 (Progressive DNS cutover — marketing + auth) |
| Week 8 | Task 12 (DNS cutover — dashboards), Task 13 (Performance + SEO validation), Evidence Pack |

---

*End of PLAN — Phase 3 Frontend Migration*
