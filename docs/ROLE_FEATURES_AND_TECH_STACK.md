# LMDR Role Features, Tech Stack, Agent Tooling & Automation

## Platform Roles and Feature Coverage

### Admin
- Platform-wide operations center for KPI tracking, activity feeds, and AI queue visibility.
- User management controls for drivers and carriers (verify, suspend, message, and monitor data quality).
- Configuration controls for AI provider routing, matching weights, system limits, and subscription tier limits.
- Observability tools for logs, tracing, anomaly alerts, and compliance report generation.

### Recruiter
- Driver discovery and pipeline operations including search, funnel visibility, and placement workflow support.
- Telemetry and performance tracking for campaign and retention outcomes.
- Tiered access model (Free/Pro/Enterprise) to control search access, posting volume, and profile view quotas.
- Messaging and premium workflow capabilities at higher subscription tiers.

### Driver
- AI-assisted job matching and preference-aware discovery flow.
- Profile persistence for saved preferences and multiple profile modes.
- Job workflow tools for save/favorite, apply tracking, and match history review.
- Career support features including alerts, resume enhancement, and planning utilities.

### Carrier
- Hiring and onboarding workflows with configurable preference weighting.
- Retention-focused management and operations support.
- Compliance suite with calendar reminders, document vault, DQ tracking, CSA monitoring, and incident reporting.
- Fleet support pages for roster, map, equipment, and operational status management.

## Full Technical Stack

### Core Runtime and Framework
- JavaScript (ES6+) across frontend and backend modules.
- Wix Velo as the full-stack platform runtime.
- React 16.14.0 for specific UI/component implementations where needed.

### Repository Architecture
- `src/pages/`: Wix page-bound code.
- `src/backend/`: secure `.jsw` services and HTTP functions.
- `src/public/`: HTML components and shared client assets organized by role.
- `Conductor/`: product specs, workflows, and track-level implementation references.

### Integrations and Services
- Airtable connectors for externalized operational and business data sync.
- Calendly embed integrations for scheduling flows.
- Stripe-backed subscriptions with checkout, billing portal, webhooks, and quota enforcement.
- FMCSA/compliance service modules for safety and regulatory workflows.

## Agent Tooling and Automation

### Development Tooling
- Wix CLI (`wix dev`) for local editor sync and live development.
- ESLint for repository-wide static checks.
- Jest + Babel test setup for automated unit and integration validation.

### Operational Automation
- Background jobs configured through `jobs.config` for recurring sync/processing tasks.
- Webhook automation for Stripe billing lifecycle events and idempotent event handling.
- AI router optimization workflows that can balance provider quality against cost constraints.
- Observability anomaly detection workflows for proactive alerting and issue response.

### Agent-Oriented Workflow Automation
- Structured task execution guidance in Conductor workflow docs (plan tracking, test-first flow, verification checkpoints).
- Role-segmented code organization that enables focused automation by surface area (admin/recruiter/driver/carrier).
- Standardized script entry points (`dev`, `lint`, `test`) to simplify repeatable automation from agent runs.

## Quick Command Reference
- Install and sync types: `npm install`
- Local runtime: `npm run dev`
- Lint checks: `npm run lint`
- Test suite: `npm test`
