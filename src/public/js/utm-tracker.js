/**
 * UTM Tracker Utility
 * Captures UTM parameters from URL and persists them for attribution.
 * 
 * Usage:
 * import { initUtmTracking, getUtmParams } from 'public/js/utm-tracker.js';
 * 
 * // On page load
 * initUtmTracking();
 * 
 * // When needed (e.g. registration)
 * const params = getUtmParams();
 */

import wixStorage from 'wix-storage';
import wixLocation from 'wix-location';
import wixUsers from 'wix-users';
import { recordTouchpoint } from 'backend/recruiterAnalyticsService';

const STORAGE_KEY_FIRST_TOUCH = 'lmdr_first_touch';
const STORAGE_KEY_LAST_TOUCH = 'lmdr_last_touch';
const STORAGE_KEY_SESSION = 'lmdr_current_session';

/**
 * Initialize tracking - call this on every page load
 */
export function initUtmTracking() {
    if (wixLocation.query) {
        const params = parseUtmParams(wixLocation.query);
        const url = wixLocation.url;
        
        // Only track if valid source found or we want to track all visits
        if (Object.keys(params).length > 0) {
            updateStorage(params);
            
            // Server-side logging
            // We fire and forget to not block page load
            const driverId = wixUsers.currentUser.loggedIn ? wixUsers.currentUser.id : null;
            // For anonymous, we might generate a session ID or rely on backend to handle null
            // We can generate a random session ID here if not in storage
            let sessionId = wixStorage.session.getItem('lmdr_anon_session_id');
            if (!sessionId) {
                sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
                wixStorage.session.setItem('lmdr_anon_session_id', sessionId);
            }

            recordTouchpoint(driverId, params, url, sessionId)
                .catch(err => console.error('[UTM] Failed to record touchpoint', err));
        }
    }
}

/**
 * Parse standard UTM parameters from query object
 * @param {Object} query - wixLocation.query object
 * @returns {Object} Cleaned UTM params
 */
function parseUtmParams(query) {
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    const params = {};
    let hasUtm = false;

    // Standard UTMs
    utmKeys.forEach(key => {
        if (query[key]) {
            params[key] = query[key];
            hasUtm = true;
        }
    });

    // Capture referrer if available (document.referrer is not fully available in Velo, 
    // but sometimes passed via query or we rely on client-side JS in HTML components)
    // Note: Velo doesn't give direct access to document.referrer easily in page code.
    
    // If no UTMs but we have a query (e.g. ad click ID), might want to capture that too
    if (query.gclid) params.gclid = query.gclid;
    if (query.fbclid) params.fbclid = query.fbclid;
    
    // Capture timestamp and page
    if (hasUtm || query.gclid || query.fbclid) {
        params.timestamp = new Date().toISOString();
        params.landing_page = wixLocation.url;
    }

    return params;
}

/**
 * Update local/session storage with new touchpoint data
 * @param {Object} currentParams 
 */
function updateStorage(currentParams) {
    const now = new Date().toISOString();
    
    // 1. First Touch (Persistent - Local Storage)
    // Only set if not already set
    const firstTouch = wixStorage.local.getItem(STORAGE_KEY_FIRST_TOUCH);
    if (!firstTouch) {
        const firstTouchData = {
            ...currentParams,
            type: 'first_touch',
            date: now
        };
        wixStorage.local.setItem(STORAGE_KEY_FIRST_TOUCH, JSON.stringify(firstTouchData));
    }

    // 2. Last Touch (Persistent - Local Storage)
    // Always update on new campaign parameters
    const lastTouchData = {
        ...currentParams,
        type: 'last_touch',
        date: now
    };
    wixStorage.local.setItem(STORAGE_KEY_LAST_TOUCH, JSON.stringify(lastTouchData));

    // 3. Current Session (Session Storage)
    wixStorage.session.setItem(STORAGE_KEY_SESSION, JSON.stringify(lastTouchData));
}

/**
 * Retrieve all attribution data for form submission/registration
 * @returns {Object} Combined attribution data
 */
export function getUtmParams() {
    let firstTouch = {};
    let lastTouch = {};
    
    try {
        const ft = wixStorage.local.getItem(STORAGE_KEY_FIRST_TOUCH);
        if (ft) firstTouch = JSON.parse(ft);
        
        const lt = wixStorage.local.getItem(STORAGE_KEY_LAST_TOUCH);
        if (lt) lastTouch = JSON.parse(lt);
    } catch (e) {
        console.error('Error parsing attribution data', e);
    }

    return {
        first_touch: firstTouch,
        last_touch: lastTouch,
        current_session: lastTouch // Default to last touch for current context
    };
}

/**
 * Clear attribution data (e.g. after successful attribution recording)
 * Usually we keep first touch, but might clear session
 */
export function clearSessionAttribution() {
    wixStorage.session.removeItem(STORAGE_KEY_SESSION);
}
