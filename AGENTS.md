# Repository Guidelines

## Project Structure & Module Organization
- `src/backend/`: server-side web modules (`*.jsw`) and HTTP functions. Business logic lives here.
- `src/pages/`: Wix-generated page code (`PageName.xxxxx.js`). Do not rename.
- `src/public/`: HTML components and shared client code. All HTML must live here.
  - `src/public/driver/`, `src/public/carrier/`, `src/public/recruiter/`, `src/public/admin/`, `src/public/landing/`, `src/public/utility/`
  - Tests: `src/public/__tests__/` only.
- `Conductor/`: product specs, workflow docs, and feature tracks.

## Build, Test, and Development Commands
- `npm install`: install dependencies and run `wix sync-types`.
- `npm run dev`: start Wix Local Editor for real-time testing.
- `npm run lint`: run ESLint.

## Coding Style & Naming Conventions
- JavaScript: Google style (2-space indentation, `const`/`let`, named exports only, single quotes).
- HTML/CSS: lowercase tags/classes, 2-space indentation, semantic HTML, no `!important`.
- Wix imports only: `import { fn } from 'backend/module'` or `from 'public/module'` (no relative paths).
- HTML files must be placed under `src/public/` (never `docs/`, root, or `src/pages/`).

## Data & Architecture Notes
- Dual-source data pattern: only `AdminUsers` and `MemberNotifications` stay in Wix collections; everything else routes to Airtable via helper functions in `backend/config.jsw`.
- When editing backend files, follow `airtable-routing.md` guidance if injected.

## Testing Guidelines
- Place tests in `src/public/__tests__/` with `*.test.js` or `*.spec.js` naming.
- Run `npm run lint` before commits; add unit tests for new backend services when feasible.

## Commit & Pull Request Guidelines
- Commit format: `<type>(<scope>): <description>` (e.g., `feat(announcements): add read receipts`).
- Include a short summary, testing notes, and screenshots for UI changes.
- If a change affects Wix HTML components, verify in Local Editor before shipping.

## Security & Configuration Tips
- Use full absolute URLs inside HTML components (Wix iframes) like `https://www.lastmiledr.app/path`.
- Check element existence in Velo (`if ($w('#id').rendered) { ... }`).
