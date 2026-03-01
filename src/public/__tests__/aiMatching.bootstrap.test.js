/* eslint-env jest */

const path = require('path');

describe('AI matching bootstrap module', () => {
  let originalBootstrap;
  let originalUpdateGuestBanner;

  beforeEach(() => {
    originalBootstrap = global.AIMatchingBootstrap;
    originalUpdateGuestBanner = global.updateGuestBanner;
    delete global.AIMatchingBootstrap;
    delete global.updateGuestBanner;

    jest.resetModules();
    require(path.resolve(
      __dirname,
      '..',
      'driver',
      'js',
      'ai-matching-bootstrap.js'
    ));
  });

  afterEach(() => {
    global.AIMatchingBootstrap = originalBootstrap;
    global.updateGuestBanner = originalUpdateGuestBanner;
  });

  test('registers expected bootstrap methods on window/global', () => {
    expect(global.AIMatchingBootstrap).toBeTruthy();
    expect(typeof global.AIMatchingBootstrap.bindSearchControls).toBe('function');
    expect(typeof global.AIMatchingBootstrap.bindPriorityControls).toBe('function');
    expect(typeof global.AIMatchingBootstrap.bindPageMessageListener).toBe('function');
    expect(typeof global.AIMatchingBootstrap.bindGuestBannerActions).toBe('function');
    expect(typeof global.AIMatchingBootstrap.bindApplicationTabs).toBe('function');
    expect(typeof global.AIMatchingBootstrap.initHandshake).toBe('function');
  });

  test('exposes updateGuestBanner helper globally', () => {
    expect(typeof global.updateGuestBanner).toBe('function');
  });
});
