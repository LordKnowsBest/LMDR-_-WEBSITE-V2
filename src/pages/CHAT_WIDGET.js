import { createTicket } from 'backend/supportTicketService.jsw';
import { startChatSession, sendChatMessage, getChatMessagesSince } from 'backend/chatSupportService.jsw';

$w.onReady(function () {
    const widget = $w('#html1'); // Assuming the widget is in #html1

    if (widget && typeof widget.onMessage === 'function') {
        widget.onMessage(async (event) => {
            const { action, ticketData, sessionId, content, lastTimestamp } = event.data;

            try {
                switch (action) {
                    case 'createTicket':
                        const ticketRes = await createTicket(ticketData);
                        widget.postMessage({ action: 'ticketCreated', payload: ticketRes });
                        break;
                    case 'startChat':
                        const chatRes = await startChatSession(event.data.userData, event.data.topic);
                        widget.postMessage({ action: 'chatStarted', payload: chatRes });
                        break;
                    case 'sendMessage':
                        const msgRes = await sendChatMessage(sessionId, content, 'user');
                        widget.postMessage({ action: 'messageSent', payload: msgRes });
                        break;
                    case 'getMessages':
                        const msgs = await getChatMessagesSince(sessionId, lastTimestamp);
                        widget.postMessage({ action: 'messagesLoaded', payload: msgs.items });
                        break;
                }
            } catch (error) {
                widget.postMessage({ action: 'error', message: error.message });
            }
        });
    }
});
