/**
 * Jobs router — aggregates all scheduled/trigger job routes.
 *
 * All routes mounted at /v1/jobs (protected by authMiddleware in server.js).
 *
 *   POST /v1/jobs/fmcsa-sync         — Sync carrier safety data from FMCSA QC API
 *   POST /v1/jobs/fmcsa-roster-sync  — Ingest new carriers from FMCSA (sequential DOT scan above current max)
 *   POST /v1/jobs/fmcsa-mass-embed   — Mass-embed full FMCSA universe (DOT 1–4.5M) directly to Pinecone
 *   POST /v1/jobs/eia-fuel           — Fetch weekly diesel prices from EIA
 *   POST /v1/jobs/freight-signals    — Fetch PPI freight signals from FRED
 *   POST /v1/jobs/market-signals     — Compute market intelligence signal from DataLake
 */

import { Hono } from 'hono';
import { fmcsaSyncRouter }        from './fmcsa-sync.js';
import { fmcsaRosterSyncRouter }  from './fmcsa-roster-sync.js';
import { fmcsaMassEmbedRouter }   from './fmcsa-mass-embed.js';
import { eiaFuelRouter }          from './eia-fuel.js';
import { freightSignalsRouter }   from './freight-signals.js';
import { marketSignalsRouter }    from './market-signals.js';
import { wixProxyRouter }         from './wix-proxy.js';

export const jobsRouter = new Hono();

jobsRouter.route('/fmcsa-sync',        fmcsaSyncRouter);
jobsRouter.route('/fmcsa-roster-sync', fmcsaRosterSyncRouter);
jobsRouter.route('/fmcsa-mass-embed',  fmcsaMassEmbedRouter);
jobsRouter.route('/eia-fuel',          eiaFuelRouter);
jobsRouter.route('/freight-signals',   freightSignalsRouter);
jobsRouter.route('/market-signals',    marketSignalsRouter);
jobsRouter.route('/wix',               wixProxyRouter); // /v1/jobs/wix/:jobName
