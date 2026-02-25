// ai-matching-helpers.js — Pure utility functions for AI Matching
// Loaded first (no dependencies)

function showToast(message, type = 'error', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:99999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const bg = type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#3b82f6';
  toast.style.cssText = `background:${bg};color:#fff;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.3);pointer-events:auto;opacity:0;transition:opacity 0.3s;max-width:400px;text-align:center;`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.style.opacity = '1');
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function formatBasicName(key) {
  const names = {
    'unsafe_driving': 'Unsafe Driving',
    'hours_of_service': 'Hours of Service',
    'driver_fitness': 'Driver Fitness',
    'drugs_alcohol': 'Controlled Substances/Alcohol',
    'vehicle_maintenance': 'Vehicle Maintenance',
    'hazmat': 'Hazardous Materials',
    'crash_indicator': 'Crash Indicator'
  };
  return names[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatAISummary(text) {
  if (!text) return '';
  // Split on bullet markers (•) or newlines
  const lines = text.split(/\n|(?=• )/).map(l => l.trim()).filter(Boolean);
  const isBulleted = lines.some(l => l.startsWith('•'));
  if (isBulleted) {
    const items = lines
      .map(l => l.replace(/^[•-]\s*/, ''))
      .filter(l => {
        if (!l) return false;
        // Drop lines whose value portion is literally "null", "undefined", or empty
        const colonIdx = l.indexOf(':');
        if (colonIdx !== -1) {
          const val = l.slice(colonIdx + 1).trim();
          if (val === 'null' || val === 'undefined' || val === '') return false;
        }
        return true;
      })
      .map(l => {
        // Bold **word** → <strong>word</strong>, then escape the rest
        const safe = escapeHtml(l);
        return safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      });
    if (!items.length) return '';
    return '<ul class="ai-summary-bullets">' + items.map(i => `<li>${i}</li>`).join('') + '</ul>';
  }
  // Fallback: plain paragraph (old-style summaries from cache)
  return escapeHtml(text);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function categorizeFleet(units) {
  if (!units) return 'Unknown';
  if (units < 50) return 'Small Fleet';
  if (units < 500) return 'Mid-Size';
  return 'Large Fleet';
}

function extractDomain(url) {
  if (!url || !url.startsWith('http')) return url;
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '');
  } catch (e) {
    return 'External Source';
  }
}

function safeJsonParse(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch (e) { return []; }
  }
  return [];
}

function checkValidData(val) {
  if (!val) return false;
  const invalid = ['not found', 'n/a', 'none found', 'contact carrier', 'unknown', 'market rate'];
  return !invalid.includes(val.toLowerCase());
}

function highlightField(el) {
  if (!el) return;
  el.classList.add('highlight-pulse');
  setTimeout(() => el.classList.remove('highlight-pulse'), 2000);
}

function stripHtml(str) {
  if (typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Safe text content setter - use instead of innerHTML for user content
function safeSetText(element, text) {
  if (element) element.textContent = text;
}

function formatStatus(status) {
  const labels = {
    'applied': 'Applied',
    'in_review': 'In Review',
    'contacted': 'Contacted',
    'offer': 'Offer Received',
    'hired': 'Hired'
  };
  return labels[status] || status;
}

function formatAppStatus(status) {
  const labels = {
    'applied': 'Applied',
    'in_review': 'In Review',
    'viewed': 'Viewed',
    'contacted': 'Contacted',
    'offer': 'Offer Received',
    'hired': 'Hired',
    'rejected': 'Not Selected',
    'withdrawn': 'Withdrawn'
  };
  return labels[status] || status;
}

function getStatusIcon(status) {
  const icons = {
    'applied': '<i class="fa-solid fa-paper-plane"></i>',
    'in_review': '<i class="fa-solid fa-clipboard-check"></i>',
    'viewed': '<i class="fa-solid fa-eye"></i>',
    'contacted': '<i class="fa-solid fa-phone"></i>',
    'hired': '<i class="fa-solid fa-check-circle"></i>',
    'rejected': '<i class="fa-solid fa-circle-xmark"></i>',
    'withdrawn': '<i class="fa-solid fa-ban"></i>'
  };
  return icons[status] || '<i class="fa-solid fa-circle-info"></i>';
}

