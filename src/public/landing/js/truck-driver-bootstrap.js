(function () {
  function postResize() {
    try {
      var height = Math.max(
        document.body ? document.body.scrollHeight : 0,
        document.documentElement ? document.documentElement.scrollHeight : 0
      );
      window.parent.postMessage({ type: 'resize', height: height }, '*');
    } catch (err) {
      // Ignore cross-window messaging errors.
    }
  }

  function showInitError() {
    var banner = document.getElementById('initErrorBanner');
    if (banner) {
      banner.style.display = 'block';
    }
  }

  function safeInit() {
    try {
      if (!window.TruckDriverLogic || !window.TruckDriverAnimations) {
        console.error('[LMDR] Critical modules missing.', {
          TruckDriverLogic: !!window.TruckDriverLogic,
          TruckDriverAnimations: !!window.TruckDriverAnimations
        });
        showInitError();
        return;
      }
      window.TruckDriverAnimations.init();
      window.TruckDriverLogic.init();
      postResize();
    } catch (err) {
      console.error('[LMDR] Init failed:', err);
      showInitError();
    }
  }

  function init() {
    safeInit();
    postResize();
    setTimeout(postResize, 250);
    setTimeout(postResize, 1000);
    setTimeout(postResize, 2000);
    setTimeout(postResize, 3500);

    window.addEventListener('load', postResize);
    window.addEventListener('orientationchange', postResize);
    window.addEventListener('resize', postResize);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        postResize();
      });
    }

    if (typeof ResizeObserver !== 'undefined') {
      var observer = new ResizeObserver(function () {
        postResize();
      });
      if (document.body) {
        observer.observe(document.body);
      }
    }
  }

  window.TruckDriverBootstrap = { init: init };
})();
