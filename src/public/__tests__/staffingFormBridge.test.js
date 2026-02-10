/* eslint-disable */
/**
 * Staffing Form Bridge Contract Tests (Homepage)
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

describe('Homepage staffing form bridge', () => {
  test('postMessage triggers backend call with correct data shape', () => {
    const filePath = path.resolve(__dirname, '..', '..', '..', 'src', 'pages', 'Home.c1dmp.js');
    const content = fs.readFileSync(filePath, 'utf8');

    expect(content).toMatch(/submitCarrierStaffingRequest/);
    expect(content).toMatch(/submitCarrierStaffingRequest\((msg\.data|event\.data\.data)\)/);
    expect(content).toMatch(/(msg|event\.data)\.type\s*===\s*'submitCarrierStaffingRequest'/);
  });
});
