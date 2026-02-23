/**
 * Jobs router — aggregates all scheduled/trigger job routes.
 *
 * All routes mounted at /v1/jobs (protected by authMiddleware in server.js).
 *
 *   POST /v1/jobs/fmcsa-sync         — Sync carrier safety data from FMCSA QC API
 *   POST /v1/jobs/fmcsa-roster-sync  — Ingest new carriers from FMCSA (sequential DOT scan)
 *   POST /v1/jobs/eia-fuel           — Fetch weekly diesel prices from EIA
 *   POST /v1/jobs/freight-signals    — Fetch PPI freight signals from FRED
 */

import { Hono } from 'hono';
import { fmcsaSyncRouter }        from './fmcsa-sync.js';
import { fmcsaRosterSyncRouter }  from './fmcsa-roster-sync.js';
import { eiaFuelRouter }          from './eia-fuel.js';
import { freightSignalsRouter }   from './freight-signals.js';

export const jobsRouter = new Hono();

jobsRouter.route('/fmcsa-sync',        fmcsaSyncRouter);
jobsRouter.route('/fmcsa-roster-sync', fmcsaRosterSyncRouter);
jobsRouter.route('/eia-fuel',          eiaFuelRouter);
jobsRouter.route('/freight-signals',   freightSignalsRouter);
