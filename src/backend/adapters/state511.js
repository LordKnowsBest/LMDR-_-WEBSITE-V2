/**
 * State 511 API Adapter Pattern
 * Abstraction layer for normalizing different state road condition APIs using Factory Pattern.
 * 
 * Usage:
 * const adapter = getAdapterForState('CA');
 * const conditions = await adapter.fetchConditions(bbox);
 */

import { fetch } from 'wix-fetch';
import { getSecret } from 'wix-secrets-backend';

// ============================================
// ADAPTER IMPLEMENTATIONS
// ============================================

/**
 * California 511 (Caltrans) Adapter
 * API: https://api.511.org/traffic/events?api_key={KEY}
 * Status: Requires API Key
 */
class CaliforniaAdapter {
    async fetchConditions(bbox) {
        try {
            // Try to get key, fail gracefully if not set
            const apiKey = await getSecret('CALTRANS_API_KEY').catch(() => null);

            if (!apiKey) {
                console.warn('[511-CA] Missing CALTRANS_API_KEY secret. Returning empty.');
                return [];
            }

            const url = `https://api.511.org/traffic/events?api_key=${apiKey}&format=json`;
            console.log('[511-CA] Fetching:', url.replace(apiKey, 'WARPED'));

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Status ${response.status}`);

            const data = await response.json();
            // Parse Logic specific to 511.org structure
            // (Simplified for MVP map)
            return (data.events || []).map(event => ({
                id: event.id,
                type: this.mapType(event.event_type),
                highway: event.roads?.[0]?.name || 'Unknown',
                state: 'CA',
                location: { lat: event.geography?.coordinates?.[1] || 0, lng: event.geography?.coordinates?.[0] || 0 },
                description: event.headline || event.description,
                severity: event.severity || 'moderate',
                start_time: new Date(event.created),
                delay_minutes: 0 // Not always provided
            }));

        } catch (error) {
            console.error('[511-CA] Adapter Error:', error);
            return [];
        }
    }

    mapType(type) {
        const t = (type || '').toLowerCase();
        if (t.includes('construction')) return 'construction';
        if (t.includes('accident') || t.includes('collision')) return 'accident';
        if (t.includes('closure')) return 'closure';
        return 'warning';
    }
}

/**
 * Texas 511 (DriveTexas) Adapter
 * API: https://drivetexas.org/api/conditions.wzdx.geojson?key={KEY}
 * Status: Requires API Key (Free)
 */
class TexasAdapter {
    async fetchConditions(bbox) {
        try {
            const apiKey = await getSecret('DRIVETEXAS_API_KEY').catch(() => null);
            if (!apiKey) {
                console.warn('[511-TX] Missing DRIVETEXAS_API_KEY secret. Returning empty.');
                return [];
            }
            // Using WZDx feed
            const url = `https://drivetexas.org/api/conditions.wzdx.geojson?key=${apiKey}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Status ${response.status}`);

            const geojson = await response.json();
            return (geojson.features || []).map(f => ({
                id: f.id,
                type: 'construction', // WZDx is primarily work zones
                highway: f.properties.road_names?.[0] || 'TX Highway',
                state: 'TX',
                location: {
                    lat: f.geometry.type === 'Point' ? f.geometry.coordinates[1] : f.geometry.coordinates[0][1],
                    lng: f.geometry.type === 'Point' ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0]
                },
                description: f.properties.description || f.properties.types_of_work?.[0]?.type_name,
                severity: 'moderate',
                start_time: new Date(f.properties.start_date),
            }));

        } catch (error) {
            console.error('[511-TX] Adapter Error:', error);
            return [];
        }
    }
}

/**
 * Iowa 511 (Open Data) Adapter
 * API: https://data.iowa.gov/resource/yata-4k7n.json
 * Status: OPEN / NO KEY REQUIRED (Socrata)
 * Great for DEMO
 */
class IowaAdapter {
    async fetchConditions(bbox) {
        try {
            // Socrata API - limit to recent events to avoid huge payload
            // Using a simple LIMIT for MVP, in production add WHERE clauses
            const url = `https://data.iowa.gov/resource/yata-4k7n.json?$limit=50&$order=event_start desc`;
            console.log('[511-IA] Fetching Open Data:', url);

            const response = await fetch(url);
            if (!response.ok) throw new Error(`Status ${response.status}`);

            const events = await response.json();

            return events.map(e => ({
                id: e.event_id,
                type: this.mapType(e.event_type),
                highway: e.road || 'IA Road',
                state: 'IA',
                // Socrata JSON usually has location object
                location: {
                    lat: parseFloat(e.location?.latitude || e.latitude || 41.6),
                    lng: parseFloat(e.location?.longitude || e.longitude || -93.6)
                },
                description: `${e.event_name}: ${e.event_comments || 'No details'}`,
                severity: 'moderate', // IA data might not have normalized severity
                start_time: new Date(e.event_start),
                expected_end: e.event_end ? new Date(e.event_end) : null
            }));

        } catch (error) {
            console.error('[511-IA] Adapter Error:', error);
            return [];
        }
    }

    mapType(type) {
        if (!type) return 'warning';
        const t = type.toLowerCase();
        if (t.includes('roadwork') || t.includes('construction')) return 'construction';
        if (t.includes('crash') || t.includes('accident')) return 'accident';
        if (t.includes('closure')) return 'closure';
        return 'warning';
    }
}

/**
 * Default/Mock Adapter
 */
class DefaultAdapter {
    async fetchConditions(bbox) { return []; }
}

// ============================================
// FACTORY
// ============================================

const ADAPTERS = {
    'CA': new CaliforniaAdapter(),
    'TX': new TexasAdapter(),
    'IA': new IowaAdapter(), // The "Live Demo" State
};

const DEFAULT = new DefaultAdapter();

/**
 * Get the appropriate adapter for a state
 * @param {string} stateCode - Two-letter state code
 * @returns {StateAdapter}
 */
export function getAdapterForState(stateCode) {
    return ADAPTERS[stateCode] || DEFAULT;
}

/**
 * Utility to fetch conditions across multiple states
 */
export async function fetchMultiStateConditions(states, bbox) {
    const promises = states.map(state => {
        const adapter = getAdapterForState(state);
        return adapter.fetchConditions(bbox).catch(err => {
            console.error(`[511-${state}] Error fetching:`, err);
            return [];
        });
    });

    const results = await Promise.all(promises);
    return results.flat();
}
