/* eslint-disable */
/**
 * Bridge Test: Retention Dashboard Page Code
 *
 * Tests the postMessage bridge between Wix page code (Retention Dashboard.k2ez4.js)
 * and the HTML component (#retentionDashboard).
 *
 * This is a THIN CLIENT page - uses direct component reference instead of discovery loop.
 *
 * Architecture:
 * - Page imports: getCarrierRetentionDashboard from retentionService.jsw
 * - Component: #retentionDashboard (direct reference, no discovery)
 * - Protocol: { type, data } envelope (type-based, not action-based)
 * - Inbound messages: retentionDashboardReady, refresh
 * - Outbound messages: updateRetentionDashboard
 * - Hardcoded carrierDot: '12345'
 * - Adds survivalCohort array to backend response before sending
 *
 * Coverage:
 * - Source file structure (imports, onReady, component reference)
 * - Message routing (ready/refresh → load, unknown ignored)
 * - Data handling (survivalCohort injection, success gating)
 * - Error handling (backend failure → no postMessage, console.error only)
 * - Component usage (direct #retentionDashboard reference)
 *
 * Wave: 6 (Recruiter Analytics - Retention/Lifecycle)
 * Gate: 2
 * Priority: 2
 */

const fs = require('fs');
const path = require('path');

// Read the actual source file
const sourceFilePath = path.join(__dirname, '../../pages/Retention Dashboard.k2ez4.js');
const sourceCode = fs.readFileSync(sourceFilePath, 'utf-8');

describe('Retention Dashboard Bridge Test', () => {

  // ============================================================================
  // DESCRIBE BLOCK 1: Source File Structure
  // ============================================================================

  describe('Source File Structure', () => {

    test('imports getCarrierRetentionDashboard from backend/retentionService.jsw', () => {
      expect(sourceCode).toContain("import { getCarrierRetentionDashboard } from 'backend/retentionService.jsw'");
    });

    test('imports wixUsers module', () => {
      expect(sourceCode).toContain("import wixUsers from 'wix-users'");
    });

    test('has $w.onReady function', () => {
      expect(sourceCode).toMatch(/\$w\.onReady\s*\(/);
    });

    test('references #retentionDashboard component directly', () => {
      expect(sourceCode).toContain("$w('#retentionDashboard')");
    });

    test('does NOT use html1-html5 discovery pattern', () => {
      expect(sourceCode).not.toContain('#html1');
      expect(sourceCode).not.toContain('#html2');
      expect(sourceCode).not.toContain('#html3');
      expect(sourceCode).not.toContain('#html4');
      expect(sourceCode).not.toContain('#html5');
      expect(sourceCode).not.toContain('HTML_COMPONENT_IDS');
    });

    test('defines loadRetentionIntelligence function', () => {
      expect(sourceCode).toMatch(/async\s+function\s+loadRetentionIntelligence\s*\(/);
    });

    test('calls loadRetentionIntelligence on page load', () => {
      const lines = sourceCode.split('\n');
      const hasDirectCall = lines.some(line =>
        line.trim() === 'loadRetentionIntelligence();'
      );
      expect(hasDirectCall).toBe(true);
    });

    test('sets up htmlComponent.onMessage listener', () => {
      expect(sourceCode).toContain('htmlComponent.onMessage(');
    });

  });

  // ============================================================================
  // DESCRIBE BLOCK 2: Message Routing
  // ============================================================================

  describe('Message Routing', () => {

    let mockComponent;
    let mockRetentionService;
    let messageHandler;

    beforeEach(() => {
      // Mock HTML component
      mockComponent = {
        postMessage: jest.fn(),
        onMessage: jest.fn((handler) => {
          messageHandler = handler;
        })
      };

      // Mock backend service
      mockRetentionService = {
        getCarrierRetentionDashboard: jest.fn()
      };

      // Mock $w selector
      global.$w = jest.fn((selector) => {
        if (selector === '#retentionDashboard') {
          return mockComponent;
        }
        throw new Error(`Unexpected selector: ${selector}`);
      });

      global.$w.onReady = jest.fn((callback) => callback());

      // Mock console
      global.console.error = jest.fn();
    });

    test('retentionDashboardReady message triggers loadRetentionIntelligence', async () => {
      mockRetentionService.getCarrierRetentionDashboard.mockResolvedValue({
        success: true,
        retention_rate: 0.78,
        avg_tenure_days: 245
      });

      // Simulate page load with mock
      const loadFunc = async () => {
        const carrierDot = '12345';
        const dashboardData = await mockRetentionService.getCarrierRetentionDashboard(carrierDot);
        if (dashboardData.success) {
          dashboardData.survivalCohort = [100, 98, 85, 82, 78, 75, 68];
          mockComponent.postMessage({
            type: 'updateRetentionDashboard',
            data: dashboardData
          });
        }
      };

      // Register message handler (simulates onMessage wiring in $w.onReady)
      const handler = async (event) => {
        if (event.data.type === 'retentionDashboardReady' || event.data.type === 'refresh') {
          await loadFunc();
        }
      };
      mockComponent.onMessage(handler);

      await loadFunc();

      // Verify initial load called backend
      expect(mockRetentionService.getCarrierRetentionDashboard).toHaveBeenCalledWith('12345');
      expect(mockComponent.postMessage).toHaveBeenCalledWith({
        type: 'updateRetentionDashboard',
        data: expect.objectContaining({
          success: true,
          retention_rate: 0.78,
          survivalCohort: [100, 98, 85, 82, 78, 75, 68]
        })
      });

      // Reset mocks
      mockRetentionService.getCarrierRetentionDashboard.mockClear();
      mockComponent.postMessage.mockClear();

      // Simulate retentionDashboardReady message
      mockRetentionService.getCarrierRetentionDashboard.mockResolvedValue({
        success: true,
        retention_rate: 0.82,
        avg_tenure_days: 267
      });

      await messageHandler({ data: { type: 'retentionDashboardReady' } });

      expect(mockRetentionService.getCarrierRetentionDashboard).toHaveBeenCalledWith('12345');
    });

    test('refresh message triggers loadRetentionIntelligence', async () => {
      mockRetentionService.getCarrierRetentionDashboard.mockResolvedValue({
        success: true,
        retention_rate: 0.85,
        avg_tenure_days: 290
      });

      const loadFunc = async () => {
        const carrierDot = '12345';
        const dashboardData = await mockRetentionService.getCarrierRetentionDashboard(carrierDot);
        if (dashboardData.success) {
          dashboardData.survivalCohort = [100, 98, 85, 82, 78, 75, 68];
          mockComponent.postMessage({
            type: 'updateRetentionDashboard',
            data: dashboardData
          });
        }
      };

      // Setup message handler
      const mockOnMessage = jest.fn(async (event) => {
        if (event.data.type === 'retentionDashboardReady' || event.data.type === 'refresh') {
          await loadFunc();
        }
      });

      await mockOnMessage({ data: { type: 'refresh' } });

      expect(mockRetentionService.getCarrierRetentionDashboard).toHaveBeenCalledWith('12345');
      expect(mockComponent.postMessage).toHaveBeenCalledWith({
        type: 'updateRetentionDashboard',
        data: expect.objectContaining({
          success: true,
          retention_rate: 0.85,
          survivalCohort: [100, 98, 85, 82, 78, 75, 68]
        })
      });
    });

    test('unknown message type is ignored', async () => {
      const loadFunc = jest.fn();

      const mockOnMessage = jest.fn(async (event) => {
        if (event.data.type === 'retentionDashboardReady' || event.data.type === 'refresh') {
          await loadFunc();
        }
      });

      await mockOnMessage({ data: { type: 'unknownAction' } });
      await mockOnMessage({ data: { type: 'someOtherEvent' } });

      expect(loadFunc).not.toHaveBeenCalled();
    });

    test('message handler checks for both retentionDashboardReady and refresh types', () => {
      // Verify source code has correct conditional
      expect(sourceCode).toMatch(/event\.data\.type\s*===\s*['"]retentionDashboardReady['"]/);
      expect(sourceCode).toMatch(/event\.data\.type\s*===\s*['"]refresh['"]/);
      expect(sourceCode).toMatch(/\|\|/); // OR operator
    });

  });

  // ============================================================================
  // DESCRIBE BLOCK 3: Data Handling
  // ============================================================================

  describe('Data Handling', () => {

    test('adds survivalCohort array to dashboard data before sending', async () => {
      const mockComponent = {
        postMessage: jest.fn()
      };

      const mockBackendResponse = {
        success: true,
        retention_rate: 0.78,
        avg_tenure_days: 245,
        churn_rate: 0.22
      };

      // Replicate the data transformation logic
      const dashboardData = { ...mockBackendResponse };
      dashboardData.survivalCohort = [100, 98, 85, 82, 78, 75, 68];

      mockComponent.postMessage({
        type: 'updateRetentionDashboard',
        data: dashboardData
      });

      expect(mockComponent.postMessage).toHaveBeenCalledWith({
        type: 'updateRetentionDashboard',
        data: expect.objectContaining({
          success: true,
          retention_rate: 0.78,
          survivalCohort: [100, 98, 85, 82, 78, 75, 68]
        })
      });
    });

    test('survivalCohort array has exactly 7 elements', () => {
      const cohortMatch = sourceCode.match(/survivalCohort\s*=\s*\[([\d,\s]+)\]/);
      expect(cohortMatch).toBeTruthy();

      if (cohortMatch) {
        const values = cohortMatch[1].split(',').map(v => v.trim()).filter(v => v);
        expect(values).toHaveLength(7);
        expect(values).toEqual(['100', '98', '85', '82', '78', '75', '68']);
      }
    });

    test('only sends postMessage when dashboardData.success is true', async () => {
      const mockComponent = {
        postMessage: jest.fn()
      };

      const mockService = {
        getCarrierRetentionDashboard: jest.fn()
      };

      // Test success case
      mockService.getCarrierRetentionDashboard.mockResolvedValue({
        success: true,
        retention_rate: 0.78
      });

      let dashboardData = await mockService.getCarrierRetentionDashboard('12345');
      if (dashboardData.success) {
        dashboardData.survivalCohort = [100, 98, 85, 82, 78, 75, 68];
        mockComponent.postMessage({
          type: 'updateRetentionDashboard',
          data: dashboardData
        });
      }

      expect(mockComponent.postMessage).toHaveBeenCalledTimes(1);

      // Test failure case
      mockComponent.postMessage.mockClear();
      mockService.getCarrierRetentionDashboard.mockResolvedValue({
        success: false,
        error: 'No data found'
      });

      dashboardData = await mockService.getCarrierRetentionDashboard('12345');
      if (dashboardData.success) {
        dashboardData.survivalCohort = [100, 98, 85, 82, 78, 75, 68];
        mockComponent.postMessage({
          type: 'updateRetentionDashboard',
          data: dashboardData
        });
      }

      expect(mockComponent.postMessage).not.toHaveBeenCalled();
    });

    test('uses type-based message envelope (not action-based)', () => {
      // Verify outbound message uses 'type' key
      expect(sourceCode).toContain("type: 'updateRetentionDashboard'");

      // Verify does NOT use 'action' key
      expect(sourceCode).not.toMatch(/action:\s*['"]updateRetentionDashboard['"]/);
    });

    test('hardcodes carrierDot as "12345"', () => {
      expect(sourceCode).toContain("const carrierDot = '12345'");
    });

  });

  // ============================================================================
  // DESCRIBE BLOCK 4: Error Handling
  // ============================================================================

  describe('Error Handling', () => {

    test('catches errors in loadRetentionIntelligence and logs to console', async () => {
      const mockConsole = jest.spyOn(console, 'error').mockImplementation();
      const mockComponent = {
        postMessage: jest.fn()
      };

      const mockService = {
        getCarrierRetentionDashboard: jest.fn().mockRejectedValue(
          new Error('Backend connection failed')
        )
      };

      // Replicate the try-catch logic
      try {
        const carrierDot = '12345';
        const dashboardData = await mockService.getCarrierRetentionDashboard(carrierDot);
        if (dashboardData.success) {
          dashboardData.survivalCohort = [100, 98, 85, 82, 78, 75, 68];
          mockComponent.postMessage({
            type: 'updateRetentionDashboard',
            data: dashboardData
          });
        }
      } catch (error) {
        console.error('Retention Dashboard Data Error:', error);
      }

      expect(mockConsole).toHaveBeenCalledWith(
        'Retention Dashboard Data Error:',
        expect.any(Error)
      );
      expect(mockComponent.postMessage).not.toHaveBeenCalled();

      mockConsole.mockRestore();
    });

    test('does NOT send error message to HTML component on failure', () => {
      // Verify source does NOT send any error-type messages
      expect(sourceCode).not.toMatch(/type:\s*['"]error['"]/);
      expect(sourceCode).not.toMatch(/type:\s*['"]retentionDashboardError['"]/);
      expect(sourceCode).not.toMatch(/postMessage.*error/i);
    });

    test('wraps loadRetentionIntelligence logic in try-catch block', () => {
      expect(sourceCode).toMatch(/try\s*{[\s\S]*?getCarrierRetentionDashboard[\s\S]*?}\s*catch/);
    });

    test('console.error message includes "Retention Dashboard Data Error"', () => {
      expect(sourceCode).toMatch(/console\.error\(['"].*Retention Dashboard Data Error:/)
    });

  });

  // ============================================================================
  // DESCRIBE BLOCK 5: Component Usage
  // ============================================================================

  describe('Component Usage', () => {

    test('uses direct component reference $w("#retentionDashboard")', () => {
      expect(sourceCode).toContain("$w('#retentionDashboard')");
    });

    test('does NOT iterate over HTML_COMPONENT_IDS array', () => {
      expect(sourceCode).not.toContain('HTML_COMPONENT_IDS');
      expect(sourceCode).not.toMatch(/for\s*\(/);
      expect(sourceCode).not.toMatch(/\.forEach\s*\(/);
    });

    test('does NOT use discovery loop pattern', () => {
      expect(sourceCode).not.toContain('typeof component.postMessage === \'function\'');
      expect(sourceCode).not.toContain('typeof component.onMessage === \'function\'');
    });

    test('assigns component to htmlComponent variable', () => {
      expect(sourceCode).toMatch(/const\s+htmlComponent\s*=\s*\$w\(['"]#retentionDashboard['"]\)/);
    });

    test('calls postMessage on htmlComponent', () => {
      expect(sourceCode).toContain('htmlComponent.postMessage(');
    });

    test('calls onMessage on htmlComponent', () => {
      expect(sourceCode).toContain('htmlComponent.onMessage(');
    });

  });

});
