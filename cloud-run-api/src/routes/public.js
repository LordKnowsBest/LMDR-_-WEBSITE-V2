import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../db/pool.js';
import { getTableName } from '../db/schema.js';
import { buildInsertQuery } from '../db/query.js';
import { insertLog } from '../db/bigquery.js';

const router = Router();
const LEADS_TABLE = getTableName('carrierStaffingRequests');

// POST /v1/public/carrier-staffing-request
router.post('/carrier-staffing-request', async (req, res) => {
  try {
    const { companyName, contactName, email, phone, dotNumber, staffingType, driversNeeded, driverTypes, additionalNotes, sourceUrl } = req.body;

    // Validation
    if (!companyName || !contactName || !email || !phone || !staffingType) {
      return res.status(400).json({ success: false, error: 'Missing required fields: companyName, contactName, email, phone, staffingType' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Invalid email address' });
    }

    // Parse DOT number
    let dot = null;
    if (dotNumber) {
      const cleaned = String(dotNumber).trim();
      if (/^\d+$/.test(cleaned)) {
        const parsed = parseInt(cleaned, 10);
        if (parsed > 0 && parsed <= 99999999) dot = parsed;
      }
    }

    // Parse drivers needed
    let driversNeededNum = null;
    if (driversNeeded) {
      const plusMatch = String(driversNeeded).match(/(\d+)\+/);
      if (plusMatch) {
        driversNeededNum = parseInt(plusMatch[1], 10);
      } else {
        const rangeMatch = String(driversNeeded).match(/(\d+)\s*-\s*(\d+)/);
        if (rangeMatch) {
          driversNeededNum = parseInt(rangeMatch[2], 10);
        } else {
          const plainMatch = String(driversNeeded).match(/(\d+)/);
          if (plainMatch) driversNeededNum = parseInt(plainMatch[1], 10);
        }
      }
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const _id = crypto.randomUUID();

    const leadData = {
      company_name: companyName.trim(),
      contact_name: contactName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      dot_number: dot ? String(dot) : null,
      staffing_type: staffingType.toLowerCase(),
      drivers_needed: driversNeededNum,
      driver_types: Array.isArray(driverTypes) ? driverTypes : [],
      additional_notes: driversNeeded
        ? `Drivers needed: ${driversNeeded}. ${additionalNotes || ''}`.trim()
        : (additionalNotes || ''),
      linked_carrier_id: null,
      status: 'new',
      submitted_date: dateStr,
      last_updated: dateStr,
      source: 'landing_page',
      source_url: sourceUrl || '/',
    };

    const { sql, params } = buildInsertQuery(LEADS_TABLE, { _id, data: leadData });
    await query(sql, params);

    // Log to BigQuery
    try {
      insertLog({
        service: 'carrier-leads',
        level: 'INFO',
        message: `New carrier staffing request: ${companyName}`,
        data: { lead_id: _id, company: companyName, staffing_type: staffingType, source: 'landing_page' },
      });
    } catch { /* non-blocking */ }

    res.status(201).json({
      success: true,
      leadId: _id,
      checkoutToken: _id,
      message: 'Staffing request submitted.',
    });
  } catch (err) {
    console.error('[public/carrier-staffing-request]', err.message);
    res.status(500).json({ success: false, error: 'Failed to submit request.' });
  }
});

export default router;
