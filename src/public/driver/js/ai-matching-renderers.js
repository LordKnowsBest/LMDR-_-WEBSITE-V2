// ai-matching-renderers.js — Match card + FMCSA + AI Intel rendering
// Depends on: ai-matching-helpers.js, ai-matching-bridge.js

function renderMatchCard(match, rank) {
  const carrier = match.carrier || {};
  const enrichment = match.enrichment || {};
  const fmcsa = enrichment.fmcsa || match.fmcsa || {};
  const fromCache = match.fromCache;

  const carrierName = carrier.LEGAL_NAME || carrier.DBA_NAME || 'Unknown Carrier';
  const location = `${carrier.PHY_CITY || ''}, ${carrier.PHY_STATE || ''}`.replace(/^, |, $/g, '') || 'Location Unknown';
  const dotNumber = carrier.DOT_NUMBER || 'N/A';
  const payDisplay = carrier.PAY_CPM ? `$${carrier.PAY_CPM.toFixed(2)}` : 'N/A';
  const fleetDisplay = carrier.NBR_POWER_UNIT || 'N/A';
  const turnoverDisplay = carrier.TURNOVER_PERCENT ? `${carrier.TURNOVER_PERCENT.toFixed(0)}%` : 'N/A';
  const truckAgeDisplay = carrier.AVG_TRUCK_AGE ? `${carrier.AVG_TRUCK_AGE.toFixed(1)} yr` : 'N/A';

  const fmcsaHTML = renderFMCSASection(fmcsa, dotNumber);

  let aiIntelHTML = '';
  if (enrichment && !enrichment.error && enrichment.ai_summary) {
    aiIntelHTML = renderAIIntelBlock(enrichment);
  } else if (match.needsEnrichment) {
    if (String(dotNumber) === String(window._autoEnrichDot)) {
      // This DOT is being auto-enriched — show loading state
      aiIntelHTML = `
        <div class="ai-intel-section">
          <div class="ai-intel-loading" id="loading-${dotNumber}">
            <i class="fa-solid fa-robot fa-bounce"></i>
            <div class="ai-intel-loading-text">AI Researching...</div>
            <div class="ai-intel-loading-sub">Searching job boards & driver reviews</div>
            <div class="ai-intel-loading-progress">
              <div class="ai-intel-loading-progress-bar"></div>
            </div>
          </div>
        </div>
      `;
    } else {
      // Other matches: on-demand button
      aiIntelHTML = `
        <div class="ai-intel-section">
          <div class="ai-intel-ondemand" id="ondemand-${dotNumber}">
            <button class="btn-get-ai-profile" onclick="window.retryEnrichment('${dotNumber}')">
              <i class="fa-solid fa-brain"></i> Get AI Profile
            </button>
            <div class="ai-intel-ondemand-sub">Pay data, driver reviews & hiring intel</div>
          </div>
        </div>
      `;
    }
  }

  const tags = [];

  // Add "Applied" tag if driver has already applied
  if (appliedCarrierDOTs.has(String(dotNumber))) {
    tags.push(`<span class="match-tag applied" style="background: #10b98115; color: #10b981; border: 1px solid #10b98130; font-weight: 800;"><i class="fa-solid fa-check-circle"></i> Applied</span>`);
  }

  tags.push(`<span class="match-tag operation">${match.inferredOpType || 'Regional'}</span>`);
  tags.push(`<span class="match-tag fleet">${categorizeFleet(carrier.NBR_POWER_UNIT)}</span>`);
  if (fromCache) {
    tags.push(`<span class="match-tag cached"><i class="fa-solid fa-bolt"></i> Instant</span>`);
  }
  if (carrier.isClient) {
    tags.push(`<span class="match-tag client"><i class="fa-solid fa-star"></i> Partner</span>`);
  }

  // Add Responsiveness Signal
  const stats = match.recruiterStats;
  if (stats && stats.badge) {
    tags.push(`<span class="match-tag" style="background: ${stats.badge_color}15; color: ${stats.badge_color}; border: 1px solid ${stats.badge_color}30; font-weight: 800;"><i class="fa-solid fa-bolt-lightning"></i> ${stats.badge}</span>`);
  }

  return `
    <div class="match-card" data-dot="${dotNumber}">
      
      <div class="match-card-header">
        <div class="match-rank">${rank}</div>
        <div class="match-info">
          <div class="match-name">${escapeHtml(carrierName)}</div>
          <div class="match-location">
            <i class="fa-solid fa-location-dot"></i> ${escapeHtml(location)}
         </div>
          <div class="match-dot-number">DOT: ${dotNumber}</div>
       </div>
        <div class="match-score-block">
          <div class="match-score-value">${match.overallScore || 0}%</div>
          <div class="match-score-label">Match Score</div>
       </div>
     </div>
      
      ${fmcsaHTML}
      
      <div class="carrier-metrics">
        <div class="carrier-metric">
          <div class="carrier-metric-value">${payDisplay}</div>
          <div class="carrier-metric-label">CPM</div>
       </div>
        <div class="carrier-metric">
          <div class="carrier-metric-value">${fleetDisplay}</div>
          <div class="carrier-metric-label">Fleet Size</div>
       </div>
        <div class="carrier-metric">
          <div class="carrier-metric-value">${turnoverDisplay}</div>
          <div class="carrier-metric-label">Turnover</div>
       </div>
        <div class="carrier-metric">
          <div class="carrier-metric-value">${truckAgeDisplay}</div>
          <div class="carrier-metric-label">Truck Age</div>
       </div>
     </div>
      
      <div class="match-tags">
        ${tags.join('')}
     </div>
      
     ${match.isMutualMatch ? `
        <div class="mutual-interest-panel">
           <div class="mutual-header">
              <div class="mutual-badge">
                 <i class="fa-solid fa-handshake"></i> Mutual Match
              </div>
              <div class="mutual-strength ${match.mutualStrength || 'weak'}">
                 Signal Strength: <span>${(match.mutualStrength || 'Weak').toUpperCase()}</span>
              </div>
           </div>
           <div class="mutual-timeline">
              ${match.mutualSignals && match.mutualSignals.includes('viewed') ? `
                 <div class="mutual-event">
                    <i class="fa-solid fa-eye"></i> Carrier viewed your profile
                 </div>
              ` : ''}
               ${match.mutualSignals && match.mutualSignals.includes('pipeline') ? `
                 <div class="mutual-event">
                    <i class="fa-solid fa-user-plus"></i> Added to shortlist
                 </div>
              ` : ''}
               ${match.mutualSignals && match.mutualSignals.includes('contacted') ? `
                 <div class="mutual-event strong">
                    <i class="fa-solid fa-envelope"></i> Contacted you directly
                 </div>
              ` : ''}
           </div>
        </div>
     ` : ''}

      ${aiIntelHTML}

      ${match.rationale && match.rationale.length > 0 ? `
        <div class="match-rationale" id="rationale-${dotNumber}">
          <div class="rationale-header"><i class="fa-solid fa-list-check"></i> Why this is a match</div>
          <ul class="rationale-list">
            ${match.rationale.map(r => `
              <li class="rationale-item"><i class="fa-solid fa-check"></i> ${escapeHtml(r)}</li>
            `).join('')}
          </ul>
       </div>
      ` : ''}
      
      <div class="match-actions">
        <button class="${appliedCarrierDOTs.has(String(dotNumber)) ? 'interested-btn applied' : 'interested-btn'}"
          data-dot="${dotNumber}"
          data-name="${escapeHtml(carrierName)}"
          data-score="${match.overallScore || 0}"
          ${appliedCarrierDOTs.has(String(dotNumber)) ? 'disabled' : ''}>
          <i class="fa-solid ${appliedCarrierDOTs.has(String(dotNumber)) ? 'fa-check' : 'fa-heart'}"></i> 
          ${appliedCarrierDOTs.has(String(dotNumber)) ? 'Application Sent' : "I'm Interested"}
        </button>
        <button class="analysis-btn expand-explanation-btn" id="analysis-btn-${dotNumber}"
          data-carrier-dot="${dotNumber}" data-driver-id="${match.driverId || 'CURRENT_USER'}">
          <span>Why this job?</span> <i class="fa-solid fa-chevron-down"></i>
        </button>
        <button class="match-btn secondary" 
                onclick="window.open('https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${dotNumber}', '_blank')">
          <i class="fa-solid fa-shield-halved"></i> FMCSA
        </button>
     </div>

     <!-- Explanation Panel (Hidden by default) -->
     <div class="explanation-panel">
        <div class="explanation-content">
            <!-- Content injected via JS -->
        </div>
     </div>
   </div>
  `;
}

function renderFMCSASection(fmcsa, dotNumber) {
  if (!fmcsa || fmcsa.error) {
    return `
      <div class="fmcsa-section error">
        <div class="fmcsa-header">
          <div class="fmcsa-badge unknown">
            <i class="fa-solid fa-question-circle"></i>
            FMCSA: Verification Pending
         </div>
          <div class="fmcsa-source">
            <a href="https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${fmcsa?.dot_number || dotNumber}" target="_blank">
              <i class="fa-solid fa-external-link-alt"></i> Check FMCSA Directly
            </a>
         </div>
       </div>
        <p style="font-size: 13px; color: #92400e; margin: 0;">
          ${fmcsa?.error_message || 'Safety data is being retrieved. Check back shortly or verify directly with FMCSA.'}
        </p>
     </div>
    `;
  }

  const rating = (fmcsa.safety_rating || 'UNKNOWN').toUpperCase();
  let sectionClass = 'unknown';
  let badgeClass = 'unknown';
  let ratingDisplay = 'Not Rated';
  let ratingIcon = 'fa-question-circle';

  if (rating === 'SATISFACTORY') {
    sectionClass = '';
    badgeClass = 'satisfactory';
    ratingDisplay = 'Satisfactory';
    ratingIcon = 'fa-shield-check';
  } else if (rating === 'CONDITIONAL') {
    sectionClass = 'conditional';
    badgeClass = 'conditional';
    ratingDisplay = 'Conditional';
    ratingIcon = 'fa-triangle-exclamation';
  } else if (rating === 'UNSATISFACTORY') {
    sectionClass = 'unsatisfactory';
    badgeClass = 'unsatisfactory';
    ratingDisplay = 'Unsatisfactory';
    ratingIcon = 'fa-times-circle';
  } else if (rating === 'NOT RATED' || rating === 'N') {
    sectionClass = 'not-rated';
    badgeClass = 'not-rated';
    ratingDisplay = 'Not Rated';
    ratingIcon = 'fa-minus-circle';
  }

  const inspections = fmcsa.inspections_24mo || {};
  const driverOOS = inspections.driver_oos_rate;
  const vehicleOOS = inspections.vehicle_oos_rate;
  const nationalDriverOOS = inspections.national_avg_driver_oos || 5.51;
  const nationalVehicleOOS = inspections.national_avg_vehicle_oos || 20.72;
  const totalInspections = inspections.total || 0;

  const crashes = fmcsa.crashes_24mo || {};
  const totalCrashes = crashes.total || 0;
  const fatalCrashes = crashes.fatal || 0;

  const isAuthorized = fmcsa.is_authorized !== false && fmcsa.operating_status !== 'NOT AUTHORIZED';

  const basics = fmcsa.basics || {};
  const alerts = [];
  Object.entries(basics).forEach(([key, value]) => {
    if (value && value.alert) {
      alerts.push(formatBasicName(key));
    }
  });

  const driverOOSClass = driverOOS !== null && driverOOS !== undefined
    ? (driverOOS < nationalDriverOOS ? 'good' : driverOOS > nationalDriverOOS * 1.5 ? 'danger' : 'warning')
    : 'neutral';
  const driverOOSCompare = driverOOS !== null && driverOOS !== undefined
    ? (driverOOS < nationalDriverOOS ? 'better' : 'worse')
    : '';

  const vehicleOOSClass = vehicleOOS !== null && vehicleOOS !== undefined
    ? (vehicleOOS < nationalVehicleOOS ? 'good' : vehicleOOS > nationalVehicleOOS * 1.5 ? 'danger' : 'warning')
    : 'neutral';
  const vehicleOOSCompare = vehicleOOS !== null && vehicleOOS !== undefined
    ? (vehicleOOS < nationalVehicleOOS ? 'better' : 'worse')
    : '';

  const crashClass = totalCrashes === 0 ? 'good' : totalCrashes > 5 ? 'danger' : 'warning';

  return `
    <div class="fmcsa-section ${sectionClass}">
      <div class="fmcsa-header">
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div class="fmcsa-badge ${badgeClass}">
            <i class="fa-solid ${ratingIcon}"></i>
            FMCSA: ${ratingDisplay}
         </div>
          ${isAuthorized
      ? `<div class="fmcsa-auth-status authorized"><i class="fa-solid fa-check"></i> Authorized</div>`
      : `<div class="fmcsa-auth-status not-authorized"><i class="fa-solid fa-ban"></i> Not Authorized</div>`
    }
       </div>
        <div class="fmcsa-source">
          <i class="fa-solid fa-check-circle"></i> Federal Safety Data
          <a href="https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${fmcsa.dot_number || dotNumber}" target="_blank" style="margin-left: 8px;">
            View Full Report
          </a>
       </div>
     </div>
      
      <div class="fmcsa-grid">
        <div class="fmcsa-stat">
          <div class="fmcsa-stat-value ${driverOOSClass}">
            ${driverOOS !== null && driverOOS !== undefined ? driverOOS.toFixed(1) + '%' : 'N/A'}
         </div>
          <div class="fmcsa-stat-label">Driver OOS Rate</div>
          <div class="fmcsa-stat-compare ${driverOOSCompare}">
            ${driverOOS !== null && driverOOS !== undefined
      ? (driverOOS < nationalDriverOOS ? '✓ Below' : '↑ Above') + ` ${nationalDriverOOS}% avg`
      : 'Nat\'l avg: ' + nationalDriverOOS + '%'}
         </div>
       </div>
        <div class="fmcsa-stat">
          <div class="fmcsa-stat-value ${vehicleOOSClass}">
            ${vehicleOOS !== null && vehicleOOS !== undefined ? vehicleOOS.toFixed(1) + '%' : 'N/A'}
         </div>
          <div class="fmcsa-stat-label">Vehicle OOS Rate</div>
          <div class="fmcsa-stat-compare ${vehicleOOSCompare}">
            ${vehicleOOS !== null && vehicleOOS !== undefined
      ? (vehicleOOS < nationalVehicleOOS ? '✓ Below' : '↑ Above') + ` ${nationalVehicleOOS}% avg`
      : 'Nat\'l avg: ' + nationalVehicleOOS + '%'}
         </div>
       </div>
        <div class="fmcsa-stat">
          <div class="fmcsa-stat-value ${crashClass}">
            ${totalCrashes}
         </div>
          <div class="fmcsa-stat-label">Crashes (24mo)</div>
          <div class="fmcsa-stat-compare">
            ${fatalCrashes > 0 ? `<span style="color: var(--color-danger);">${fatalCrashes} fatal</span>` : 'No fatalities'}
         </div>
       </div>
        <div class="fmcsa-stat">
          <div class="fmcsa-stat-value neutral">${totalInspections || 'N/A'}</div>
          <div class="fmcsa-stat-label">Inspections</div>
          <div class="fmcsa-stat-compare">Last 24 months</div>
       </div>
     </div>
      
      ${alerts.length > 0 ? `
        <div class="basic-alerts">
          <div class="basic-alerts-title">
            <i class="fa-solid fa-triangle-exclamation"></i> BASIC Score Alerts
         </div>
          ${alerts.map(a => `
            <div class="basic-alert-item">
              <i class="fa-solid fa-exclamation-circle"></i> ${a}
           </div>
          `).join('')}
       </div>
      ` : ''}
      
      ${fmcsa.fromCache ? `
        <div style="margin-top: 12px; font-size: 11px; color: #94a3b8;">
          <i class="fa-solid fa-clock"></i> Data cached ${fmcsa.cache_age_days ? fmcsa.cache_age_days + ' days ago' : 'recently'}
       </div>
      ` : ''}
   </div>
  `;
}

function renderAIIntelBlock(data) {
  const confidence = data.data_confidence || 'Low';
  const confidenceClass = confidence.toLowerCase();
  const isLowConfidence = confidence === 'Low' || confidence === 'None';

  const pros = safeJsonParse(data.sentiment_pros);
  const cons = safeJsonParse(data.sentiment_cons);
  const sources = safeJsonParse(data.sources_found);

  const hasPayData = checkValidData(data.pay_cpm_range);
  const hasSignOnBonus = checkValidData(data.sign_on_bonus);
  const hasAnyIntel = hasPayData || checkValidData(data.freight_types) || checkValidData(data.home_time);

  // Use partial styling for low confidence
  const containerClass = isLowConfidence && hasAnyIntel ? 'ai-intel-partial' : 'ai-intel-content';

  return `
    <div class="ai-intel-section">
      <div class="${containerClass}">
        <div class="ai-intel-header">
          <span class="ai-intel-title">
            <i class="fa-solid fa-brain"></i> AI Market Intel
          </span>
          <span class="confidence-pill ${confidenceClass}">${confidence} Confidence</span>
       </div>
        
        ${isLowConfidence ? `
          <div class="ai-intel-partial-notice">
            <i class="fa-solid fa-info-circle"></i>
            Limited data available. Some details inferred from industry standards.
         </div>
        ` : ''}

        <div class="ai-intel-body">
          
          ${hasPayData ? `
            <div class="pay-highlight-box">
              <div class="pay-highlight-icon"><i class="fa-solid fa-dollar-sign"></i></div>
              <div>
                <div class="pay-highlight-value">${escapeHtml(data.pay_cpm_range)}</div>
                <div class="pay-highlight-bonus">
                  ${hasSignOnBonus ? 'Sign-on: ' + escapeHtml(data.sign_on_bonus) : 'Based on 2025 market data'}
               </div>
             </div>
           </div>
          ` : ''}
          
          <div class="ai-intel-grid">
            ${renderIntelItem('Freight', data.freight_types, isLowConfidence)}
            ${renderIntelItem('Routes', data.route_types, isLowConfidence)}
            ${renderIntelItem('Home Time', data.home_time, isLowConfidence)}
            ${renderIntelItem('Benefits', data.benefits, isLowConfidence)}
            ${renderIntelItem('Hiring Status', data.hiring_status, false)}
            ${renderIntelItem('Driver Sentiment', data.driver_sentiment, false)}
         </div>
          
          ${(pros.length > 0 || cons.length > 0) ? `
            <div class="sentiment-row">
              <div class="sentiment-title"><i class="fa-solid fa-comments"></i> Driver Consensus</div>
              <div class="sentiment-pills">
                ${pros.slice(0, 3).map(p => `<span class="sentiment-pill pro"><i class="fa-solid fa-thumbs-up"></i> ${escapeHtml(p)}</span>`).join('')}
                ${cons.slice(0, 3).map(c => `<span class="sentiment-pill con"><i class="fa-solid fa-thumbs-down"></i> ${escapeHtml(c)}</span>`).join('')}
             </div>
           </div>
          ` : ''}
          
          ${data.ai_summary ? `<div class="ai-summary">${formatAISummary(data.ai_summary)}</div>` : ''}
          
          ${sources.length > 0 ? `
            <div class="ai-sources-container">
              <div class="ai-sources-label"><i class="fa-solid fa-link"></i> Sources</div>
              <div class="ai-sources-list">
                ${sources.map(src => {
    const domain = extractDomain(src);
    const isUrl = src.startsWith('http');
    return isUrl
      ? `<a href="${src}" target="_blank" class="source-badge">
                         <i class="fa-solid fa-arrow-up-right-from-square"></i> ${domain}
                       </a>`
      : `<span class="source-text-only">${escapeHtml(src)}</span>`;
  }).join('')}
             </div>
           </div>
          ` : ''}

       </div>
     </div>
   </div>
  `;
}

function renderErrorState(data, dotNumber, carrier) {
  return `
    <div class="ai-intel-partial error">
      <div style="margin-bottom: 8px;">
        <i class="fa-solid fa-triangle-exclamation"></i>
        AI profile unavailable for <strong>${carrier.LEGAL_NAME || 'this carrier'}</strong>.
      </div>
      <button class="btn-get-ai-profile btn-retry" onclick="window.retryEnrichment('${dotNumber}')">
        <i class="fa-solid fa-rotate-right"></i> Retry AI Profile
      </button>
   </div>
  `;
}

function renderIntelItem(label, value) {
  if (!value) return '';
  const isGeneric = !checkValidData(value);

  // Don't show items that are clearly just placeholders
  if (isGeneric && ['Contact Carrier', 'Unknown', 'N/A'].includes(value)) {
    return '';
  }

  return `
    <div class="ai-intel-item">
      <strong>${label}</strong>
      <span>${escapeHtml(value)}</span>
   </div>
    `;
}

function renderApplications(apps) {
  const list = document.getElementById('applicationsList');
  if (!list) return;

  if (!apps || apps.length === 0) {
    list.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #64748b;">
                <i class="fa-solid fa-file-circle-xmark" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                <h3>No Applications Yet</h3>
                <p>When you apply to carriers, they will appear here.</p>
                <button class="modal-btn primary" onclick="document.querySelector('.nav-tab[data-tab=\\'find\\']').click()" style="margin-top: 16px; max-width: 200px; margin-left: auto; margin-right: auto;">Find Carriers</button>
            </div>
        `;
    return;
  }

  const html = apps.map(app => `
        <div class="app-card">
          <div class="app-header">
            <div>
              <div class="app-carrier-name">${app.carrierName}</div>
              <div class="app-date">Applied ${new Date(app.submittedDate).toLocaleDateString()}</div>
            </div>
            <div class="app-status-badge ${app.status}">
              ${getStatusIcon(app.status)} ${formatAppStatus(app.status)}
            </div>
          </div>
          
          <div class="app-timeline">
            ${(app.statusHistory || app.timeline || []).map((event, index, arr) => `
                <div class="timeline-item ${index === arr.length - 1 ? 'active' : ''}">
                  <div class="timeline-dot"></div>
                  <div class="timeline-content">
                    <div class="timeline-status">${event.status}</div>
                    <div class="timeline-date">${new Date(event.date).toLocaleString()}</div>
                  </div>
                </div>
            `).join('')}
          </div>
        </div>
    `).join('');

  list.innerHTML = html;

  // Update badge
  const badge = document.getElementById('appCountBadge');
  if (badge) {
    badge.textContent = apps.length;
    badge.style.display = apps.length > 0 ? 'inline-block' : 'none';
  }
}

