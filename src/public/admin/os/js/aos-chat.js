// ============================================================================
// AOS-CHAT — Admin Copilot Communications
// ============================================================================

(function () {
    'use strict';

    window.AOS = window.AOS || {};
    AOS.chat = { send, addMessage, clearHistory };

    let isWaitingForResponse = false;

    /**
     * Send a message to the Admin Copilot
     * @param {string} text Optional text (if omitted, reads from input)
     */
    function send(text) {
        if (isWaitingForResponse) return; // Debounce

        const inputEl = document.getElementById('aos-copilot-input');
        const cmdInput = document.getElementById('aos-cmd-input');

        let msg = text;
        if (!msg && inputEl && document.activeElement === inputEl) msg = inputEl.value;
        if (!msg && cmdInput && document.activeElement === cmdInput) msg = cmdInput.value;
        if (!msg && inputEl) msg = inputEl.value; // Fallback

        if (!msg || typeof msg !== 'string' || !msg.trim()) return;
        msg = msg.trim();

        // Clear inputs
        if (inputEl) inputEl.value = '';
        if (cmdInput) cmdInput.value = '';

        // UI Updates
        addMessage('user', msg);

        // Ensure copilot is visible
        const copilot = document.getElementById('aos-copilot');
        if (copilot && copilot.classList.contains('hidden')) {
            if (AOS.shell && AOS.shell.toggleCopilot) AOS.shell.toggleCopilot();
        }

        isWaitingForResponse = true;

        // Visual loading indicator
        const loadingId = 'msg-loading-' + Date.now();
        addLoadingMessage(loadingId);

        // Send via Bridge
        if (AOS.bridge && AOS.bridge.send) {
            AOS.bridge.send('AOS_CHAT_MESSAGE', { text: msg }, 10000)
                .then(data => {
                    removeMessage(loadingId);
                    addMessage('assistant', data.response || "Task completed.");
                    isWaitingForResponse = false;
                })
                .catch(err => {
                    removeMessage(loadingId);
                    // Handle standalone UI / bridge errors
                    if (err.message === 'BRIDGE_TIMEOUT') {
                        addMessage('assistant', "I'm having trouble reaching the backend servers. Operating in standalone mode.");
                    } else if (err.message === 'MOCK_DATA_PROHIBITED') {
                        addMessage('assistant', "System security policy prevents execution of this command without verified backend connection.");
                    } else {
                        addMessage('assistant', `System Error: ${err.message}`);
                    }
                    isWaitingForResponse = false;
                });
        } else {
            // No bridge found (standalone fallback)
            setTimeout(() => {
                removeMessage(loadingId);
                addMessage('assistant', "AdminOS Hub is running in standalone layout mode. Backend connections require the Velo runtime environment.");
                isWaitingForResponse = false;
            }, 1000);
        }
    }

    /**
     * Add a message bubble to the chat thread
     * @param {'user'|'assistant'} role 
     * @param {string} text HTML or string content
     * @returns {string} ID of the message wrapper
     */
    function addMessage(role, text) {
        const copilotThread = document.getElementById('aos-copilot-msgs');
        if (!copilotThread) return;

        const id = 'msg-' + Date.now() + Math.floor(Math.random() * 1000);

        const wrapper = document.createElement('div');
        wrapper.id = id;
        wrapper.className = `flex w-full mb-4 ${role === 'user' ? 'justify-end' : 'justify-start'}`;

        let bubbleHtml = '';

        if (role === 'user') {
            bubbleHtml = `
                <div class="max-w-[85%] bg-blue-600 text-white text-[13px] px-3.5 py-2.5 rounded-2xl rounded-tr-sm shadow-md neu-s font-medium leading-relaxed" style="animation: fadeUp 0.3s ease;">
                    ${text}
                </div>
            `;
        } else {
            bubbleHtml = `
                <div class="flex gap-2.5 max-w-[90%]" style="animation: fadeUp 0.3s ease;">
                    <div class="w-7 h-7 flex-shrink-0 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 shadow-inner flex items-center justify-center neu-s mt-1">
                        <span class="material-symbols-outlined text-white text-[14px]">smart_toy</span>
                    </div>
                    <div class="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[13px] px-3.5 py-2.5 rounded-2xl rounded-tl-sm border border-black/5 dark:border-white/5 neu-s leading-relaxed">
                        ${text}
                    </div>
                </div>
            `;
        }

        wrapper.innerHTML = bubbleHtml;
        copilotThread.appendChild(wrapper);

        // Auto-scroll inside setTimeout to ensure rendering
        setTimeout(() => {
            copilotThread.scrollTop = copilotThread.scrollHeight;
        }, 10);

        return id;
    }

    function addLoadingMessage(id) {
        const copilotThread = document.getElementById('aos-copilot-msgs');
        if (!copilotThread) return;

        const wrapper = document.createElement('div');
        wrapper.id = id;
        wrapper.className = `flex w-full mb-4 justify-start`;

        const bubbleHtml = `
            <div class="flex gap-2.5 max-w-[90%]" style="animation: fadeUp 0.3s ease;">
                <div class="w-7 h-7 flex-shrink-0 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 shadow-inner flex items-center justify-center neu-s mt-1">
                    <span class="material-symbols-outlined text-white text-[14px]">smart_toy</span>
                </div>
                <div class="bg-transparent text-[13px] px-3.5 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1">
                    <div class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
                    <div class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.15s"></div>
                    <div class="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style="animation-delay: 0.3s"></div>
                </div>
            </div>
        `;

        wrapper.innerHTML = bubbleHtml;
        copilotThread.appendChild(wrapper);

        setTimeout(() => {
            copilotThread.scrollTop = copilotThread.scrollHeight;
        }, 10);
    }

    function removeMessage(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function clearHistory() {
        const copilotThread = document.getElementById('aos-copilot-msgs');
        if (!copilotThread) return;

        // Keep only the first welcome message
        const firstMsg = copilotThread.firstElementChild;
        copilotThread.innerHTML = '';
        if (firstMsg) copilotThread.appendChild(firstMsg);
    }

})();
