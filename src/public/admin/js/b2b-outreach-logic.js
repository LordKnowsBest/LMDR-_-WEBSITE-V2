/* =========================================
   B2B Outreach — Logic Module
   Depends on: OutreachBridge
   ========================================= */
var OutreachLogic = (function () {
  'use strict';

  var editingSequenceId = null;
  var steps = [];
  var currentAIStepIndex = null;
  var aiPreviewContent = null;
  var currentAccountId = null;
  var currentContactId = null;

  function init() {
    OutreachBridge.listen({
      init: function () { refreshOutreach(); },
      sequencesLoaded: function (d) { renderSequences(d.payload); },
      sequenceLoaded: function (d) { openBuilder(d.payload); },
      throttleStatus: function (d) { renderThrottle(d.payload); },
      sequenceSaved: function () { showToast('Sequence saved', 'success'); closeBuilder(); refreshOutreach(); },
      emailContentGenerated: function (d) { handleAIContent(d.payload, 'email'); },
      smsContentGenerated: function (d) { handleAIContent(d.payload, 'sms'); },
      callScriptGenerated: function (d) { handleAIContent(d.payload, 'call'); },
      draftSaved: function () { showToast('Draft saved for review', 'success'); },
      draftApproved: function () { showToast('Draft approved', 'success'); },
      draftsLoaded: function (d) { console.log('Pending drafts:', d.payload); },
      actionSuccess: function (d) { showToast(d.message || 'Done', 'success'); },
      actionError: function (d) { showToast(d.message || 'Error', 'error'); }
    });
  }

  function refreshOutreach() {
    var status = document.getElementById('seqStatusFilter').value;
    OutreachBridge.sendToVelo({ action: 'getSequences', status: status });
    OutreachBridge.sendToVelo({ action: 'getThrottleStatus' });
  }

  function renderSequences(seqs) {
    var c = document.getElementById('sequenceList');
    if (!seqs || seqs.length === 0) { c.innerHTML = '<div class="p-6 text-center text-slate-500 text-sm">No sequences found</div>'; return; }
    var statusBadge = { active: 'bg-emerald-500/20 text-emerald-400', draft: 'bg-slate-700 text-slate-400', paused: 'bg-amber-500/20 text-amber-400', archived: 'bg-red-500/20 text-red-400' };
    c.innerHTML = seqs.map(function (s) {
      return '<div class="px-4 md:px-5 py-3 flex items-center justify-between gap-3 step-card cursor-pointer" onclick="editSequence(\'' + esc(s._id || s.id) + '\')"><div class="flex-1 min-w-0"><p class="text-sm font-semibold text-slate-100 truncate">' + esc(s.name) + '</p><p class="text-xs text-slate-400 mt-0.5">Channels: ' + esc(s.channel_mix || '\u2014') + '</p></div><span class="text-xs font-bold px-2 py-0.5 rounded-full ' + (statusBadge[s.status] || statusBadge.draft) + '">' + esc(s.status || 'draft') + '</span></div>';
    }).join('');
  }

  function renderThrottle(t) {
    if (!t) return;
    if (t.email) setText('emailLimit', (t.email.remaining || 0) + '/' + (t.email.limit || 200));
    if (t.sms) setText('smsLimit', (t.sms.remaining || 0) + '/' + (t.sms.limit || 100));
    if (t.call) setText('callLimit', (t.call.remaining || 0) + '/' + (t.call.limit || 50));
    document.getElementById('quietHoursIndicator').classList.toggle('hidden', !t.quietHours);
  }

  function createSequence() { editingSequenceId = null; steps = []; document.getElementById('seqName').value = ''; document.getElementById('sequenceBuilder').classList.remove('hidden'); renderSteps(); }
  function editSequence(id) { OutreachBridge.sendToVelo({ action: 'getSequence', sequenceId: id }); }

  function openBuilder(data) {
    if (!data) return;
    editingSequenceId = (data.sequence && (data.sequence._id || data.sequence.id)) || null;
    document.getElementById('seqName').value = (data.sequence && data.sequence.name) || '';
    var mix = (data.sequence && data.sequence.channel_mix) || '';
    document.getElementById('chEmail').checked = mix.indexOf('email') !== -1;
    document.getElementById('chSms').checked = mix.indexOf('sms') !== -1;
    document.getElementById('chCall').checked = mix.indexOf('call') !== -1;
    steps = data.steps || [];
    document.getElementById('sequenceBuilder').classList.remove('hidden');
    renderSteps();
  }

  function closeBuilder() { document.getElementById('sequenceBuilder').classList.add('hidden'); editingSequenceId = null; steps = []; }

  function addStep() {
    steps.push({ step_type: 'email', subject: '', template: '', delay_hours: 24, step_order: steps.length + 1, ai_generated: false, purpose: 'follow_up' });
    renderSteps();
  }

  function generateAIContent(stepIndex) {
    currentAIStepIndex = stepIndex;
    var step = steps[stepIndex];
    var accountId = currentAccountId || '';
    if (!accountId) { showToast('Select an account first', 'error'); return; }
    showToast('Generating AI content...', 'info');
    var contactId = currentContactId || '';
    switch (step.step_type) {
      case 'email': OutreachBridge.sendToVelo({ action: 'generateEmailContent', accountId: accountId, contactId: contactId, purpose: step.purpose || 'follow_up', sequenceStepId: step._id || step.id || '' }); break;
      case 'sms': OutreachBridge.sendToVelo({ action: 'generateSmsContent', accountId: accountId, contactId: contactId, purpose: step.purpose || 'follow_up', sequenceStepId: step._id || step.id || '' }); break;
      case 'call': OutreachBridge.sendToVelo({ action: 'generateCallScript', accountId: accountId, contactId: contactId, purpose: step.purpose || 'intro', sequenceStepId: step._id || step.id || '' }); break;
      default: showToast('AI generation not supported for this step type', 'error');
    }
  }

  function handleAIContent(payload, channel) {
    if (currentAIStepIndex === null) return;
    var content = payload.content;
    aiPreviewContent = content;
    if (channel === 'email') { steps[currentAIStepIndex].subject = content.subject || ''; steps[currentAIStepIndex].template = content.body || ''; }
    else if (channel === 'sms') { steps[currentAIStepIndex].template = content.message || ''; }
    else if (channel === 'call') {
      var script = [content.opening || '', '', 'Value Props:', (content.valueProps || []).map(function (v) { return '\u2022 ' + v; }).join('\n'), '', 'Questions:', (content.questions || []).map(function (q) { return '\u2022 ' + q; }).join('\n'), '', 'Closing:', content.closing || ''].join('\n');
      steps[currentAIStepIndex].template = script;
    }
    steps[currentAIStepIndex].ai_generated = true;
    renderSteps();
    showToast(payload.cached ? 'AI content loaded (cached)' : 'AI content generated', 'success');
    if (payload.fallback) showToast('Used fallback template (AI unavailable)', 'info');
    currentAIStepIndex = null;
  }

  function toggleAIGenerated(stepIndex) { steps[stepIndex].ai_generated = !steps[stepIndex].ai_generated; renderSteps(); }

  function setContextForAI(accountId, contactId) { currentAccountId = accountId; currentContactId = contactId; }

  function renderSteps() {
    var c = document.getElementById('stepList');
    if (steps.length === 0) { c.innerHTML = '<p class="text-xs text-slate-600 text-center py-4">No steps yet. Add a step to get started.</p>'; return; }
    var typeIcons = { email: 'mail', sms: 'sms', call: 'call', wait: 'hourglass_empty', task: 'task_alt' };
    var canGenerateAI = ['email', 'sms', 'call'];
    c.innerHTML = steps.map(function (s, i) {
      var stepTypes = ['email', 'sms', 'call', 'wait', 'task'];
      var purposes = ['intro', 'follow_up', 'proposal', 'check_in', 'discovery', 'close'];
      var typeOpts = stepTypes.map(function (st) { return '<option value="' + st + '"' + (s.step_type === st ? ' selected' : '') + '>' + st.charAt(0).toUpperCase() + st.slice(1) + '</option>'; }).join('');
      var purposeOpts = purposes.map(function (p) { return '<option value="' + p + '"' + ((s.purpose === p || (!s.purpose && p === 'follow_up')) ? ' selected' : '') + '>' + p.replace('_', ' ').charAt(0).toUpperCase() + p.replace('_', ' ').slice(1) + '</option>'; }).join('');
      var aiButtons = canGenerateAI.indexOf(s.step_type) !== -1 ? '<button onclick="toggleAIGenerated(' + i + ')" class="text-xs px-2 py-1 rounded ' + (s.ai_generated ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-600/50' : 'bg-slate-700 text-slate-400 border border-slate-600') + '" title="Toggle AI generation at send time"><span class="material-symbols-outlined text-[12px] align-middle">auto_awesome</span> AI ' + (s.ai_generated ? 'On' : 'Off') + '</button><button onclick="generateAIContent(' + i + ')" class="text-xs px-2 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-600/50 hover:bg-blue-600/30" title="Generate AI content now"><span class="material-symbols-outlined text-[12px] align-middle">edit_note</span> Generate</button>' : '';
      var subjectInput = s.step_type === 'email' ? '<input type="text" value="' + esc(s.subject || '') + '" onchange="OutreachLogic.updateStepSubject(' + i + ',this.value)" class="w-full bg-slate-700 border border-slate-600 rounded text-xs px-2 py-1 text-white" placeholder="Subject line..." />' : '';
      var aiNote = s.ai_generated ? '<p class="text-[10px] text-cyan-500"><span class="material-symbols-outlined text-[10px] align-middle">info</span> AI-generated content will be personalized for each contact at send time</p>' : '';
      return '<div class="bg-slate-800 rounded-lg p-3 flex items-start gap-3"><div class="flex-shrink-0 w-8 h-8 rounded-full ' + (s.ai_generated ? 'bg-cyan-600/30' : 'bg-slate-700') + ' flex items-center justify-center"><span class="material-symbols-outlined text-[16px] ' + (s.ai_generated ? 'text-cyan-400' : 'text-slate-300') + '">' + (s.ai_generated ? 'auto_awesome' : (typeIcons[s.step_type] || 'circle')) + '</span></div><div class="flex-1 space-y-2"><div class="flex flex-wrap gap-2 items-center"><select onchange="OutreachLogic.updateStepType(' + i + ',this.value)" class="bg-slate-700 border border-slate-600 rounded text-xs px-2 py-1 text-white">' + typeOpts + '</select><select onchange="OutreachLogic.updateStepPurpose(' + i + ',this.value)" class="bg-slate-700 border border-slate-600 rounded text-xs px-2 py-1 text-white">' + purposeOpts + '</select><input type="number" value="' + s.delay_hours + '" onchange="OutreachLogic.updateStepDelay(' + i + ',this.value)" class="w-16 bg-slate-700 border border-slate-600 rounded text-xs px-2 py-1 text-white" placeholder="Delay" /><span class="text-xs text-slate-500">hrs</span>' + aiButtons + '</div>' + subjectInput + '<textarea onchange="OutreachLogic.updateStepTemplate(' + i + ',this.value)" class="w-full bg-slate-700 border border-slate-600 rounded text-xs px-2 py-1 text-white h-20 resize-none scrollbar-thin" placeholder="' + (s.ai_generated ? 'AI will generate content at send time...' : 'Message template (use {{variables}})...') + '">' + esc(s.template || '') + '</textarea>' + aiNote + '</div><button onclick="OutreachLogic.removeStep(' + i + ')" class="text-slate-500 hover:text-red-400"><span class="material-symbols-outlined text-[18px]">close</span></button></div>';
    }).join('');
  }

  function updateStepType(i, v) { steps[i].step_type = v; renderSteps(); }
  function updateStepPurpose(i, v) { steps[i].purpose = v; }
  function updateStepDelay(i, v) { steps[i].delay_hours = parseInt(v); }
  function updateStepTemplate(i, v) { steps[i].template = v; }
  function updateStepSubject(i, v) { steps[i].subject = v; }
  function removeStep(i) { steps.splice(i, 1); renderSteps(); }

  function saveSequence() {
    var name = document.getElementById('seqName').value.trim();
    if (!name) { showToast('Name required', 'error'); return; }
    var channels = [];
    if (document.getElementById('chEmail').checked) channels.push('email');
    if (document.getElementById('chSms').checked) channels.push('sms');
    if (document.getElementById('chCall').checked) channels.push('call');
    OutreachBridge.sendToVelo({ action: 'saveSequence', sequenceId: editingSequenceId, name: name, channels: channels, steps: steps });
  }

  function setText(id, t) { var el = document.getElementById(id); if (el) el.textContent = t; }
  function esc(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }
  function showToast(m, t) { t = t || 'info'; var c = document.getElementById('toastContainer'); var cl = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-blue-600' }; var el = document.createElement('div'); el.className = 'toast ' + (cl[t] || cl.info) + ' text-white text-sm px-4 py-3 rounded-lg shadow-lg'; el.textContent = m; c.appendChild(el); setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(function () { el.remove(); }, 300); }, 3000); }

  function exposeGlobals() {
    window.createSequence = createSequence;
    window.editSequence = editSequence;
    window.closeBuilder = closeBuilder;
    window.addStep = addStep;
    window.saveSequence = saveSequence;
    window.refreshOutreach = refreshOutreach;
    window.generateAIContent = generateAIContent;
    window.toggleAIGenerated = toggleAIGenerated;
  }

  return {
    init: init, exposeGlobals: exposeGlobals,
    updateStepType: updateStepType, updateStepPurpose: updateStepPurpose,
    updateStepDelay: updateStepDelay, updateStepTemplate: updateStepTemplate,
    updateStepSubject: updateStepSubject, removeStep: removeStep,
    setContextForAI: setContextForAI
  };
})();
