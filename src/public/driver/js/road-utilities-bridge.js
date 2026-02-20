/* =========================================
   DRIVER ROAD UTILITIES — Bridge Module
   Depends on: RoadUtilitiesConfig
   Handles all postMessage communication with Wix page code
   ========================================= */
var RoadUtilitiesBridge = (function () {
  'use strict';

  function send(type, data) {
    window.parent.postMessage({ type: type, data: data }, '*');
  }

  function searchParking(lat, lng, radius) {
    send('searchParking', { lat: lat, lng: lng, radius: radius });
  }

  function searchFuel(params) {
    send('searchFuel', params);
  }

  function searchWeighStations(lat, lng, radius, state, bypassServices) {
    send('searchWeighStations', { lat: lat, lng: lng, radius: radius, state: state, bypassServices: bypassServices });
  }

  function getWeather(routePoints) {
    send('getWeather', { routePoints: routePoints });
  }

  function getRoadConditions(routePoints) {
    send('getRoadConditions', { routePoints: routePoints });
  }

  function getTruckRestrictions(routePoints, truckSpecs) {
    send('getTruckRestrictions', { routePoints: routePoints, truckSpecs: truckSpecs });
  }

  function reportStationStatus(data) {
    send('reportStationStatus', data);
  }

  function linkFuelCard(data) {
    send('linkFuelCard', data);
  }

  function getDriverFuelCards() {
    send('getDriverFuelCards');
  }

  function getDriverBypassServices() {
    send('getDriverBypassServices');
  }

  function saveDriverBypassServices(data) {
    send('saveDriverBypassServices', data);
  }

  function submitReview(locationId, reviewData) {
    send('submitReview', { locationId: locationId, reviewData: reviewData });
  }

  function getReviews(locationId, options) {
    send('getReviews', { locationId: locationId, options: options });
  }

  function reportCondition(locationId, reportData) {
    send('reportCondition', { locationId: locationId, reportData: reportData });
  }

  function subscribeAlerts(preferences) {
    send('subscribeAlerts', { preferences: preferences });
  }

  function notifyTabSwitch(tabId) {
    send('tabSwitch', tabId);
  }

  function getParkingDetails(locationId) {
    send('getParkingDetails', { locationId: locationId });
  }

  /* --- Unified message listener --- */
  function listen(handlers) {
    window.addEventListener('message', function (event) {
      var msg = event.data || {};
      var type = msg.type;
      var data = msg.data;
      if (type && handlers[type]) {
        handlers[type](data, msg);
      }
    });
  }

  return {
    send: send,
    listen: listen,
    searchParking: searchParking,
    searchFuel: searchFuel,
    searchWeighStations: searchWeighStations,
    getWeather: getWeather,
    getRoadConditions: getRoadConditions,
    getTruckRestrictions: getTruckRestrictions,
    reportStationStatus: reportStationStatus,
    linkFuelCard: linkFuelCard,
    getDriverFuelCards: getDriverFuelCards,
    getDriverBypassServices: getDriverBypassServices,
    saveDriverBypassServices: saveDriverBypassServices,
    submitReview: submitReview,
    getReviews: getReviews,
    reportCondition: reportCondition,
    subscribeAlerts: subscribeAlerts,
    notifyTabSwitch: notifyTabSwitch,
    getParkingDetails: getParkingDetails
  };
})();
