// STEP 3b TEST — is it configData or gamificationPageHandlers?
// Testing configData ONLY (gamification commented out)

import {
  rosGetOrCreateRecruiterProfile as getOrCreateRecruiterProfile
} from 'backend/recruiterOSFacade.jsw';

// import { setupRecruiterGamification } from 'public/js/gamificationPageHandlers';
import { FEATURE_FLAGS } from 'backend/configData';

import wixLocation from 'wix-location';

let wixUsers;
try {
  wixUsers = require('wix-users');
} catch (e) {
  console.log('wix-users not available');
}

$w.onReady(function () {
  console.log('[ROS-TEST] $w.onReady fired with ALL imports!');
  console.log('[ROS-TEST] FEATURE_FLAGS:', typeof FEATURE_FLAGS);
  console.log('[ROS-TEST] setupRecruiterGamification:', typeof setupRecruiterGamification);

  const ids = ['#html8', '#html1', '#html2', '#html3', '#html4', '#html5', '#html6', '#htmlEmbed1'];

  ids.forEach(function(id) {
    try {
      const el = $w(id);
      if (el && typeof el.onMessage === 'function') {
        console.log('[ROS-TEST] Found HTML component:', id);
        el.onMessage(function(event) {
          console.log('[ROS-TEST] Received:', event.data);
        });
        setTimeout(function() {
          el.postMessage({ type: 'recruiterReady', data: { test: true } });
          console.log('[ROS-TEST] Sent recruiterReady');
        }, 500);
      }
    } catch (e) {
      console.log('[ROS-TEST] Error:', id, e.message);
    }
  });
});
