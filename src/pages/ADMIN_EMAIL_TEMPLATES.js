import wixLocation from 'wix-location';
import {
    getAllTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    activateTemplate,
    revertToVersion,
    renderEmail,
    sendTestEmail
} from 'backend/emailTemplateService.jsw';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(async function () {
    const components = getHtmlComponents();

    if (!components.length) {
        console.warn('ADMIN_EMAIL_TEMPLATES: No HTML component found');
        return;
    }

    for (const component of components) {
        component.onMessage(async (event) => {
            await routeMessage(component, event?.data);
        });

        // Send init signal
        safeSend(component, { action: 'init' });
    }
});

function getHtmlComponents() {
    const found = [];
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const component = $w(id);
            if (component && typeof component.onMessage === 'function') {
                found.push(component);
            }
        } catch (error) {}
    }
    return found;
}

async function routeMessage(component, message) {
    if (!message?.action) return;

    const { action } = message;

    if (action === 'navigateTo') {
        const destination = message.destination;
        if (destination) wixLocation.to(`/${destination}`);
        return;
    }

    try {
        switch (action) {
            case 'getAllTemplates':
                await handleGetAllTemplates(component, message.category);
                break;

            case 'getTemplate':
                await handleGetTemplate(component, message.templateKey);
                break;

            case 'createTemplate':
                await handleCreateTemplate(component, message.templateData);
                break;

            case 'updateTemplate':
                await handleUpdateTemplate(component, message.templateKey, message.updates);
                break;

            case 'activateTemplate':
                await handleActivateTemplate(component, message.templateKey);
                break;

            case 'revertToVersion':
                await handleRevertToVersion(component, message.templateKey, message.version);
                break;

            case 'sendTestEmail':
                await handleSendTestEmail(component, message.templateKey, message.recipientEmail, message.sampleData);
                break;

            default:
                console.warn('ADMIN_EMAIL_TEMPLATES: Unknown action:', action);
        }
    } catch (error) {
        console.error('ADMIN_EMAIL_TEMPLATES: Error', error);
        safeSend(component, { action: 'actionError', message: error.message });
    }
}

// ============================================
// HANDLERS
// ============================================

async function handleGetAllTemplates(component, category) {
    const templates = await getAllTemplates(category);
    safeSend(component, { action: 'templatesLoaded', payload: templates });
}

async function handleGetTemplate(component, templateKey) {
    const template = await getTemplate(templateKey);
    safeSend(component, { action: 'templateLoaded', payload: template });
}

async function handleCreateTemplate(component, templateData) {
    const result = await createTemplate(templateData);
    if (result.success || result._id) {
        safeSend(component, { action: 'actionSuccess', message: 'Template created' });
    } else {
        safeSend(component, { action: 'actionError', message: 'Failed to create template' });
    }
}

async function handleUpdateTemplate(component, templateKey, updates) {
    const result = await updateTemplate(templateKey, updates);
    if (result.success || result._id) {
        safeSend(component, { action: 'actionSuccess', message: 'Template updated' });
    } else {
        safeSend(component, { action: 'actionError', message: 'Failed to update template' });
    }
}

async function handleActivateTemplate(component, templateKey) {
    const result = await activateTemplate(templateKey);
    if (result.success || result._id) {
        safeSend(component, { action: 'actionSuccess', message: 'Template activated' });
    }
}

async function handleRevertToVersion(component, templateKey, version) {
    const result = await revertToVersion(templateKey, version);
    if (result.success || result._id) {
        safeSend(component, { action: 'actionSuccess', message: `Reverted to version ${version}` });
    }
}

async function handleSendTestEmail(component, templateKey, recipientEmail, sampleData) {
    const result = await sendTestEmail(templateKey, recipientEmail, sampleData);
    if (result.success) {
        safeSend(component, { action: 'actionSuccess', message: `Test email sent to ${recipientEmail}` });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

function safeSend(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (error) {}
}
