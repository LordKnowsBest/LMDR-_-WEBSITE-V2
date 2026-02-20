/* =========================================
   DRIVER POLICIES — Bridge Module
   Depends on: nothing
   Handles postMessage communication with Wix page code
   ========================================= */
var DriverPoliciesBridge = (function () {
  'use strict';

  function send(type, data) {
    window.parent.postMessage({ type: type, data: data }, '*');
  }

  function ready() {
    send('driverPoliciesReady');
  }

  function getPolicies(driverId, carrierId) {
    send('getDriverPolicies', { driverId: driverId, carrierId: carrierId });
  }

  function getPolicyContent(policyId) {
    send('getPolicyContent', { policyId: policyId });
  }

  function acknowledgePolicy(policyId, driverId, signatureType, deviceInfo) {
    send('acknowledgePolicy', {
      policyId: policyId,
      driverId: driverId,
      signatureType: signatureType,
      deviceInfo: deviceInfo
    });
  }

  return {
    send: send,
    ready: ready,
    getPolicies: getPolicies,
    getPolicyContent: getPolicyContent,
    acknowledgePolicy: acknowledgePolicy
  };
})();
