var CarrierSidebar = (function () {
  'use strict';

  function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    var icon = document.getElementById('toggleIcon');
    sidebar.classList.toggle('w-56');
    sidebar.classList.toggle('w-16');
    sidebar.classList.toggle('collapsed');
    if (sidebar.classList.contains('collapsed')) {
      icon.classList.remove('fa-chevron-left');
      icon.classList.add('fa-chevron-right');
    } else {
      icon.classList.remove('fa-chevron-right');
      icon.classList.add('fa-chevron-left');
    }
  }

  function initNavigation() {
    document.querySelectorAll('.sidebar-link[data-page]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('collapsed')) toggleSidebar();
        var page = link.getAttribute('data-page');
        if (page) {
          window.parent.postMessage({ type: 'navigateTo', action: 'navigateTo', data: { page: page } }, '*');
        }
      });
    });
  }

  function autoCollapseMobile() {
    if (window.innerWidth < 768) {
      var sidebar = document.getElementById('sidebar');
      if (sidebar && !sidebar.classList.contains('collapsed')) {
        toggleSidebar();
      }
    }
  }

  function init() {
    initNavigation();
    autoCollapseMobile();
  }

  function exposeGlobals() {
    window.toggleSidebar = toggleSidebar;
  }

  return {
    init: init,
    toggleSidebar: toggleSidebar,
    exposeGlobals: exposeGlobals
  };
})();
