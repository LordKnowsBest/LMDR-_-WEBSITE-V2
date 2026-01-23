/**
 * @jest-environment jsdom
 */
/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// Read the HTML file content
const htmlPath = path.resolve(__dirname, '../../public/Last Mile Delivery Driver Staffing.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

describe('Last Mile Staffing HTML Component', () => {
    let windowSpy;

    beforeEach(() => {
        // Reset DOM
        document.documentElement.innerHTML = htmlContent;

        // Mock scrollIntoView
        window.HTMLElement.prototype.scrollIntoView = jest.fn();

        // Mock window.parent.postMessage
        windowSpy = jest.spyOn(window.parent, 'postMessage').mockImplementation(() => { });

        // Execute the script
        // Note: in JSDOM scripts don't auto-run when setting innerHTML. 
        // We need to extract and eval the script or manually attach event listeners.
        // For this test, we'll manually instantiate the logic since it's inside an IIFE.
        // A better approach for integration is to extract the script to a separate file, but here we'll extract it dynamically.

        const scripts = document.querySelectorAll('script');
        // The last script block contains the form logic
        const formScript = scripts[scripts.length - 1].textContent;
        // The script checks for 'document.getElementById', so it needs the DOM ready.
        eval(formScript);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should initialize and notify parent', () => {
        expect(windowSpy).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'staffingFormReady' }),
            '*'
        );
    });

    it('should validate empty form submission', () => {
        const form = document.getElementById('carrierStaffingForm');
        const submitEvent = new Event('submit');
        form.dispatchEvent(submitEvent);

        const errorMsg = document.getElementById('formErrorMessage');
        expect(document.getElementById('formError').classList.contains('hidden')).toBe(false);
        expect(errorMsg.textContent).toContain('Please enter your company name');

        // Should not send message to parent
        // Note: The first call was initialization. Check if subsequent calls were made.
        expect(windowSpy).toHaveBeenCalledTimes(1); // Only init call
    });

    it('should submit valid form data to parent', async () => {
        // Fill form
        document.getElementById('companyName').value = 'Acme Inc';
        document.getElementById('contactName').value = 'John Doe';
        document.getElementById('email').value = 'john@acme.com';
        document.getElementById('phone').value = '555-0100';

        // Select radio manually
        const emergencyRadio = document.querySelector('input[value="emergency"]');
        emergencyRadio.checked = true;

        // Select select option
        document.getElementById('driversNeeded').value = '1-5';

        const form = document.getElementById('carrierStaffingForm');
        form.dispatchEvent(new Event('submit'));

        // Check if loading state set
        expect(document.getElementById('submitBtn').disabled).toBe(true);
        expect(document.getElementById('submitBtnText').textContent).toBe('Submitting...');

        // Verify message sent to parent
        expect(windowSpy).toHaveBeenCalledTimes(2); // Init + Submit
        const submitCall = windowSpy.mock.calls[1];
        expect(submitCall[0]).toEqual({
            type: 'submitCarrierStaffingRequest',
            action: 'submitCarrierStaffingRequest',
            data: expect.objectContaining({
                companyName: 'Acme Inc',
                contactName: 'John Doe',
                email: 'john@acme.com',
                staffingType: 'emergency',
                driversNeeded: '1-5'
            })
        });
    });

    it('should handle success response from parent', () => {
        // Trigger submission to define the promise/callback
        // We need to bypass validation helpers or just invoke the function if we exported it, 
        // but since we eval'd the script, we rely on DOM events.

        // Setup pending callback by submitting first (ignoring validation for brevity in thought, but code needs it)
        document.getElementById('companyName').value = 'A';
        document.getElementById('contactName').value = 'A';
        document.getElementById('email').value = 'a@a.com';
        document.getElementById('phone').value = '1';
        document.querySelector('input[value="emergency"]').checked = true;
        document.getElementById('driversNeeded').value = '1-5';

        const form = document.getElementById('carrierStaffingForm');
        form.dispatchEvent(new Event('submit'));

        // Simulate success message from parent
        const messageEvent = new MessageEvent('message', {
            data: {
                type: 'staffingRequestResult',
                data: { success: true }
            }
        });
        window.dispatchEvent(messageEvent);

        // Verify UI updates
        // Note: The script uses async/await which microtasks might delay.
        // We can wait a tick.
        return new Promise(resolve => setTimeout(() => {
            expect(document.getElementById('formSuccess').classList.contains('hidden')).toBe(false);
            expect(document.getElementById('formError').classList.contains('hidden')).toBe(true);
            expect(document.getElementById('submitBtn').disabled).toBe(false);
            expect(document.getElementById('companyName').value).toBe(''); // Reset
            resolve();
        }, 0));
    });

    it('should handle error response from parent', () => {
        document.getElementById('companyName').value = 'A';
        document.getElementById('contactName').value = 'A';
        document.getElementById('email').value = 'a@a.com';
        document.getElementById('phone').value = '1';
        document.querySelector('input[value="emergency"]').checked = true;
        document.getElementById('driversNeeded').value = '1-5';

        const form = document.getElementById('carrierStaffingForm');
        form.dispatchEvent(new Event('submit'));

        const messageEvent = new MessageEvent('message', {
            data: {
                type: 'staffingRequestResult',
                data: { success: false, error: 'Backend failed' }
            }
        });
        window.dispatchEvent(messageEvent);

        return new Promise(resolve => setTimeout(() => {
            expect(document.getElementById('formSuccess').classList.contains('hidden')).toBe(true);
            expect(document.getElementById('formError').classList.contains('hidden')).toBe(false);
            expect(document.getElementById('formErrorMessage').textContent).toBe('Backend failed');
            expect(document.getElementById('submitBtn').disabled).toBe(false);
            resolve();
        }, 0));
    });
});
