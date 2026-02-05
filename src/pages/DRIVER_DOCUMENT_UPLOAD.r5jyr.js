/**
 * DRIVER_DOCUMENT_UPLOAD Page Code
 * Bridges DRIVER_DOCUMENT_UPLOAD.html with onboardingWorkflowService.
 *
 * HTML uses type key pattern.
 * HTML sends: documentUploadReady, requestDocumentList, uploadDocument
 * HTML expects: initDocumentUpload, documentList, uploadResult, verificationUpdate
 */

import {
    getWorkflowStatus,
    getComplianceChecklist
} from 'backend/onboardingWorkflowService';

import wixLocationFrontend from 'wix-location-frontend';
import wixUsers from 'wix-users';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('DRIVER_DOCUMENT_UPLOAD: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('DRIVER_DOCUMENT_UPLOAD: No HTML component found');
        return;
    }

    component.onMessage(async (event) => {
        const msg = event && event.data;
        if (!msg || !msg.type) return;
        await routeMessage(component, msg);
    });

    safeSend(component, { type: 'init' });
});

function findHtmlComponent() {
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') {
                return el;
            }
        } catch (e) {
            // Element not present
        }
    }
    return null;
}

async function routeMessage(component, msg) {
    switch (msg.type) {
        case 'documentUploadReady':
            await handleDocumentUploadReady(component);
            break;
        case 'requestDocumentList':
            await handleRequestDocumentList(component, msg);
            break;
        case 'uploadDocument':
            await handleUploadDocument(component, msg);
            break;
        default:
            console.warn('DRIVER_DOCUMENT_UPLOAD: Unknown type:', msg.type);
    }
}

async function handleDocumentUploadReady(component) {
    try {
        const query = wixLocationFrontend.query;
        const workflowId = query.workflowId || query.wfId || '';

        let workflowData = {};
        if (workflowId) {
            workflowData = await getWorkflowStatus(workflowId) || {};
        }

        safeSend(component, {
            type: 'initDocumentUpload',
            data: {
                workflowId,
                uploadToken: workflowId,
                driverName: workflowData.driverName || '',
                recruiterName: workflowData.recruiterName || '',
                recruiterEmail: workflowData.recruiterEmail || '',
                carrierName: workflowData.carrierName || ''
            }
        });
    } catch (error) {
        console.error('DRIVER_DOCUMENT_UPLOAD: init error:', error);
        safeSend(component, {
            type: 'initDocumentUpload',
            data: { workflowId: '', uploadToken: '', driverName: '', recruiterName: '', recruiterEmail: '', carrierName: '' }
        });
    }
}

async function handleRequestDocumentList(component, msg) {
    try {
        const data = msg.data || {};
        const workflowId = data.workflowId;
        if (!workflowId) {
            safeSend(component, { type: 'documentList', data: { documents: [] } });
            return;
        }
        const checklist = await getComplianceChecklist(workflowId);
        safeSend(component, {
            type: 'documentList',
            data: { documents: checklist || [] }
        });
    } catch (error) {
        console.error('DRIVER_DOCUMENT_UPLOAD: requestDocumentList error:', error);
        safeSend(component, { type: 'documentList', data: { documents: [] } });
    }
}

async function handleUploadDocument(component, msg) {
    try {
        const data = msg.data || {};
        // File upload handling requires a dedicated backend endpoint
        // The HTML sends base64 file data in data.fileData
        safeSend(component, {
            type: 'uploadResult',
            data: {
                documentType: data.documentType,
                success: false,
                error: 'Upload endpoint not yet configured'
            }
        });
    } catch (error) {
        console.error('DRIVER_DOCUMENT_UPLOAD: uploadDocument error:', error);
        safeSend(component, {
            type: 'uploadResult',
            data: {
                documentType: (msg.data || {}).documentType,
                success: false,
                error: error.message
            }
        });
    }
}
