/**
 * dos-memory.js
 * ═══════════════════════════════════════════════════════════════════
 * Agent conversation memory accordion for DriverOS.
 * Shows a collapsible list of previous agent session summaries
 * fetched from the backend.
 *
 * Depends on: driver-os-bridge.js (DOS.bridge)
 * Provides:  DOS.memory
 * ═══════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  window.DOS = window.DOS || {};

  function createIcon(name) {
    var span = document.createElement('span');
    span.className = 'material-symbols-outlined';
    span.textContent = name;
    span.style.fontSize = '20px';
    span.style.transition = 'transform 0.2s ease';
    return span;
  }

  var memory = {
    _container: null,
    _accordionEl: null,
    _listener: null,

    render: function (containerEl) {
      if (!containerEl) return;
      this._container = containerEl;

      var self = this;

      this._listener = function (payload) {
        self._onData(payload);
      };

      if (DOS.bridge) {
        DOS.bridge.on('agentMemoryLoaded', this._listener);
        DOS.bridge.send('getAgentMemory', {});
      }
    },

    _onData: function (payload) {
      if (!payload || payload.hasMemory !== true) return;
      if (!this._container) return;

      var sessions = Array.isArray(payload.sessions) ? payload.sessions : [];
      if (sessions.length === 0) return;

      var expanded = false;

      // Accordion wrapper
      var accordion = document.createElement('div');
      accordion.className = 'dos-card';
      accordion.style.overflow = 'hidden';

      // Header (toggle)
      var header = document.createElement('button');
      header.setAttribute('type', 'button');
      header.setAttribute('aria-expanded', 'false');
      header.setAttribute('aria-label', 'Toggle previous sessions');
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.justifyContent = 'space-between';
      header.style.width = '100%';
      header.style.minHeight = '48px';
      header.style.padding = '0';
      header.style.border = 'none';
      header.style.background = 'transparent';
      header.style.cursor = 'pointer';
      header.style.fontFamily = "'Inter', sans-serif";
      header.style.webkitTapHighlightColor = 'transparent';

      var headerText = document.createElement('span');
      headerText.className = 'dos-text-subheading';
      headerText.textContent = 'Previous sessions';
      header.appendChild(headerText);

      var chevron = createIcon('expand_more');
      header.appendChild(chevron);

      // Content (collapsed by default)
      var content = document.createElement('div');
      content.style.maxHeight = '0';
      content.style.overflow = 'hidden';
      content.style.transition = 'max-height 0.3s ease';

      for (var i = 0; i < sessions.length; i++) {
        var p = document.createElement('p');
        p.className = 'dos-text-small';
        p.textContent = sessions[i].summary || sessions[i];
        p.style.fontStyle = 'italic';
        p.style.margin = '8px 0';
        content.appendChild(p);
      }

      // Toggle handler
      header.addEventListener('click', function () {
        expanded = !expanded;
        header.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        chevron.style.transform = expanded ? 'rotate(180deg)' : 'rotate(0deg)';
        content.style.maxHeight = expanded ? (content.scrollHeight + 'px') : '0';
      });

      accordion.appendChild(header);
      accordion.appendChild(content);

      this._accordionEl = accordion;
      this._container.appendChild(accordion);
    },

    destroy: function () {
      if (DOS.bridge && this._listener) {
        DOS.bridge.off('agentMemoryLoaded', this._listener);
        this._listener = null;
      }

      if (this._accordionEl && this._accordionEl.parentNode) {
        this._accordionEl.parentNode.removeChild(this._accordionEl);
        this._accordionEl = null;
      }

      this._container = null;
    }
  };

  DOS.memory = memory;

})();
