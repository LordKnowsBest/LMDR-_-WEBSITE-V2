/* eslint-disable no-undef */

// Mock basic DOM
global.document = {
    getElementById: jest.fn(),
    querySelectorAll: jest.fn()
};

// Mock element structure helper
const mockElement = (id, classes = []) => ({
    id,
    value: '',
    classList: {
        contains: jest.fn(cls => classes.includes(cls)),
        add: jest.fn(cls => classes.push(cls)),
        remove: jest.fn(cls => {
            const idx = classes.indexOf(cls);
            if (idx > -1) classes.splice(idx, 1);
        })
    },
    setAttribute: jest.fn(),
    getAttribute: jest.fn()
});

describe('Trucking Companies Form Validation', () => {
    let validateField, formatPhoneNumber, revealSection;

    beforeEach(() => {
        // Mock DOM elements mapping
        const elements = {
            'driverTypesSection': mockElement('driverTypesSection', ['form-section']),
            'equipmentSection': mockElement('equipmentSection'),
            'companySection': mockElement('companySection'),
            'notesSection': mockElement('notesSection'),
            'phone': mockElement('phone'),
            'email': mockElement('email'),
            'contactName': mockElement('contactName')
        };

        // Setup getElementById mock
        document.getElementById.mockImplementation(id => elements[id] || mockElement(id));

        // Define functions under test (logic copied from HTML source)
        validateField = (input) => {
            const validators = {
                contactName: (value) => ({ valid: value.trim().length >= 2, message: 'Please enter your name' }),
                email: (value) => ({ valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), message: 'Please enter a valid email' }),
                phone: (value) => ({ valid: value.replace(/\D/g, '').length >= 10, message: 'Please enter a valid phone number' }),
                driversNeeded: (value) => ({ valid: value && value !== '', message: 'Please select drivers needed' })
            };
            const fieldName = input.id || input.name;
            const validator = validators[fieldName];
            if (!validator) return { valid: true };
            return validator(input.value || '');
        };

        formatPhoneNumber = (value) => {
            const digits = value.replace(/\D/g, '');
            if (digits.length === 0) return '';
            if (digits.length <= 3) return `(${digits}`;
            if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
            return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
        };

        revealSection = (sectionId) => {
            const section = document.getElementById(sectionId);
            if (section && !section.classList.contains('revealed')) {
                section.classList.add('revealed');
                section.setAttribute('aria-hidden', 'false');
            }
        };
    });

    test('validates email correctly', () => {
        expect(validateField({ id: 'email', value: 'test@example.com' }).valid).toBe(true);
        expect(validateField({ id: 'email', value: 'invalid-email' }).valid).toBe(false);
    });

    test('validates phone correctly', () => {
        expect(validateField({ id: 'phone', value: '(555) 123-4567' }).valid).toBe(true);
        expect(validateField({ id: 'phone', value: '555-123' }).valid).toBe(false);
    });

    test('validates contact name correctly', () => {
        expect(validateField({ id: 'contactName', value: 'John Doe' }).valid).toBe(true);
        expect(validateField({ id: 'contactName', value: 'J' }).valid).toBe(false);
    });

    test('formats phone number correctly', () => {
        expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
        expect(formatPhoneNumber('555')).toBe('(555');
        expect(formatPhoneNumber('555123')).toBe('(555) 123');
    });

    test('reveals section correctly', () => {
        const section = document.getElementById('driverTypesSection');
        // Initial state from mockElement above has 'form-section' only
        expect(section.classList.contains('revealed')).toBe(false);

        revealSection('driverTypesSection');

        expect(section.classList.add).toHaveBeenCalledWith('revealed');
        expect(section.setAttribute).toHaveBeenCalledWith('aria-hidden', 'false');
    });
});
