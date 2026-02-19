/**
 * DRIVER_SURVEYS Page Code
 *
 * Bridges the surveys HTML component to surveyService backend.
 * Supports fetching pending surveys and submitting responses.
 *
 * Protocol: { action, payload } (standard driver portal pattern)
 */

import wixUsers from 'wix-users';
import wixLocation from 'wix-location';
import { getPendingSurveys, submitSurveyResponse } from 'backend/surveyService';

// ─── Component Discovery ───────────────────────────────────────────────────

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#htmlEmbed1'];
let component = null;

$w.onReady(async function () {
  // Find the HTML iframe component
  for (const id of HTML_COMPONENT_IDS) {
    try {
      const el = $w(id);
      if (el && typeof el.onMessage === 'function') {
        component = el;
        break;
      }
    } catch (e) {
      // Element not on page — continue
    }
  }

  if (!component) {
    console.warn('[DRIVER_SURVEYS] No HTML component found.');
    return;
  }

  component.onMessage(async (event) => {
    const message = event?.data;
    if (!message || !message.action) return;
    await routeMessage(message);
  });

  // Signal ready — HTML will request surveys after receiving this
  safeSend({ action: 'init' });
});

// ─── Router ───────────────────────────────────────────────────────────────

async function routeMessage(message) {
  const { action, payload } = message;

  switch (action) {

    case 'surveysReady': {
      // HTML is bootstrapped — fetch pending surveys for current user
      try {
        const user = wixUsers.currentUser;
        if (!user.loggedIn) {
          safeSend({ action: 'surveysLoaded', payload: { items: [], totalCount: 0 } });
          return;
        }
        const surveyType = payload?.surveyType || 'all';
        const result = await getPendingSurveys(user.id, surveyType);
        if (result.error) {
          safeSend({ action: 'actionError', message: result.error });
        } else {
          safeSend({ action: 'surveysLoaded', payload: result });
        }
      } catch (err) {
        console.error('[DRIVER_SURVEYS] surveysReady error:', err);
        safeSend({ action: 'actionError', message: 'Failed to load surveys.' });
      }
      break;
    }

    case 'submitSurvey': {
      // { surveyRequestId, surveyType, responses }
      try {
        const user = wixUsers.currentUser;
        if (!user.loggedIn) {
          safeSend({ action: 'actionError', message: 'You must be logged in to submit a survey.' });
          return;
        }
        const { surveyRequestId, responses } = payload || {};
        if (!surveyRequestId || !responses) {
          safeSend({ action: 'actionError', message: 'Invalid survey submission data.' });
          return;
        }
        const result = await submitSurveyResponse(user.id, surveyRequestId, responses);
        if (result.error) {
          safeSend({ action: 'submitError', message: result.error });
        } else {
          safeSend({ action: 'submitSuccess', payload: result });
        }
      } catch (err) {
        console.error('[DRIVER_SURVEYS] submitSurvey error:', err);
        safeSend({ action: 'submitError', message: 'Failed to submit survey.' });
      }
      break;
    }

    case 'navigate': {
      // { url } — navigate within the Wix site
      try {
        const url = payload?.url;
        if (url) {
          wixLocation.to(url);
        }
      } catch (err) {
        console.warn('[DRIVER_SURVEYS] navigate error:', err);
      }
      break;
    }

    default:
      console.warn('[DRIVER_SURVEYS] Unknown action:', action);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function safeSend(data) {
  try {
    if (component) {
      component.postMessage(data);
    }
  } catch (e) {
    console.warn('[DRIVER_SURVEYS] postMessage failed:', e.message);
  }
}
