/**
 * dos-market.js
 * ═══════════════════════════════════════════════════════════════════
 * Market condition pill for DriverOS.
 * Fetches market signals via bridge and renders a colored pill
 * indicating HOT / SOFT / NEUTRAL freight market conditions.
 *
 * Depends on: driver-os-bridge.js (DOS.bridge)
 * Provides:  DOS.market
 * ═══════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  window.DOS = window.DOS || {};

  var PILL_CONFIG = {
    HOT:     { cls: 'dos-chip dos-chip-red',  icon: 'local_fire_department', text: 'Hot Market'    },
    SOFT:    { cls: 'dos-chip dos-chip-blue', icon: 'trending_down',         text: 'Soft Market'   },
    NEUTRAL: { cls: 'dos-chip dos-chip-gray', icon: 'trending_flat',         text: 'Stable Market' }
  };

  function createIcon(name) {
    var span = document.createElement('span');
    span.className = 'material-symbols-outlined';
    span.textContent = name;
    span.style.fontSize = '18px';
    return span;
  }

  var market = {
    condition: null,
    payFactor: null,
    _pillEl: null,

    init: function () {
      var self = this;

      if (!DOS.bridge) {
        console.warn('[DOS Market] Bridge not available');
        return;
      }

      DOS.bridge.on('marketSignalsLoaded', function (payload) {
        if (payload && payload.condition) {
          self.condition = payload.condition;
        }
        if (payload && typeof payload.payFactor === 'number') {
          self.payFactor = payload.payFactor;
        }

        // Re-render if pill container exists
        if (self._pillContainer) {
          self._renderInto(self._pillContainer);
        }
      });

      DOS.bridge.send('getMarketSignals', {});
    },

    renderPill: function (containerEl) {
      if (!containerEl) return;
      this._pillContainer = containerEl;

      // If data already loaded, render immediately
      if (this.condition) {
        this._renderInto(containerEl);
      }
      // Otherwise wait for bridge callback (registered in init)
    },

    _renderInto: function (containerEl) {
      // Remove old pill if present
      if (this._pillEl && this._pillEl.parentNode) {
        this._pillEl.parentNode.removeChild(this._pillEl);
      }

      var cfg = PILL_CONFIG[this.condition] || PILL_CONFIG.NEUTRAL;

      var pill = document.createElement('span');
      pill.className = cfg.cls;
      pill.style.minHeight = '48px';

      pill.appendChild(createIcon(cfg.icon));

      var textNode = document.createElement('span');
      textNode.textContent = cfg.text;
      textNode.style.marginLeft = '4px';
      pill.appendChild(textNode);

      this._pillEl = pill;
      containerEl.appendChild(pill);
    }
  };

  DOS.market = market;

})();
