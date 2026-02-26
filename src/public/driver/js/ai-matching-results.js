// ai-matching-results.js — Results display, enrichment, profile pre-fill
// Depends on: ai-matching-helpers.js, ai-matching-bridge.js, ai-matching-renderers.js

function renderFilteredResults() {
  let displayMatches = [...allMatches];

  // 1. Filter
  if (filterMutualOnly) {
    displayMatches = displayMatches.filter(m => m.isMutualMatch);
  }

  // 2. Sort
  displayMatches.sort((a, b) => {
    if (currentSort === 'mutual') {
      // Mutual interest first, then strength
      if (a.isMutualMatch && !b.isMutualMatch) return -1;
      if (!a.isMutualMatch && b.isMutualMatch) return 1;

      if (a.isMutualMatch && b.isMutualMatch) {
        const strengthOrder = { 'strong': 3, 'moderate': 2, 'weak': 1 };
        const scoreA = strengthOrder[a.mutualStrength] || 0;
        const scoreB = strengthOrder[b.mutualStrength] || 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
      }
    } else if (currentSort === 'pay') {
      const payA = a.carrier?.PAY_CPM || 0;
      const payB = b.carrier?.PAY_CPM || 0;
      if (payA !== payB) return payB - payA;
    }

    // Default / Tie-breaker: Overall Score
    const scoreA = a.overallScore || 0;
    const scoreB = b.overallScore || 0;
    return scoreB - scoreA;
  });

  currentMatches = displayMatches; // Update current view reference

  if (displayMatches.length === 0) {
    matchesList.innerHTML = `
          <div class="no-results">
            <i class="fa-solid fa-truck-ramp-box"></i>
            <h3>No Matches Found</h3>
            <p>Try adjusting your filters or checking back later.</p>
         </div>
        `;
    matchCountEl.textContent = '0';
  } else {
    matchesList.innerHTML = displayMatches.map((match, index) =>
      renderMatchCard(match, index + 1)
    ).join('');

    // Re-attach listeners
    document.querySelectorAll('.interested-btn').forEach(btn => {
      btn.addEventListener('click', handleInterestClick);
    });
    matchCountEl.textContent = displayMatches.length;
  }
}

// ── Async Option B polling loop ───────────────────────────────────────────────

let _asyncPollInterval = null;
let _asyncPollTimeout  = null;
const POLL_INTERVAL_MS = 3000;
const POLL_MAX_MS      = 90000;

const LOADING_STEPS_ASYNC = [
  { id: 'step1', text: 'Embedding your driver profile...' },
  { id: 'step2', text: 'Scanning 600,000+ carriers...' },
  { id: 'step3', text: 'Ranking semantic matches...' },
  { id: 'step4', text: 'Enriching top results...' },
];

function startAsyncPolling(jobId) {
  stopAsyncPolling(); // clear any previous poll

  let stepIndex = 0;
  function advanceStep() {
    if (stepIndex >= LOADING_STEPS_ASYNC.length) return;
    const steps = LOADING_STEPS_ASYNC;
    for (let j = 0; j < stepIndex; j++) {
      const prev = document.getElementById(steps[j].id);
      if (prev) {
        prev.classList.remove('active');
        prev.classList.add('complete');
        const icon = prev.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-check';
      }
    }
    const curr = document.getElementById(steps[stepIndex].id);
    if (curr) {
      curr.classList.add('active');
      const icon = curr.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-circle-notch fa-spin';
      const label = curr.querySelector('.step-label, span:last-child, p');
      if (label && steps[stepIndex].text) label.textContent = steps[stepIndex].text;
    }
    stepIndex++;
  }

  advanceStep();
  const stepTimer = setInterval(advanceStep, 7000);

  _asyncPollInterval = setInterval(() => {
    sendToWix('pollSearchJob', { jobId });
  }, POLL_INTERVAL_MS);

  _asyncPollTimeout = setTimeout(() => {
    stopAsyncPolling();
    clearInterval(stepTimer);
    showError('Search timed out. Please try again.');
  }, POLL_MAX_MS);

  // Return cleanup for stepTimer
  return stepTimer;
}

function stopAsyncPolling() {
  if (_asyncPollInterval) { clearInterval(_asyncPollInterval); _asyncPollInterval = null; }
  if (_asyncPollTimeout)  { clearTimeout(_asyncPollTimeout);   _asyncPollTimeout  = null; }
}

// Called when Velo sends 'searchJobStarted' — kicks off polling
window._handleSearchJobStarted = function(data) {
  const { jobId } = data;
  if (!jobId) return;
  console.log('[async] Search job started:', jobId);
  window._currentJobId = jobId;
  showLoading(true); // true = async mode (shows different step labels)
  const stepTimer = startAsyncPolling(jobId);
  window._asyncStepTimer = stepTimer;
};

// Called when Velo sends 'searchJobStatus'
window._handleSearchJobStatus = function(data) {
  if (data.status === 'FAILED') {
    stopAsyncPolling();
    if (window._asyncStepTimer) clearInterval(window._asyncStepTimer);
    showError(data.error || 'Search failed. Please try again.');
  }
  // PROCESSING: continue polling (Velo will send another event when complete)
};

function showError(msg) {
  hideLoading();
  formSection.style.display = '';
  const existing = document.getElementById('searchErrorBanner');
  if (existing) existing.remove();
  const banner = document.createElement('div');
  banner.id = 'searchErrorBanner';
  banner.className = 'search-error-banner';
  banner.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${msg}`;
  if (formSection) formSection.insertAdjacentElement('beforebegin', banner);
}

// ── Loading state (shared sync + async) ──────────────────────────────────────

function showLoading(asyncMode = false) {
  formSection.style.display = 'none';
  const errorBanner = document.getElementById('searchErrorBanner');
  if (errorBanner) errorBanner.remove();
  loadingSection.classList.add('active');
  resultsSection.style.display = ''; // Clear any inline override
  resultsSection.classList.remove('active');

  if (asyncMode) return; // async mode: polling loop drives step animation

  const steps = ['step1', 'step2', 'step3', 'step4'];
  steps.forEach((id, i) => {
    setTimeout(() => {
      for (let j = 0; j < i; j++) {
        const prev = document.getElementById(steps[j]);
        if (prev) {
          prev.classList.remove('active');
          prev.classList.add('complete');
          const icon = prev.querySelector('i');
          if (icon) icon.className = 'fa-solid fa-check';
        }
      }
      const curr = document.getElementById(id);
      if (curr) {
        curr.classList.add('active');
        const icon = curr.querySelector('i');
        if (icon) icon.className = 'fa-solid fa-circle-notch fa-spin';
      }
    }, i * 800);
  });
}

function hideLoading() {
  loadingSection.classList.remove('active');
}

function showResults(data) {
  hideLoading();
  formSection.style.display = 'none';
  resultsSection.style.display = ''; // Clear any inline override
  resultsSection.classList.add('active');
  const errorBanner = document.getElementById('searchErrorBanner');
  if (errorBanner) errorBanner.remove();

  allMatches = data.matches || [];
  currentMatches = allMatches;
  window._autoEnrichDot = data.autoEnrichDot || null;

  // Update stats based on full data
  totalScoredEl.textContent = data.totalScored || 0;

  // Phase 1: Merge mutual interests if available
  if (mutualInterestMap.size > 0) {
    allMatches.forEach(m => {
      const interest = mutualInterestMap.get(String(m.carrier?.DOT_NUMBER));
      if (interest) {
        m.isMutualMatch = true;
        m.mutualStrength = interest.strength || 'weak';
        m.mutualSignals = interest.signals || ['viewed'];
      }
    });
  }

  // Tier status from response
  const isPremium = data.isPremium || false;
  userStatus.isPremium = isPremium;
  userStatus.tier = isPremium ? 'premium' : 'free';

  // Render with current filters
  renderFilteredResults();

  // Update tier status from response - already done above


  // Update tier badge
  if (userTierBadge) {
    if (isPremium) {
      userTierBadge.innerHTML = '<span class="premium-badge"><i class="fa-solid fa-crown"></i> Premium</span>';
    } else {
      userTierBadge.innerHTML = '<span class="free-badge"><i class="fa-solid fa-user"></i> Free Tier</span>';
    }
  }

  // Show appropriate banner
  if (isPremium) {
    if (upsellBanner) upsellBanner.style.display = 'none';
    if (premiumBanner) premiumBanner.style.display = 'flex';
  } else {
    if (premiumBanner) premiumBanner.style.display = 'none';

    // Show upsell if more matches available
    const totalMatches = data.totalMatches || data.totalScored || 0;
    const hiddenCount = Math.max(0, Math.min(totalMatches - currentMatches.length, 8));

    if (data.upsellMessage || hiddenCount > 0) {
      if (upsellBanner) upsellBanner.style.display = 'flex';
      if (hiddenMatchCount) hiddenMatchCount.textContent = hiddenCount;
      if (upsellText && data.upsellMessage) {
        upsellText.textContent = data.upsellMessage;
      }
    } else {
      if (upsellBanner) upsellBanner.style.display = 'none';
    }
  }

  // Wire up signup/login buttons
  const signupBtn = document.getElementById('signupBtn');
  const loginBtn = document.getElementById('loginBtn');

  if (signupBtn) {
    signupBtn.onclick = () => sendToWix('navigateToSignup', {});
  }
  if (loginBtn) {
    loginBtn.onclick = () => sendToWix('navigateToLogin', {});
  }
}

function updateCardEnrichment(data) {
  const dotNumber = data.dot_number;
  const card = document.querySelector(`[data-dot="${dotNumber}"]`);
  if (!card) {
    console.log('Card not found for DOT:', dotNumber);
    return;
  }

  // Find the matching carrier data
  const matchData = currentMatches.find(m => String(m.carrier?.DOT_NUMBER) === String(dotNumber));
  const carrier = matchData?.carrier || {};

  let container = card.querySelector('.ai-intel-section');
  if (!container) {
    const actionsDiv = card.querySelector('.match-actions');
    if (actionsDiv) {
      container = document.createElement('div');
      container.className = 'ai-intel-section';
      actionsDiv.parentNode.insertBefore(container, actionsDiv);
    }
  }

  if (!container) return;

  // Handle loading state
  if (data.status === 'loading') {
    container.innerHTML = `
      <div class="ai-intel-loading">
        <i class="fa-solid fa-robot fa-bounce"></i>
        <div class="ai-intel-loading-text">${data.message || 'AI Researching...'}</div>
        <div class="ai-intel-loading-sub">
          ${data.position ? `Carrier ${data.position} of ${data.total}` : 'Searching job boards & reviews...'}
       </div>
        <div class="ai-intel-loading-progress">
          <div class="ai-intel-loading-progress-bar"></div>
       </div>
     </div>
    `;
    return;
  }

  // Handle "building" state — enrichment running in background, retry to get cached result
  if (data.building || data.status === 'building') {
    container.innerHTML = `
      <div class="ai-intel-ondemand" id="ondemand-${dotNumber}">
        <i class="fa-solid fa-microchip" style="font-size:24px; color:#8b5cf6; margin-bottom:8px;"></i>
        <div style="color:#e2e8f0; font-weight:600; margin-bottom:4px;">AI Profile Building</div>
        <div class="ai-intel-ondemand-sub" style="margin-bottom:12px;">Analysis takes 10-15 seconds. Click below when ready.</div>
        <button class="btn-get-ai-profile" onclick="window.retryEnrichment('${dotNumber}')">
          <i class="fa-solid fa-rotate-right"></i> Load AI Profile
        </button>
      </div>
    `;
    return;
  }

  // Handle error state - use improved error renderer
  if (data.error || data.status === 'error') {
    container.innerHTML = renderErrorState(data, dotNumber, carrier).replace('<div class="ai-intel-section">', '').replace('</div><!-- end -->', '');
    return;
  }

  // Update FMCSA section if present in the enrichment
  if (data.fmcsa && !data.fmcsa.error) {
    const fmcsaContainer = card.querySelector('.fmcsa-section');
    if (fmcsaContainer) {
      const newFmcsaHTML = renderFMCSASection(data.fmcsa, dotNumber);
      const temp = document.createElement('div');
      temp.innerHTML = newFmcsaHTML;
      const newSection = temp.querySelector('.fmcsa-section');
      if (newSection) {
        fmcsaContainer.outerHTML = newSection.outerHTML;
      }
    }
  }

  // Success - render full AI intel
  const aiIntelHTML = renderAIIntelBlock(data);
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = aiIntelHTML;
  const innerContent = tempDiv.querySelector('.ai-intel-content, .ai-intel-partial');

  if (innerContent) {
    container.innerHTML = innerContent.outerHTML;
  } else {
    container.innerHTML = aiIntelHTML;
  }

  // Add "Instant" tag if enrichment came from cache
  if (data.fromCache) {
    const tagsContainer = card.querySelector('.match-tags');
    if (tagsContainer && !tagsContainer.querySelector('.match-tag.cached')) {
      tagsContainer.insertAdjacentHTML('beforeend',
        '<span class="match-tag cached"><i class="fa-solid fa-bolt"></i> Instant</span>'
      );
    }
  }
}

function handleInterestClick(e) {
  const btn = e.currentTarget;
  const dotNumber = btn.dataset.dot;

  // Find full carrier data from currentMatches
  const matchData = currentMatches.find(m => String(m.carrier?.DOT_NUMBER) === String(dotNumber));
  const carrier = matchData?.carrier || {};

  // Store carrier data for modal
  pendingInterestCarrier = {
    dotNumber: dotNumber,
    name: btn.dataset.name || carrier.LEGAL_NAME || 'Unknown Carrier',
    phone: carrier.TELEPHONE || null,
    email: carrier.EMAIL_ADDRESS || null,
    location: `${carrier.PHY_CITY || ''}, ${carrier.PHY_STATE || ''} `.replace(/^, |, $/g, ''),
    matchScore: parseInt(btn.dataset.score) || 0
  };

  sendToWix('logInterest', {
    carrierDOT: dotNumber,
    carrierName: pendingInterestCarrier.name,
    driverZip: driverPrefs.homeZip,
    driverName: driverPrefs.driverName,
    matchScore: pendingInterestCarrier.matchScore,
    action: 'interested'
  });

  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
  btn.disabled = true;
}

window.retryEnrichment = function (dot) {
  sendToWix('retryEnrichment', { dot: dot });
  const card = document.querySelector(`[data-dot="${dot}"]`);
  if (card) {
    const container = card.querySelector('.ai-intel-section');
    if (container) {
      container.innerHTML = `
    <div class="ai-intel-loading">
          <i class="fa-solid fa-rotate-right fa-spin"></i>
          <div class="ai-intel-loading-text">Retrying...</div>
          <div class="ai-intel-loading-progress">
            <div class="ai-intel-loading-progress-bar"></div>
         </div>
       </div>
    `;
    }
  }
};

function handlePageReady(data) {
  console.log('✅ Page ready with user status:', data.userStatus);

  if (data.userStatus) {
    userStatus = data.userStatus;
    updateUserUIState();
  }

  if (data.driverProfile) {
    prefillForm(data.driverProfile);
  } else if (data.prefillZip) {
    // Landing page redirect — no profile yet, just pre-fill the zip
    const zipEl = document.getElementById('homeZip');
    if (zipEl) {
      zipEl.value = data.prefillZip;
      zipEl.dispatchEvent(new Event('input'));
    }
  }

  // Phase 1: Fetch mutual interests for the driver
  console.log('⚡ Fetching mutual interests...');
  sendToWix('getMutualInterest', { driverId: data.memberId });
}

function handleLoginSuccess(data) {
  console.log('✅ Login success:', data);
  userStatus = data.userStatus || { loggedIn: true, isPremium: true, tier: 'premium' };

  updateUserUIState();

  if (data.driverProfile) {
    prefillForm(data.driverProfile);
  }

  // Check if we have a pending application to auto-resubmit
  if (pendingApplicationData) {
    console.log('📤 Auto-resubmitting pending application after login');
    pendingApplicationData = null;

    // Update login prompt to show submitting state
    const loginLoadingText = document.getElementById('loginPromptLoadingText');
    if (loginLoadingText) loginLoadingText.textContent = 'Submitting your application...';

    // Hide login prompt and auto-resubmit after brief delay
    setTimeout(() => {
      hideLoginPrompt();
      submitApplication();
    }, 500);
    return;
  }

  // Normal login flow (not triggered by application submit)
  const name = data.driverProfile?.displayName || '';
  const welcome = name ? `, ${name} ` : '';
  showToast(`Welcome back${welcome}! You now have Premium access. Click "Find My Matches" to see all 10 results.`, 'success', 5000);
}

function updateUserUIState() {
  const isLoggedIn = !!userStatus.loggedIn;

  // Guest banner — show when not logged in, hide when logged in
  const guestBanner = document.getElementById('guestBanner');
  if (guestBanner) {
    guestBanner.style.display = isLoggedIn ? 'none' : 'flex';
  }
  const guestSignupBtn = document.getElementById('guestSignupBtn');
  const guestLoginBtn  = document.getElementById('guestLoginBtn');
  if (guestSignupBtn) guestSignupBtn.onclick = () => sendToWix('navigateToSignup', {});
  if (guestLoginBtn)  guestLoginBtn.onclick  = () => sendToWix('navigateToLogin', {});

  // Body class for CSS targeting
  document.body.classList.toggle('user-logged-in', isLoggedIn);

  // Update form badge for premium users
  const formBadge = document.querySelector('.form-badge');
  if (formBadge && userStatus.isPremium) {
    formBadge.innerHTML = '<i class="fa-solid fa-crown"></i> Premium Member • FMCSA Verified';
    formBadge.style.background = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
    formBadge.style.color = '#0f172a';
  }

  // Set body class for CSS targeting
  if (userStatus.loggedIn) {
    document.body.classList.add('user-logged-in');
  } else {
    document.body.classList.remove('user-logged-in');
  }
}

function prefillForm(profile, isAI = false) {
  console.log('📝 Pre-filling form with ' + (isAI ? 'AI' : 'profile') + ' data');

  // Store globally for application pre-fill (Phase 4H)
  if (!isAI) driverProfile = profile;

  if (profile.homeZip) {
    const el = document.getElementById('homeZip');
    el.value = profile.homeZip;
    if (isAI) highlightField(el);
  }
  if (profile.maxDistance) {
    const el = document.getElementById('maxDistance');
    el.value = profile.maxDistance;
    if (isAI) highlightField(el);
  }
  if (profile.minCPM) {
    const el = document.getElementById('minCPM');
    el.value = profile.minCPM;
    if (isAI) highlightField(el);
  }
  if (profile.operationType) {
    const el = document.getElementById('operationType');
    el.value = profile.operationType;
    if (isAI) highlightField(el);
  }
  if (profile.maxTurnover) {
    const el = document.getElementById('maxTurnover');
    el.value = profile.maxTurnover;
    if (isAI) highlightField(el);
  }
  if (profile.maxTruckAge) {
    const el = document.getElementById('maxTruckAge');
    el.value = profile.maxTruckAge;
    if (isAI) highlightField(el);
  }
  if (profile.displayName || profile.driverName) {
    const el = document.getElementById('driverName');
    el.value = profile.displayName || profile.driverName;
    if (isAI) highlightField(el);
  }

  if (profile.fleetSize) {
    const radio = document.querySelector(`input[name="fleetSize"][value="${profile.fleetSize}"]`);
    if (radio) {
      radio.checked = true;
      if (isAI) highlightField(radio.parentElement);
    }
  }

  // Update header if name is present
  const name = profile.displayName || profile.driverName;
  if (name) {
    const title = document.querySelector('.form-title');
    if (title) title.innerText = (isAI ? `Okay, ${name}` : `Welcome Back, ${name}`);

    const subtitle = document.querySelector('.form-subtitle');
    if (subtitle) subtitle.innerText = isAI ? "I've adjusted your filters based on your request." : "We've loaded your preferences for a quick match.";
  }

  // Auto-trigger search if the profile is complete (Phase 2 Requirement)
  if (profile.isComplete === true) {
    console.log('⚡ Profile is complete - auto-triggering search');
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      setTimeout(() => submitBtn.click(), 500);
    }
  }
}

function handleMatchExplanationResult(data) {
  const card = document.querySelector(`.match-card[data-dot="${data.carrierDot}"]`);
  if (!card) return;

  const panel = card.querySelector('.explanation-panel');
  if (!panel) return;

  if (!data.success) {
    panel.querySelector('.explanation-content').innerHTML = `
      <div style="text-align: center; color: #ef4444; padding: 20px;">
        <i class="fa-solid fa-circle-exclamation"></i> Could not load explanation.
      </div>
    `;
    panel.dataset.loaded = "true";
    return;
  }

  const exp = data.explanation;

  // Render Categories — guard against missing scores (Pinecone-only carriers)
  const categoriesHtml = (exp.categories || []).map(cat => `
    <div class="category-row">
      <div class="category-label">
        <i class="fa-solid fa-check-circle" style="color: ${cat.score >= 70 ? 'var(--color-success)' : '#cbd5e1'}"></i>
        ${cat.label}
      </div>
      <div>
        <div class="category-bar-container">
          <div class="category-bar-fill ${cat.status}" style="width: ${cat.score}%"></div>
        </div>
        <div class="explanation-text">${cat.text}</div>
      </div>
      <div class="category-score">${cat.score}%</div>
    </div>
  `).join('');

  const html = `
    <div class="explanation-header">
      <div class="explanation-title">
        <i class="fa-solid fa-wand-magic-sparkles" style="color: var(--lmdr-purple)"></i>
        AI Match Analysis
      </div>
      <div class="explanation-summary">${exp.summary}</div>
    </div>

    ${exp.llm_narrative ? `
      <div class="why-narrative-box">
        <div class="why-narrative-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
        <div class="why-narrative-text">${escapeHtml(exp.llm_narrative)}</div>
      </div>
    ` : ''}

    ${categoriesHtml}

    <div class="tip-box">
      <i class="fa-solid fa-lightbulb tip-icon"></i>
      <div>
        <strong>Pro Tip:</strong> ${exp.tip}
      </div>
    </div>
  `;

  panel.querySelector('.explanation-content').innerHTML = html;
  panel.dataset.loaded = "true";
}

function loadApplications() {
  const list = document.getElementById('applicationsList');
  if (!list) return;

  // Show loading spinner
  list.innerHTML = '<div class="loading-spinner" style="margin: 40px auto;"></div>';

  console.log('📡 Requesting driver applications from backend...');
  sendToWix('getDriverApplications', {});

  // Timeout fallback — backend didn't respond, show empty state
  window.appLoadTimeout = setTimeout(() => {
    console.warn('⚠️ No response from backend for getDriverApplications');
    renderApplications([]);
  }, 5000);
}

