/**
 * DRIVER_DOCUMENT_UPLOAD Page Code
 * Bridges DRIVER_DOCUMENT_UPLOAD.html with onboardingWorkflowService.
 *
 * HTML uses type key pattern.
 * HTML sends: documentUploadReady, requestDocumentList, uploadDocument
 * HTML expects: initDocumentUpload, documentList, uploadResult, verificationUpdate
 */

import {
    getWorkflowStatus
} from 'backend/onboardingWorkflowService';
import {
    getDocumentStatus,
    uploadDocument as uploadDriverDocument
} from 'backend/documentCollectionService';

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
        let uploadToken = '';
        if (workflowId) {
            workflowData = await getWorkflowStatus(workflowId) || {};
            const docStatus = await getDocumentStatus(workflowId);
            const firstPendingDoc = (docStatus?.documents || []).find(
                (d) => d.status === 'requested' || d.status === 'rejected'
            );
            uploadToken = firstPendingDoc?.upload_token || '';
        }

        const workflow = workflowData.workflow || {};
        const meta = workflow.metadata || {};

        safeSend(component, {
            type: 'initDocumentUpload',
            data: {
                workflowId,
                uploadToken,
                driverName: meta.driver_name || workflowData.driverName || '',
                recruiterName: meta.recruiter_name || workflowData.recruiterName || '',
                recruiterEmail: meta.recruiter_email || workflowData.recruiterEmail || '',
                carrierName: meta.carrier_name || workflowData.carrierName || ''
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
        const result = await getDocumentStatus(workflowId);
        const documents = (result?.documents || []).map((doc) => ({
            documentId: doc._id || doc.id,
            documentType: doc.document_type || doc.documentType,
            displayName: doc.display_name || doc.document_type || 'Document',
            description: doc.description || '',
            isRequired: !!doc.is_required,
            status: doc.status || 'requested',
            rejectionReason: doc.rejection_reason || null,
            submittedDate: doc.submitted_date || null
        }));
        safeSend(component, {
            type: 'documentList',
            data: { documents }
        });
    } catch (error) {
        console.error('DRIVER_DOCUMENT_UPLOAD: requestDocumentList error:', error);
        safeSend(component, { type: 'documentList', data: { documents: [] } });
    }
}

async function handleUploadDocument(component, msg) {
    try {
        const data = msg.data || {};
        const token = data.token;
        const documentType = data.documentType;
        const fileData = {
            mimeType: data.fileType,
            size: data.fileSize,
            fileName: data.fileName,
            content: data.fileData
        };

        const result = await uploadDriverDocument(token, documentType, fileData);
        safeSend(component, {
            type: 'uploadResult',
            data: {
                documentType,
                success: !!result?.success,
                documentId: result?.documentId || null,
                error: result?.error || null
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
