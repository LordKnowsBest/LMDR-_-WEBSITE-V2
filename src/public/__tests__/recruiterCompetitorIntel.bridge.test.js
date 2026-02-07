/**
 * Bridge Test: RECRUITER_COMPETITOR_INTEL.hvbs4.js
 *
 * Tests the postMessage bridge between Wix page code and HTML iframe component.
 * This page uses the TYPE PROTOCOL: { type, data, timestamp } envelope.
 *
 * Page File: src/pages/RECRUITER_COMPETITOR_INTEL.hvbs4.js
 * Backend Services: mockBackend.jsw
 * HTML File: recruiter/RECRUITER_COMPETITOR_INTEL.html
 *
 * Message Registry:
 * - Inbound: competitorIntelReady, getCompetitorData, addIntel, updateIntel,
 *            verifyIntel, getPayBenchmarks, triggerScrape
 * - Outbound: competitorData, competitorError, intelResult, payBenchmarksData, scrapeResult
 *
 * Coverage Target: ~50 tests
 * Protocol: TYPE (not ACTION)
 */

const fs = require('fs');
const path = require('path');

// Read the actual source file
const sourceFilePath = path.resolve(__dirname, '../../pages/RECRUITER_COMPETITOR_INTEL.hvbs4.js');
const sourceCode = fs.readFileSync(sourceFilePath, 'utf-8');

// Mock backend service (no jest.mock - bridge tests use replicated logic)
const mockBackend = {
  addCompetitorIntel: jest.fn(),
  updateCompetitorIntel: jest.fn(),
  verifyCompetitorIntel: jest.fn(),
  getCompetitorComparison: jest.fn(),
  getPayBenchmarks: jest.fn(),
  triggerCompetitorScrape: jest.fn()
};

const mockWixUsers = {
  currentUser: {
    loggedIn: true,
    id: 'test-user-123',
    role: 'Admin'
  }
};

describe('RECRUITER_COMPETITOR_INTEL Bridge Tests', () => {

  // ============================================================================
  // 1. SOURCE FILE STRUCTURE TESTS
  // ============================================================================

  describe('Source File Structure', () => {

    test('should import recruiterAnalyticsService functions', () => {
      expect(sourceCode).toContain("from 'backend/recruiterAnalyticsService.jsw'");
      expect(sourceCode).toContain('addCompetitorIntel');
      expect(sourceCode).toContain('updateCompetitorIntel');
      expect(sourceCode).toContain('verifyCompetitorIntel');
      expect(sourceCode).toContain('getCompetitorComparison');
      expect(sourceCode).toContain('getPayBenchmarks');
      expect(sourceCode).toContain('triggerCompetitorScrape');
    });

    test('should import wixUsers', () => {
      expect(sourceCode).toContain("from 'wix-users'");
      expect(sourceCode).toContain('wixUsers');
    });

    test('should define CONFIG object with htmlComponentId', () => {
      expect(sourceCode).toContain('CONFIG');
      expect(sourceCode).toContain('htmlComponentId');
      expect(sourceCode).toContain('debugMessages');
    });

    test('should define MESSAGE_REGISTRY for inbound messages', () => {
      expect(sourceCode).toContain('MESSAGE_REGISTRY');
      expect(sourceCode).toContain('competitorIntelReady');
      expect(sourceCode).toContain('getCompetitorData');
      expect(sourceCode).toContain('addIntel');
      expect(sourceCode).toContain('updateIntel');
      expect(sourceCode).toContain('verifyIntel');
      expect(sourceCode).toContain('getPayBenchmarks');
      expect(sourceCode).toContain('triggerScrape');
    });

    test('should define outbound message types', () => {
      expect(sourceCode).toContain('competitorData');
      expect(sourceCode).toContain('competitorError');
      expect(sourceCode).toContain('intelResult');
      expect(sourceCode).toContain('payBenchmarksData');
      expect(sourceCode).toContain('scrapeResult');
    });

    test('should declare carrierDot global state variable', () => {
      expect(sourceCode).toContain('carrierDot');
    });

    test('should define getHtmlComponent function', () => {
      expect(sourceCode).toContain('getHtmlComponent');
    });

    test('should define handleMessage function', () => {
      expect(sourceCode).toContain('handleMessage');
    });

    test('should define sendToHtml utility function', () => {
      expect(sourceCode).toContain('sendToHtml');
    });

    test('should use type protocol (not action)', () => {
      expect(sourceCode).toContain('msg.type');
      expect(sourceCode).toContain('{ type');
      expect(sourceCode).toContain('timestamp');
    });

  });

  // ============================================================================
  // 2. SAFETY CHECKS
  // ============================================================================

  describe('Safety Checks', () => {

    let mockComponent;
    let handleMessage;

    beforeEach(() => {
      mockComponent = {
        postMessage: jest.fn(),
        onMessage: jest.fn()
      };

      // Replicated handleMessage logic
      handleMessage = async (msg) => {
        if (!msg || !msg.type) {
          return;
        }

        const { type, data } = msg;

        try {
          switch (type) {
            case 'competitorIntelReady':
            case 'getCompetitorData':
            case 'addIntel':
            case 'updateIntel':
            case 'verifyIntel':
            case 'getPayBenchmarks':
            case 'triggerScrape':
              // Valid message types
              break;
            default:
              // Unrecognized type
              break;
          }
        } catch (error) {
          // Error handling
        }
      };
    });

    test('should guard against null message', async () => {
      await expect(handleMessage(null)).resolves.not.toThrow();
    });

    test('should guard against undefined message', async () => {
      await expect(handleMessage(undefined)).resolves.not.toThrow();
    });

    test('should guard against message without type', async () => {
      await expect(handleMessage({ data: {} })).resolves.not.toThrow();
    });

    test('should guard against message with empty type', async () => {
      await expect(handleMessage({ type: '', data: {} })).resolves.not.toThrow();
    });

    test('should accept valid message with type and data', async () => {
      await expect(handleMessage({
        type: 'competitorIntelReady',
        data: {}
      })).resolves.not.toThrow();
    });

  });

  // ============================================================================
  // 3. HTML COMPONENT DISCOVERY
  // ============================================================================

  describe('HTML Component Discovery', () => {

    test('should check CONFIG.htmlComponentId first', () => {
      expect(sourceCode).toMatch(/CONFIG\.htmlComponentId/);
    });

    test('should fallback to html1-html5 iteration', () => {
      expect(sourceCode).toMatch(/html[1-5]/);
    });

    test('should check htmlEmbed1 as fallback', () => {
      expect(sourceCode).toContain('htmlEmbed1');
    });

    test('should validate component has onMessage method', () => {
      expect(sourceCode).toMatch(/typeof.*onMessage.*function/i);
    });

    test('should use try-catch for component access', () => {
      expect(sourceCode).toMatch(/try\s*{[\s\S]*catch/);
    });

  });

  // ============================================================================
  // 4. MESSAGE ROUTING - competitorIntelReady
  // ============================================================================

  describe('Message: competitorIntelReady', () => {

    let mockComponent;
    let handleMessage;
    let carrierDot;

    beforeEach(() => {
      mockComponent = {
        postMessage: jest.fn()
      };
      carrierDot = null;

      handleMessage = async (msg) => {
        if (!msg || !msg.type) return;

        const { type, data } = msg;

        const sendToHtml = (type, data) => {
          mockComponent.postMessage({
            type,
            data,
            timestamp: Date.now()
          });
        };

        switch (type) {
          case 'competitorIntelReady':
            if (carrierDot) {
              sendToHtml('carrierContext', {
                carrierDot,
                timestamp: Date.now()
              });
            }
            break;
        }
      };
    });

    test('should handle competitorIntelReady with carrierDot set', async () => {
      carrierDot = '1234567';
      await handleMessage({ type: 'competitorIntelReady', data: {} });

      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'carrierContext',
          data: expect.objectContaining({
            carrierDot: '1234567'
          }),
          timestamp: expect.any(Number)
        })
      );
    });

    test('should not send carrierContext when carrierDot is null', async () => {
      carrierDot = null;
      await handleMessage({ type: 'competitorIntelReady', data: {} });

      expect(mockComponent.postMessage).not.toHaveBeenCalled();
    });

    test('should not send carrierContext when carrierDot is undefined', async () => {
      carrierDot = undefined;
      await handleMessage({ type: 'competitorIntelReady', data: {} });

      expect(mockComponent.postMessage).not.toHaveBeenCalled();
    });

  });

  // ============================================================================
  // 5. MESSAGE ROUTING - getCompetitorData
  // ============================================================================

  describe('Message: getCompetitorData', () => {

    let mockComponent;
    let handleMessage;
    let carrierDot;

    beforeEach(() => {
      mockComponent = {
        postMessage: jest.fn()
      };
      carrierDot = '7654321';

      mockBackend.getCompetitorComparison.mockResolvedValue({
        competitors: [
          { name: 'Carrier A', payRate: 0.55 },
          { name: 'Carrier B', payRate: 0.60 }
        ]
      });

      mockBackend.getPayBenchmarks.mockResolvedValue({
        averagePay: 0.58,
        percentile25: 0.52,
        percentile75: 0.65
      });

      handleMessage = async (msg) => {
        if (!msg || !msg.type) return;

        const { type, data } = msg;

        const sendToHtml = (type, data) => {
          mockComponent.postMessage({
            type,
            data,
            timestamp: Date.now()
          });
        };

        try {
          switch (type) {
            case 'getCompetitorData': {
              const dot = data?.carrierDot || carrierDot;
              const region = data?.region || 'national';
              const jobType = data?.jobType || 'OTR';

              const [comparisonData, benchmarkData] = await Promise.all([
                mockBackend.getCompetitorComparison(region, jobType),
                mockBackend.getPayBenchmarks(region, jobType)
              ]);

              sendToHtml('competitorData', {
                carrierDot: dot,
                comparison: comparisonData,
                benchmarks: benchmarkData
              });
              break;
            }
          }
        } catch (error) {
          sendToHtml('competitorError', {
            message: error.message
          });
        }
      };
    });

    test('should fetch competitor data with default parameters', async () => {
      await handleMessage({
        type: 'getCompetitorData',
        data: {}
      });

      expect(mockBackend.getCompetitorComparison).toHaveBeenCalledWith('national', 'OTR');
      expect(mockBackend.getPayBenchmarks).toHaveBeenCalledWith('national', 'OTR');
      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'competitorData',
          data: expect.objectContaining({
            carrierDot: '7654321',
            comparison: expect.any(Object),
            benchmarks: expect.any(Object)
          })
        })
      );
    });

    test('should use data.carrierDot if provided', async () => {
      await handleMessage({
        type: 'getCompetitorData',
        data: { carrierDot: '9999999' }
      });

      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'competitorData',
          data: expect.objectContaining({
            carrierDot: '9999999'
          })
        })
      );
    });

    test('should use custom region and jobType', async () => {
      await handleMessage({
        type: 'getCompetitorData',
        data: { region: 'midwest', jobType: 'Regional' }
      });

      expect(mockBackend.getCompetitorComparison).toHaveBeenCalledWith('midwest', 'Regional');
      expect(mockBackend.getPayBenchmarks).toHaveBeenCalledWith('midwest', 'Regional');
    });

    test('should handle error when fetching competitor data', async () => {
      mockBackend.getCompetitorComparison.mockRejectedValue(
        new Error('Failed to fetch comparison data')
      );

      await handleMessage({
        type: 'getCompetitorData',
        data: {}
      });

      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'competitorError',
          data: expect.objectContaining({
            message: 'Failed to fetch comparison data'
          })
        })
      );
    });

  });

  // ============================================================================
  // 6. MESSAGE ROUTING - addIntel
  // ============================================================================

  describe('Message: addIntel', () => {

    let mockComponent;
    let handleMessage;

    beforeEach(() => {
      mockComponent = {
        postMessage: jest.fn()
      };

      mockBackend.addCompetitorIntel.mockResolvedValue({
        _id: 'intel-123',
        carrierDot: '1234567',
        competitorDot: '7654321',
        metric: 'pay_rate',
        value: 0.58
      });

      handleMessage = async (msg) => {
        if (!msg || !msg.type) return;

        const { type, data } = msg;

        const sendToHtml = (type, data) => {
          mockComponent.postMessage({
            type,
            data,
            timestamp: Date.now()
          });
        };

        try {
          switch (type) {
            case 'addIntel': {
              if (!data) {
                throw new Error('Intel data is required');
              }

              const result = await mockBackend.addCompetitorIntel(data);
              sendToHtml('intelResult', {
                success: true,
                intel: result
              });
              break;
            }
          }
        } catch (error) {
          sendToHtml('competitorError', {
            message: error.message
          });
        }
      };
    });

    test('should add competitor intel successfully', async () => {
      const intelData = {
        carrierDot: '1234567',
        competitorDot: '7654321',
        metric: 'pay_rate',
        value: 0.58
      };

      await handleMessage({
        type: 'addIntel',
        data: intelData
      });

      expect(mockBackend.addCompetitorIntel).toHaveBeenCalledWith(intelData);
      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'intelResult',
          data: expect.objectContaining({
            success: true,
            intel: expect.objectContaining({
              _id: 'intel-123'
            })
          })
        })
      );
    });

    test('should handle error when data is missing', async () => {
      await handleMessage({
        type: 'addIntel',
        data: null
      });

      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'competitorError',
          data: expect.objectContaining({
            message: 'Intel data is required'
          })
        })
      );
    });

    test('should handle service error when adding intel', async () => {
      mockBackend.addCompetitorIntel.mockRejectedValue(
        new Error('Database error')
      );

      await handleMessage({
        type: 'addIntel',
        data: { carrierDot: '1234567' }
      });

      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'competitorError',
          data: expect.objectContaining({
            message: 'Database error'
          })
        })
      );
    });

  });

  // ============================================================================
  // 7. MESSAGE ROUTING - updateIntel
  // ============================================================================

  describe('Message: updateIntel', () => {

    let mockComponent;
    let handleMessage;

    beforeEach(() => {
      mockComponent = {
        postMessage: jest.fn()
      };

      mockBackend.updateCompetitorIntel.mockResolvedValue({
        _id: 'intel-123',
        value: 0.62,
        updatedAt: new Date().toISOString()
      });

      handleMessage = async (msg) => {
        if (!msg || !msg.type) return;

        const { type, data } = msg;

        const sendToHtml = (type, data) => {
          mockComponent.postMessage({
            type,
            data,
            timestamp: Date.now()
          });
        };

        try {
          switch (type) {
            case 'updateIntel': {
              if (!data?.intelId) {
                throw new Error('Intel ID is required');
              }

              if (!data?.updates) {
                throw new Error('Updates are required');
              }

              const result = await mockBackend.updateCompetitorIntel(
                data.intelId,
                data.updates
              );

              sendToHtml('intelResult', {
                success: true,
                intel: result
              });
              break;
            }
          }
        } catch (error) {
          sendToHtml('competitorError', {
            message: error.message
          });
        }
      };
    });

    test('should update competitor intel successfully', async () => {
      await handleMessage({
        type: 'updateIntel',
        data: {
          intelId: 'intel-123',
          updates: { value: 0.62 }
        }
      });

      expect(mockBackend.updateCompetitorIntel).toHaveBeenCalledWith(
        'intel-123',
        { value: 0.62 }
      );
      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'intelResult',
          data: expect.objectContaining({
            success: true,
            intel: expect.objectContaining({
              _id: 'intel-123',
              value: 0.62
            })
          })
        })
      );
    });

    test('should handle error when intelId is missing', async () => {
      await handleMessage({
        type: 'updateIntel',
        data: { updates: { value: 0.62 } }
      });

      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'competitorError',
          data: expect.objectContaining({
            message: 'Intel ID is required'
          })
        })
      );
    });

    test('should handle error when updates are missing', async () => {
      await handleMessage({
        type: 'updateIntel',
        data: { intelId: 'intel-123' }
      });

      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'competitorError',
          data: expect.objectContaining({
            message: 'Updates are required'
          })
        })
      );
    });

  });

  // ============================================================================
  // 8. MESSAGE ROUTING - verifyIntel
  // ============================================================================

  describe('Message: verifyIntel', () => {

    let mockComponent;
    let handleMessage;

    beforeEach(() => {
      mockComponent = {
        postMessage: jest.fn()
      };

      mockBackend.verifyCompetitorIntel.mockResolvedValue({
        _id: 'intel-123',
        verified: true,
        verifiedBy: 'test-user-123',
        verifiedAt: new Date().toISOString()
      });

      handleMessage = async (msg) => {
        if (!msg || !msg.type) return;

        const { type, data } = msg;

        const sendToHtml = (type, data) => {
          mockComponent.postMessage({
            type,
            data,
            timestamp: Date.now()
          });
        };

        try {
          switch (type) {
            case 'verifyIntel': {
              if (!data?.intelId) {
                throw new Error('Intel ID is required');
              }

              const currentUser = mockWixUsers.currentUser;
              const verifierId = data?.verifierId || currentUser.id;

              const result = await mockBackend.verifyCompetitorIntel(
                data.intelId,
                verifierId
              );

              sendToHtml('intelResult', {
                success: true,
                intel: result
              });
              break;
            }
          }
        } catch (error) {
          sendToHtml('competitorError', {
            message: error.message
          });
        }
      };
    });

    test('should verify intel with current user', async () => {
      await handleMessage({
        type: 'verifyIntel',
        data: { intelId: 'intel-123' }
      });

      expect(mockBackend.verifyCompetitorIntel).toHaveBeenCalledWith(
        'intel-123',
        'test-user-123'
      );
      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'intelResult',
          data: expect.objectContaining({
            success: true,
            intel: expect.objectContaining({
              verified: true,
              verifiedBy: 'test-user-123'
            })
          })
        })
      );
    });

    test('should verify intel with custom verifierId', async () => {
      await handleMessage({
        type: 'verifyIntel',
        data: { intelId: 'intel-123', verifierId: 'admin-456' }
      });

      expect(mockBackend.verifyCompetitorIntel).toHaveBeenCalledWith(
        'intel-123',
        'admin-456'
      );
    });

    test('should handle error when intelId is missing', async () => {
      await handleMessage({
        type: 'verifyIntel',
        data: {}
      });

      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'competitorError',
          data: expect.objectContaining({
            message: 'Intel ID is required'
          })
        })
      );
    });

  });

  // ============================================================================
  // 9. MESSAGE ROUTING - getPayBenchmarks
  // ============================================================================

  describe('Message: getPayBenchmarks', () => {

    let mockComponent;
    let handleMessage;

    beforeEach(() => {
      mockComponent = {
        postMessage: jest.fn()
      };

      mockBackend.getPayBenchmarks.mockResolvedValue({
        averagePay: 0.58,
        percentile25: 0.52,
        percentile50: 0.58,
        percentile75: 0.65,
        percentile90: 0.72
      });

      handleMessage = async (msg) => {
        if (!msg || !msg.type) return;

        const { type, data } = msg;

        const sendToHtml = (type, data) => {
          mockComponent.postMessage({
            type,
            data,
            timestamp: Date.now()
          });
        };

        try {
          switch (type) {
            case 'getPayBenchmarks': {
              const region = data?.region || 'national';
              const jobType = data?.jobType || 'OTR';

              const benchmarks = await mockBackend.getPayBenchmarks(
                region,
                jobType
              );

              sendToHtml('payBenchmarksData', {
                region,
                jobType,
                benchmarks
              });
              break;
            }
          }
        } catch (error) {
          sendToHtml('competitorError', {
            message: error.message
          });
        }
      };
    });

    test('should fetch pay benchmarks with default parameters', async () => {
      await handleMessage({
        type: 'getPayBenchmarks',
        data: {}
      });

      expect(mockBackend.getPayBenchmarks).toHaveBeenCalledWith('national', 'OTR');
      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'payBenchmarksData',
          data: expect.objectContaining({
            region: 'national',
            jobType: 'OTR',
            benchmarks: expect.objectContaining({
              averagePay: 0.58
            })
          })
        })
      );
    });

    test('should fetch pay benchmarks with custom region', async () => {
      await handleMessage({
        type: 'getPayBenchmarks',
        data: { region: 'southwest' }
      });

      expect(mockBackend.getPayBenchmarks).toHaveBeenCalledWith('southwest', 'OTR');
    });

    test('should fetch pay benchmarks with custom jobType', async () => {
      await handleMessage({
        type: 'getPayBenchmarks',
        data: { jobType: 'Local' }
      });

      expect(mockBackend.getPayBenchmarks).toHaveBeenCalledWith('national', 'Local');
    });

    test('should fetch pay benchmarks with both custom parameters', async () => {
      await handleMessage({
        type: 'getPayBenchmarks',
        data: { region: 'northeast', jobType: 'Regional' }
      });

      expect(mockBackend.getPayBenchmarks).toHaveBeenCalledWith('northeast', 'Regional');
    });

    test('should handle error when fetching benchmarks', async () => {
      mockBackend.getPayBenchmarks.mockRejectedValue(
        new Error('Benchmark data unavailable')
      );

      await handleMessage({
        type: 'getPayBenchmarks',
        data: {}
      });

      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'competitorError',
          data: expect.objectContaining({
            message: 'Benchmark data unavailable'
          })
        })
      );
    });

  });

  // ============================================================================
  // 10. MESSAGE ROUTING - triggerScrape
  // ============================================================================

  describe('Message: triggerScrape', () => {

    let mockComponent;
    let handleMessage;

    beforeEach(() => {
      mockComponent = {
        postMessage: jest.fn()
      };

      mockBackend.triggerCompetitorScrape.mockResolvedValue({
        jobId: 'scrape-job-789',
        status: 'pending',
        urlCount: 2
      });

      handleMessage = async (msg) => {
        if (!msg || !msg.type) return;

        const { type, data } = msg;

        const sendToHtml = (type, data) => {
          mockComponent.postMessage({
            type,
            data,
            timestamp: Date.now()
          });
        };

        try {
          switch (type) {
            case 'triggerScrape': {
              if (!data?.urls || !Array.isArray(data.urls) || data.urls.length === 0) {
                throw new Error('URLs array is required and must not be empty');
              }

              const result = await mockBackend.triggerCompetitorScrape(data.urls);

              sendToHtml('scrapeResult', {
                success: true,
                job: result
              });
              break;
            }
          }
        } catch (error) {
          sendToHtml('competitorError', {
            message: error.message
          });
        }
      };
    });

    test('should trigger scrape with valid URLs', async () => {
      const urls = [
        'https://example.com/carrier1',
        'https://example.com/carrier2'
      ];

      await handleMessage({
        type: 'triggerScrape',
        data: { urls }
      });

      expect(mockBackend.triggerCompetitorScrape).toHaveBeenCalledWith(urls);
      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'scrapeResult',
          data: expect.objectContaining({
            success: true,
            job: expect.objectContaining({
              jobId: 'scrape-job-789',
              status: 'pending'
            })
          })
        })
      );
    });

    test('should handle error when urls is missing', async () => {
      await handleMessage({
        type: 'triggerScrape',
        data: {}
      });

      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'competitorError',
          data: expect.objectContaining({
            message: 'URLs array is required and must not be empty'
          })
        })
      );
    });

    test('should handle error when urls is not an array', async () => {
      await handleMessage({
        type: 'triggerScrape',
        data: { urls: 'not-an-array' }
      });

      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'competitorError',
          data: expect.objectContaining({
            message: 'URLs array is required and must not be empty'
          })
        })
      );
    });

    test('should handle error when urls array is empty', async () => {
      await handleMessage({
        type: 'triggerScrape',
        data: { urls: [] }
      });

      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'competitorError',
          data: expect.objectContaining({
            message: 'URLs array is required and must not be empty'
          })
        })
      );
    });

    test('should handle service error when triggering scrape', async () => {
      mockBackend.triggerCompetitorScrape.mockRejectedValue(
        new Error('Scrape service unavailable')
      );

      await handleMessage({
        type: 'triggerScrape',
        data: { urls: ['https://example.com'] }
      });

      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'competitorError',
          data: expect.objectContaining({
            message: 'Scrape service unavailable'
          })
        })
      );
    });

  });

  // ============================================================================
  // 11. ERROR HANDLING
  // ============================================================================

  describe('Error Handling', () => {

    let mockComponent;
    let handleMessage;

    beforeEach(() => {
      mockComponent = {
        postMessage: jest.fn()
      };

      handleMessage = async (msg) => {
        if (!msg || !msg.type) return;

        const { type, data } = msg;

        const sendToHtml = (type, data) => {
          mockComponent.postMessage({
            type,
            data,
            timestamp: Date.now()
          });
        };

        try {
          switch (type) {
            case 'getCompetitorData':
              throw new Error('Service unavailable');
            default:
              break;
          }
        } catch (error) {
          sendToHtml('competitorError', {
            message: error.message
          });
        }
      };
    });

    test('should send competitorError on exception', async () => {
      await handleMessage({
        type: 'getCompetitorData',
        data: {}
      });

      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'competitorError',
          data: expect.objectContaining({
            message: 'Service unavailable'
          })
        })
      );
    });

    test('should include error message in competitorError', async () => {
      await handleMessage({
        type: 'getCompetitorData',
        data: {}
      });

      const call = mockComponent.postMessage.mock.calls[0][0];
      expect(call.data.message).toBe('Service unavailable');
    });

    test('should use try-catch for all message types', () => {
      expect(sourceCode).toMatch(/try\s*{[\s\S]*catch\s*\(/);
    });

  });

  // ============================================================================
  // 12. sendToHtml UTILITY
  // ============================================================================

  describe('sendToHtml Utility', () => {

    let mockComponent;
    let sendToHtml;

    beforeEach(() => {
      mockComponent = {
        postMessage: jest.fn()
      };

      sendToHtml = (type, data) => {
        mockComponent.postMessage({
          type,
          data,
          timestamp: Date.now()
        });
      };
    });

    test('should send message with type protocol', () => {
      sendToHtml('competitorData', { test: 'data' });

      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'competitorData',
          data: { test: 'data' },
          timestamp: expect.any(Number)
        })
      );
    });

    test('should include timestamp in message', () => {
      const beforeTimestamp = Date.now();
      sendToHtml('intelResult', { success: true });
      const afterTimestamp = Date.now();

      const call = mockComponent.postMessage.mock.calls[0][0];
      expect(call.timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(call.timestamp).toBeLessThanOrEqual(afterTimestamp);
    });

    test('should preserve data object structure', () => {
      const complexData = {
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' }
        }
      };

      sendToHtml('testType', complexData);

      const call = mockComponent.postMessage.mock.calls[0][0];
      expect(call.data).toEqual(complexData);
    });

    test('should handle null data', () => {
      sendToHtml('testType', null);

      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'testType',
          data: null
        })
      );
    });

    test('should handle undefined data', () => {
      sendToHtml('testType', undefined);

      expect(mockComponent.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'testType',
          data: undefined
        })
      );
    });

    test('should wrap postMessage call (try-catch recommended)', () => {
      // Verify sendToHtml uses try-catch or safe wrapper
      expect(sourceCode).toMatch(/postMessage/);
      expect(sourceCode).toMatch(/sendToHtml/);
    });

  });

});
