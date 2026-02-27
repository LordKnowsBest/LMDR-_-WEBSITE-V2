/* =========================================
   B2B Lead Capture — Logic Module
   Depends on: LeadCaptureBridge
   ========================================= */
var LeadCaptureLogic = (function () {
  'use strict';

  var recentLeads = [];

  function init() {
    LeadCaptureBridge.listen({
      init: function () {},
      leadCaptured: function (d) { handleCaptured(d.payload || {}); },
      actionSuccess: function (d) { showToast(d.message || 'Done', 'success'); },
      actionError: function (d) { showToast(d.message || 'Error', 'error'); setSubmitEnabled(true); }
    });
  }

  function submitLead() {
    var companyName = document.getElementById('companyName').value.trim();
    var contactName = document.getElementById('contactName').value.trim();
    if (!companyName) { showToast('Company name required', 'error'); return; }
    if (!contactName) { showToast('Contact name required', 'error'); return; }
    setSubmitEnabled(false);
    var lead = {
      companyName: companyName,
      dotNumber: document.getElementById('dotNumber').value.trim(),
      contactName: contactName,
      contactRole: document.getElementById('contactRole').value.trim(),
      email: document.getElementById('contactEmail').value.trim(),
      phone: document.getElementById('contactPhone').value.trim(),
      region: document.getElementById('region').value.trim(),
      fleetSize: parseInt(document.getElementById('fleetSize').value) || 0,
      tags: document.getElementById('tags').value.trim(),
      notes: document.getElementById('notes').value.trim(),
      eventName: document.getElementById('eventName').value.trim(),
      captureSource: document.getElementById('captureSource').value,
      followUp: document.getElementById('followUp').checked,
      followUpDays: parseInt(document.getElementById('followUpDays').value) || 2
    };
    LeadCaptureBridge.sendToVelo({ action: 'captureLead', lead: lead });
  }

  function handleCaptured(payload) {
    setSubmitEnabled(true);
    showToast('Lead captured!', 'success');
    renderQualification(payload);
    recentLeads.unshift({ name: document.getElementById('companyName').value, contact: document.getElementById('contactName').value, time: new Date().toLocaleTimeString() });
    renderRecent();
    clearLeadFields();
  }

  function renderQualification(payload) {
    var card = document.getElementById('leadScoreCard');
    if (!card) return;
    card.classList.remove('hidden');
    setText('leadScoreValue', String(payload.leadScore || 0));
    setText('leadClassValue', payload.leadClassification || 'cold');
    setText('leadOwnerValue', payload.assignedOwnerId || 'Unassigned');
    setText('leadOppValue', payload.opportunityCreated ? 'Yes' : 'No');
  }

  function clearLeadFields() {
    ['companyName', 'dotNumber', 'contactName', 'contactRole', 'contactEmail', 'contactPhone', 'region', 'tags', 'notes'].forEach(function (id) { document.getElementById(id).value = ''; });
    document.getElementById('fleetSize').value = '';
  }

  function resetForm() {
    clearLeadFields();
    document.getElementById('eventName').value = '';
    document.getElementById('captureSource').value = 'event_booth';
    recentLeads = [];
    renderRecent();
  }

  function renderRecent() {
    var c = document.getElementById('recentCaptures');
    if (recentLeads.length === 0) { c.innerHTML = '<div class="p-4 text-center text-slate-500 text-sm">No captures this session</div>'; return; }
    c.innerHTML = recentLeads.map(function (l) {
      return '<div class="px-4 py-2.5 flex items-center justify-between"><div><p class="text-sm text-slate-200 font-medium">' + esc(l.name) + '</p><p class="text-xs text-slate-500">' + esc(l.contact) + '</p></div><span class="text-xs text-slate-500">' + esc(l.time) + '</span></div>';
    }).join('');
  }

  function setSubmitEnabled(enabled) {
    var btn = document.getElementById('submitBtn');
    btn.disabled = !enabled;
    btn.classList.toggle('opacity-50', !enabled);
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function esc(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
  function showToast(m, t) { t = t || 'info'; var c = document.getElementById('toastContainer'); var cl = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-blue-600' }; var el = document.createElement('div'); el.className = 'toast ' + (cl[t] || cl.info) + ' text-white text-sm px-4 py-3 rounded-lg shadow-lg'; el.textContent = m; c.appendChild(el); setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(function () { el.remove(); }, 300); }, 3000); }

  function exposeGlobals() { window.submitLead = submitLead; window.resetForm = resetForm; }

  return { init: init, exposeGlobals: exposeGlobals };
})();
