/* eslint-disable */
import {
  extractExternalCDL,
  extractExternalMedCert,
  verifyExternalDocument,
  processExternalDocumentBatch,
  getExternalBatchStatus
} from '../../backend/externalDocumentApi.jsw';

jest.mock('backend/ocrService', () => ({
  protectedOCRExtraction: jest.fn()
}));
jest.mock('backend/apiWebhookService', () => ({
  enqueueWebhookDelivery: jest.fn().mockResolvedValue({ success: true })
}));

const { protectedOCRExtraction } = require('backend/ocrService');
const { enqueueWebhookDelivery } = require('backend/apiWebhookService');

describe('externalDocumentApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rejects unsupported mime type', async () => {
    const result = await extractExternalCDL({
      base64_data: 'abcd',
      mime_type: 'text/plain'
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('invalid_request');
  });

  test('returns extraction payload for cdl', async () => {
    protectedOCRExtraction.mockResolvedValue({
      success: true,
      confidence: 'MEDIUM',
      extracted: {
        fullName: 'TEST USER',
        licenseNumber: 'A1234567',
        state: 'CA',
        cdlClass: 'A',
        endorsements: ['H'],
        restrictions: [],
        dob: '1990-01-01',
        expirationDate: '2030-01-01',
        address: '123 MAIN ST',
        city: 'MEMPHIS',
        zip: '38101'
      }
    });

    const result = await extractExternalCDL({
      base64_data: 'abcd',
      mime_type: 'image/png'
    });

    expect(result.success).toBe(true);
    expect(result.data.extracted_data.license_number).toBe('A1234567');
  });

  test('supports batch submit + status check', async () => {
    protectedOCRExtraction.mockResolvedValue({
      success: true,
      confidence: 'LOW',
      extracted: {}
    });

    const submit = await processExternalDocumentBatch({
      documents: [
        { base64_data: 'abcd', mime_type: 'image/png', type: 'cdl' },
        { base64_data: 'abcd', mime_type: 'image/png', type: 'medcert' }
      ]
    });

    expect(submit.success).toBe(true);
    expect(submit.data.batch_job_id).toBeTruthy();

    const status = await getExternalBatchStatus(submit.data.batch_job_id);
    expect(status.success).toBe(true);
    expect(status.data.total).toBe(2);
  });

  test('rejects batch requests larger than 25 documents', async () => {
    const documents = Array.from({ length: 26 }, () => ({
      base64_data: 'abcd',
      mime_type: 'image/png',
      type: 'cdl'
    }));

    const result = await processExternalDocumentBatch({ documents });
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('invalid_request');
    expect(result.message).toContain('Maximum 25 documents');
  });

  test('med cert extraction path returns document payload', async () => {
    protectedOCRExtraction.mockResolvedValue({
      success: true,
      extracted: {
        fullName: 'TEST USER',
        examinerName: 'DR TEST',
        registryNumber: '1234567890',
        certificateExpirationDate: '2030-01-01'
      }
    });

    const result = await extractExternalMedCert({
      base64_data: 'abcd',
      mime_type: 'image/jpeg'
    });

    expect(result.success).toBe(true);
    expect(result.data.extracted_data.examiner_registry_number).toBe('1234567890');
  });

  test('accepts data_url input as file upload alternative', async () => {
    protectedOCRExtraction.mockResolvedValue({
      success: true,
      extracted: {
        fullName: 'TEST USER',
        licenseNumber: 'B7654321',
        state: 'TX',
        cdlClass: 'A',
        expirationDate: '2031-01-01'
      }
    });

    const result = await extractExternalCDL({
      data_url: 'data:image/png;base64,abcd'
    });

    expect(result.success).toBe(true);
    expect(result.data.extracted_data.license_number).toBe('B7654321');
  });

  test('verifies extracted document by extraction id', async () => {
    protectedOCRExtraction.mockResolvedValue({
      success: true,
      extracted: {
        fullName: 'TEST USER',
        licenseNumber: 'A1234567',
        state: 'CA',
        expirationDate: '2030-01-01'
      }
    });

    const extracted = await extractExternalCDL({
      base64_data: 'abcd',
      mime_type: 'image/png'
    });
    const verifyById = await verifyExternalDocument({
      extracted_document_id: extracted.data.extraction_id
    });

    expect(verifyById.success).toBe(true);
    expect(verifyById.data.extracted_document_id).toBe(extracted.data.extraction_id);
    expect(extracted.data.extraction_id).toBeTruthy();
  });

  test('sends webhook callback when batch processing completes', async () => {
    protectedOCRExtraction.mockResolvedValue({
      success: true,
      extracted: {
        fullName: 'TEST USER',
        licenseNumber: 'A1234567',
        state: 'CA',
        expirationDate: '2030-01-01'
      }
    });

    const submit = await processExternalDocumentBatch({
      documents: [{ base64_data: 'abcd', mime_type: 'image/png', type: 'cdl' }],
      webhook_callback_url: 'https://partner.example/callback'
    });

    expect(submit.success).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(enqueueWebhookDelivery).toHaveBeenCalled();
  });
});
