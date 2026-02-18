# Outreach Cadence

> Confidence: high | Source: manual | Last validated: 2026-02-18

## Context

Recruiter outreach follows a structured multi-channel cadence to maximize driver engagement without over-contacting. The cadence is managed through `recruiter_service.jsw` and the Recruiter Console page, which supports 44 distinct actions via the `routeMessage` bridge.

## Details

- **Channel priority order:** Call first, then SMS, then email. Calls have the highest conversion rate for initial contact with CDL drivers.
- **Cadence timing:** Day 1 call, Day 2 SMS follow-up, Day 4 email with job details, Day 7 second call, Day 10 final SMS. After Day 10, the lead moves to a nurture sequence.
- **Sequence management:** Each outreach step is tracked in the recruiter pipeline. The Kanban view groups leads by stage: LEAD, SCREENING, PHONE_SCREEN, APPLICATION, INTERVIEW, OFFER, HIRED.
- **Personalization rules:** Outreach messages pull driver preferences (home time, equipment type, pay range) from the driver profile to customize messaging.
- **Opt-out handling:** Any negative response or opt-out request immediately stops the cadence and flags the lead as DO_NOT_CONTACT.

## Evidence

- Recruiter Console `routeMessage` switch handles outreach actions: `sendSMS`, `sendEmail`, `logCall`, `updateCadenceStep`
- Pipeline stages defined in `recruiter_service.jsw`: LEAD, SCREENING, PHONE_SCREEN, APPLICATION, INTERVIEW, OFFER, HIRED
- Outreach tracking stored in `v2_Recruiter Outreach` Airtable table

## Related

- [High-Conversion Profiles](../patterns/high-conversion-profiles.md)
