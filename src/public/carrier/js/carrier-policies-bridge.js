var CarrierPoliciesBridge = (function () {
  'use strict';

  function postToParent(type, data) {
    window.parent.postMessage({ type: type, data: data }, '*');
  }

  function listen(handlers) {
    window.addEventListener('message', function (event) {
      var msg = event.data || {};
      var type = msg.type;
      if (type && handlers[type]) handlers[type](msg.data);
    });
  }

  return { postToParent: postToParent, listen: listen };
})();
