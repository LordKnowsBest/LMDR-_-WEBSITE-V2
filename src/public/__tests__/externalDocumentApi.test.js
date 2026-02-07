import {
  extractExternalCDL,
  extractExternalMedCert,
  processExternalDocumentBatch,
  getExternalBatchStatus
} from '../../backend/externalDocumentApi.jsw';

jest.mock('backend/ocrService', () => ({
  protectedOCRExtraction: jest.fn()
}));

const { protectedOCRExtraction } = require('backend/ocrService');

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
});
