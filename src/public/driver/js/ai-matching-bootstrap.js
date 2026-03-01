// ai-matching-bootstrap.js
// Depends on: ai-matching-helpers.js, ai-matching-bridge.js, ai-matching-results.js, ai-matching-modals.js

(function (root) {
  function buildDriverPrefs() {
    const doc = root.document;
    const customWeights = {
      location: parseInt(doc.getElementById('weight-location').value),
      pay: parseInt(doc.getElementById('weight-pay').value),
      operationType: parseInt(doc.getElementById('weight-operationType').value),
      safety: parseInt(doc.getElementById('weight-safety').value),
      turnover: parseInt(doc.getElementById('weight-turnover').value),
      truckAge: parseInt(doc.getElementById('weight-truckAge').value),
      fleetSize: 5,
      qualityScore: 5
    };

    return {
      homeZip: doc.getElementById('homeZip').value.trim(),
      maxDistance: parseInt(doc.getElementById('maxDistance').value),
      minCPM: parseFloat(doc.getElementById('minCPM').value) || 0,
      operationType: doc.getElementById('operationType').value,
      maxTurnover: parseInt(doc.getElementById('maxTurnover').value),
      maxTruckAge: parseInt(doc.getElementById('maxTruckAge').value),
      fleetSize: doc.querySelector('input[name="fleetSize"]:checked').value,
      driverName: doc.getElementById('driverName').value.trim() || 'Driver',
      customWeights: customWeights
    };
  }

  function bindSearchControls(refs) {
    if (refs.sortSelect) {
      refs.sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderFilteredResults();
      });
    }

    if (refs.mutualOnlyCheckbox) {
      refs.mutualOnlyCheckbox.addEventListener('change', (e) => {
        filterMutualOnly = e.target.checked;
        renderFilteredResults();
      });
    }

    if (refs.driverForm) {
      refs.driverForm.addEventListener('submit', (e) => {
        e.preventDefault();

        driverPrefs = buildDriverPrefs();
        filterMutualOnly = root.document.getElementById('showMutualOnly')?.checked || false;

        if (!driverPrefs.homeZip || driverPrefs.homeZip.length < 5) {
          showToast('Please enter a valid ZIP code');
          return;
        }

        showLoading();
        sendToWix('findMatches', driverPrefs);
      });
    }
  }

  function bindPriorityControls(refs) {
    const togglePriorities = root.document.getElementById('togglePriorities');
    if (togglePriorities) {
      togglePriorities.onclick = () => {
        const advanced = root.document.getElementById('advancedPriorities');
        const isHidden = root.getComputedStyle(advanced).display === 'none';
        advanced.style.display = isHidden ? 'block' : 'none';
        togglePriorities.classList.toggle('active', isHidden);
      };
    }

    const weightInputs = ['location', 'pay', 'operationType', 'safety', 'turnover', 'truckAge'];
    weightInputs.forEach((id) => {
      const input = root.document.getElementById(`weight-${id}`);
      const valLabel = root.document.getElementById(`weight-val-${id}`);
      if (!input || !valLabel) return;

      const updateLabel = () => {
        const val = parseInt(input.value);
        let text = 'Normal';
        if (val >= 40) text = 'Critical';
        else if (val >= 30) text = 'High';
        else if (val >= 15) text = 'Standard';
        else if (val >= 5) text = 'Low';
        else text = 'Ignored';
        valLabel.textContent = text;
      };

      input.addEventListener('input', updateLabel);
      updateLabel();
    });

    const resetWeights = root.document.getElementById('resetWeights');
    if (resetWeights) {
      resetWeights.onclick = () => {
        const defaults = { location: 25, pay: 20, operationType: 15, safety: 10, turnover: 12, truckAge: 8 };
        Object.entries(defaults).forEach(([id, val]) => {
          const input = root.document.getElementById(`weight-${id}`);
          if (!input) return;
          input.value = val;
          input.dispatchEvent(new Event('input'));
        });
      };
    }

    if (refs.resetBtn) {
      refs.resetBtn.addEventListener('click', () => {
        refs.resultsSection.classList.remove('active');
        refs.formSection.style.display = 'block';
        refs.driverForm.reset();
        root.document.getElementById('fleetAny').checked = true;
        if (refs.upsellBanner) refs.upsellBanner.style.display = 'none';
        if (refs.premiumBanner) refs.premiumBanner.style.display = 'none';
        currentMatches = [];
      });
    }
  }

  function updateGuestBanner(status) {
    const banner = root.document.getElementById('guestBanner');
    if (!banner) return;
    banner.style.display = !status || status.loggedIn ? 'none' : 'flex';
  }

  function handlePageMessage(msg, refs) {
    switch (msg.type) {
      case 'matchResults':
        if (typeof stopAsyncPolling === 'function') stopAsyncPolling();
        if (root._asyncStepTimer) {
          clearInterval(root._asyncStepTimer);
          root._asyncStepTimer = null;
        }
        showResults(msg.data);
        break;

      case 'enrichmentUpdate':
        updateCardEnrichment(msg.data);
        break;

      case 'enrichmentComplete':
        root.document.querySelectorAll('.ai-intel-loading').forEach((el) => {
          const card = el.closest('[data-dot]');
          if (!card) return;
          const dot = card.getAttribute('data-dot');
          const container = card.querySelector('.ai-intel-section');
          if (!container) return;
          container.innerHTML = `
            <div class="ai-intel-ondemand" id="ondemand-${dot}">
              <button class="btn-get-ai-profile" onclick="window.retryEnrichment('${dot}')">
                <i class="fa-solid fa-brain"></i> Get AI Profile
              </button>
              <div class="ai-intel-ondemand-sub">Pay data, driver reviews & hiring intel</div>
            </div>
          `;
        });
        break;

      case 'interestLogged': {
        if (!msg.data?.carrierDOT) break;
        const card = root.document.querySelector(`.match-card[data-dot="${msg.data.carrierDOT}"]`);
        const btn = card?.querySelector('.interested-btn, [disabled]');

        if (msg.data.success) {
          appliedCarrierDOTs.add(String(msg.data.carrierDOT));
          if (btn) {
            btn.classList.remove('primary', 'interested-btn');
            btn.classList.add('applied-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Interest Saved';
          }
          const tagsContainer = card?.querySelector('.match-tags');
          if (tagsContainer && !tagsContainer.querySelector('.match-tag.applied')) {
            tagsContainer.insertAdjacentHTML('afterbegin',
              '<span class="match-tag applied"><i class="fa-solid fa-check-circle"></i> Applied</span>');
          }
          showInterestModal(pendingInterestCarrier);
        } else {
          if (btn) {
            btn.classList.remove('applied-btn');
            btn.classList.add('primary', 'interested-btn');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-heart"></i> I\'M INTERESTED';
          }
          showToast('Could not save interest: ' + (msg.data.error || 'Please try again'));
        }
        break;
      }

      case 'matchError': {
        hideLoading();
        const errorMsg = msg.data?.error || 'Unknown error';
        const existingError = root.document.getElementById('searchErrorBanner');
        if (existingError) existingError.remove();
        refs.formSection.style.display = 'block';
        const errorBanner = root.document.createElement('div');
        errorBanner.id = 'searchErrorBanner';
        errorBanner.style.cssText = 'text-align:center; padding:20px; margin-bottom:20px; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.3); border-radius:12px;';
        errorBanner.innerHTML = `
          <i class="fa-solid fa-triangle-exclamation" style="font-size:28px; color:#f59e0b; margin-bottom:8px;"></i>
          <h3 style="color:#f1f5f9; margin:0 0 4px; font-size:16px;">Search Unavailable</h3>
          <p style="color:#94a3b8; margin:0; font-size:13px;">${errorMsg}</p>
        `;
        refs.formSection.insertBefore(errorBanner, refs.formSection.firstChild);
        break;
      }

      case 'pageReady':
        userStatus = msg.data.userStatus || userStatus;
        updateGuestBanner(userStatus);

        if (msg.data.driverProfile && typeof prefillForm === 'function') {
          prefillForm(msg.data.driverProfile);
        } else if (msg.data.prefillZip) {
          const zipEl = root.document.getElementById('homeZip');
          if (zipEl) {
            zipEl.value = msg.data.prefillZip;
            zipEl.dispatchEvent(new Event('input'));
          }
        }

        if (msg.data.memberId && typeof FeatureTracker !== 'undefined' && !FeatureTracker.isInitialized()) {
          FeatureTracker.init({ userId: msg.data.memberId, userRole: 'driver' });
          FeatureTracker.view('ai_matching', { entryPoint: 'page_load' });
        }

        if (msg.data.appliedCarriers) {
          appliedCarrierDOTs.clear();
          msg.data.appliedCarriers.forEach((c) => {
            if (c.carrierDOT) appliedCarrierDOTs.add(String(c.carrierDOT));
          });
        }

        if (msg.data.memberId) {
          sendToWix('getMutualInterest', { driverId: msg.data.memberId });
        }
        break;

      case 'userStatusUpdate':
        userStatus = msg.data;
        updateGuestBanner(userStatus);
        break;

      case 'loginSuccess':
        handleLoginSuccess(msg.data);
        break;

      case 'loginCancelled':
        if (pendingApplicationData) {
          pendingApplicationData = null;
          hideLoginPrompt();
        }
        break;

      case 'applicationSubmitted':
        handleApplicationSubmitted(msg.data);
        break;

      case 'pong':
        break;

      case 'driverProfileLoaded':
        if (msg.data?.success && msg.data?.profile) {
          prefillForm(msg.data.profile);
        }
        break;

      case 'savedCarriersLoaded':
      case 'discoverabilityUpdated':
        break;

      case 'ocrResult':
        handleOCRResult(msg.data);
        break;

      case 'mutualInterestData':
        if (msg.data && msg.data.interests) {
          mutualInterestMap.clear();
          msg.data.interests.forEach((i) => {
            mutualInterestMap.set(String(i.carrierDot || i.carrierDOT), i);
          });
          if (allMatches.length > 0) {
            allMatches.forEach((m) => {
              const interest = mutualInterestMap.get(String(m.carrier?.DOT_NUMBER));
              if (interest) {
                m.isMutualMatch = true;
                m.mutualStrength = interest.strength || 'weak';
                m.mutualSignals = interest.signals || ['viewed'];
              }
            });
            renderFilteredResults();
          }
        }
        break;

      case 'matchExplanation':
        handleMatchExplanationResult(msg.data);
        break;

      case 'driverApplications':
        if (root.appLoadTimeout) {
          clearTimeout(root.appLoadTimeout);
          root.appLoadTimeout = null;
        }
        renderApplications(msg.data);
        break;

      default:
        console.warn('Unhandled message type:', msg.type);
    }
  }

  function bindPageMessageListener(refs) {
    root.addEventListener('message', (event) => {
      if (!isValidOrigin(event)) return;
      const msg = event.data;
      if (!validateMessageSchema(msg)) return;
      validateInboundMessage(msg.type);
      logMessageFlow('in', msg.type, msg.data);
      handlePageMessage(msg, refs);
    });
  }

  function bindGuestBannerActions() {
    const guestSignupBtn = root.document.getElementById('guestSignupBtn');
    const guestLoginBtn = root.document.getElementById('guestLoginBtn');

    if (guestSignupBtn) {
      guestSignupBtn.addEventListener('click', () => sendToWix('navigateToSignup', {}));
    }
    if (guestLoginBtn) {
      guestLoginBtn.addEventListener('click', () => sendToWix('navigateToLogin', {}));
    }
  }

  function initHandshake() {
    if (root.parent) {
      sendToWix('carrierMatchingReady', {});
      setTimeout(verifyConnection, 500);
    }
    root.document.addEventListener('DOMContentLoaded', verifyConnection);
  }

  function bindApplicationTabs(refs) {
    const tabs = root.document.querySelectorAll('.nav-tab');
    const applicationsSection = root.document.getElementById('applicationsSection');
    const refreshAppsBtn = root.document.getElementById('refreshAppsBtn');

    if (tabs.length > 0) {
      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          tabs.forEach((t) => t.classList.remove('active'));
          tab.classList.add('active');

          const tabName = tab.dataset.tab;
          if (tabName === 'find') {
            applicationsSection.classList.remove('active');

            if (refs.resultsSection && refs.resultsSection.classList.contains('active')) {
              refs.resultsSection.style.display = 'block';
              if (refs.formSection) refs.formSection.style.display = 'none';
            } else if (refs.loadingSection && refs.loadingSection.classList.contains('active')) {
              refs.loadingSection.style.display = 'block';
              if (refs.formSection) refs.formSection.style.display = 'none';
            } else {
              if (refs.formSection) refs.formSection.style.display = 'block';
              if (refs.resultsSection) refs.resultsSection.style.display = 'none';
              if (refs.loadingSection) refs.loadingSection.style.display = 'none';
            }
          } else if (tabName === 'applications') {
            if (refs.formSection) refs.formSection.style.display = 'none';
            if (refs.loadingSection) refs.loadingSection.style.display = 'none';
            if (refs.resultsSection) refs.resultsSection.style.display = 'none';
            applicationsSection.classList.add('active');
            loadApplications();
          }
        });
      });
    }

    if (refreshAppsBtn) {
      refreshAppsBtn.addEventListener('click', loadApplications);
    }
  }

  root.AIMatchingBootstrap = {
    bindApplicationTabs: bindApplicationTabs,
    bindGuestBannerActions: bindGuestBannerActions,
    bindPageMessageListener: bindPageMessageListener,
    bindPriorityControls: bindPriorityControls,
    bindSearchControls: bindSearchControls,
    handlePageMessage: handlePageMessage,
    initHandshake: initHandshake,
    updateGuestBanner: updateGuestBanner
  };

  root.updateGuestBanner = updateGuestBanner;
}(typeof globalThis !== 'undefined' ? globalThis : this));
