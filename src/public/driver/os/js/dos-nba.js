/**
 * dos-nba.js
 * ═══════════════════════════════════════════════════════════════════
 * Next Best Action chip registry for DriverOS home screen.
 * Renders a horizontally scrollable row of dismissable action chips
 * that route to specific views.
 *
 * Depends on: driver-os-core.js (DOS.views)
 * Provides:  DOS.nba
 * ═══════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  window.DOS = window.DOS || {};

  var STORAGE_PREFIX = 'dos-nba-dismissed-';
  var MAX_VISIBLE = 3;

  var CHIPS = [
    { icon: 'person',         text: 'Complete your profile', targetView: 'career',     variant: 'amber' },
    { icon: 'upload_file',    text: 'Upload documents',      targetView: 'documents',  variant: 'amber' },
    { icon: 'search',         text: 'Find matches',          targetView: 'matching',   variant: 'blue'  },
    { icon: 'emoji_events',   text: 'Check challenges',      targetView: 'challenges', variant: 'blue'  },
    { icon: 'forum',          text: 'Join the community',    targetView: 'forums',     variant: 'blue'  },
    { icon: 'local_shipping', text: 'Road utilities',        targetView: 'road',       variant: 'blue'  }
  ];

  function isDismissed(index) {
    try { return sessionStorage.getItem(STORAGE_PREFIX + index) === '1'; }
    catch (e) { return false; }
  }

  function setDismissed(index) {
    try { sessionStorage.setItem(STORAGE_PREFIX + index, '1'); }
    catch (e) { /* storage unavailable */ }
  }

  function createIcon(name) {
    var span = document.createElement('span');
    span.className = 'material-symbols-outlined';
    span.textContent = name;
    span.style.fontSize = '18px';
    return span;
  }

  function createChip(chipDef, index) {
    var chip = document.createElement('button');
    chip.className = 'dos-chip dos-chip-' + chipDef.variant;
    chip.style.cursor = 'pointer';
    chip.style.border = 'none';
    chip.style.minHeight = '48px';
    chip.style.flexShrink = '0';
    chip.style.whiteSpace = 'nowrap';
    chip.style.fontFamily = "'Inter', sans-serif";
    chip.style.webkitTapHighlightColor = 'transparent';
    chip.setAttribute('type', 'button');
    chip.setAttribute('aria-label', chipDef.text);

    // Icon
    chip.appendChild(createIcon(chipDef.icon));

    // Text
    var textSpan = document.createElement('span');
    textSpan.textContent = chipDef.text;
    textSpan.style.marginLeft = '4px';
    textSpan.style.marginRight = '4px';
    chip.appendChild(textSpan);

    // Dismiss X
    var dismiss = document.createElement('span');
    dismiss.className = 'material-symbols-outlined';
    dismiss.textContent = 'close';
    dismiss.style.fontSize = '16px';
    dismiss.style.opacity = '0.6';
    dismiss.style.cursor = 'pointer';
    dismiss.style.minWidth = '48px';
    dismiss.style.minHeight = '48px';
    dismiss.style.display = 'inline-flex';
    dismiss.style.alignItems = 'center';
    dismiss.style.justifyContent = 'center';
    dismiss.style.marginRight = '-8px';
    dismiss.setAttribute('role', 'button');
    dismiss.setAttribute('aria-label', 'Dismiss ' + chipDef.text);

    dismiss.addEventListener('click', function (e) {
      e.stopPropagation();
      setDismissed(index);
      if (chip.parentNode) chip.parentNode.removeChild(chip);
    });

    chip.appendChild(dismiss);

    // Navigate on tap
    chip.addEventListener('click', function () {
      if (DOS.views && typeof DOS.views.mount === 'function') {
        DOS.views.mount(chipDef.targetView);
      }
    });

    return chip;
  }

  var nba = {
    render: function (containerEl) {
      if (!containerEl) return;

      var row = document.createElement('div');
      row.className = 'dos-scroll-row';

      var rendered = 0;
      for (var i = 0; i < CHIPS.length; i++) {
        if (rendered >= MAX_VISIBLE) break;
        if (isDismissed(i)) continue;
        row.appendChild(createChip(CHIPS[i], i));
        rendered++;
      }

      if (rendered > 0) {
        containerEl.appendChild(row);
      }
    },

    reset: function () {
      for (var i = 0; i < CHIPS.length; i++) {
        try { sessionStorage.removeItem(STORAGE_PREFIX + i); }
        catch (e) { /* storage unavailable */ }
      }
    }
  };

  DOS.nba = nba;

})();
