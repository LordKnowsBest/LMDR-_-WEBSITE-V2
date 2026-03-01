/* eslint-env jest */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'RECRUITER_OS.zriuj.js');
const HTML_FILE = path.resolve(__dirname, '..', 'recruiter', 'os', 'RecruiterOS.html');
const BRIDGE_FILE = path.resolve(__dirname, '..', 'recruiter', 'os', 'js', 'ros-bridge.js');
const VOICE_FILE = path.resolve(__dirname, '..', 'recruiter', 'os', 'js', 'ros-voice.js');
const CHAT_FILE = path.resolve(__dirname, '..', 'recruiter', 'os', 'js', 'ros-chat.js');
const CAMPAIGNS_FILE = path.resolve(__dirname, '..', 'recruiter', 'os', 'js', 'views', 'ros-view-campaigns.js');

const pageSource = fs.readFileSync(PAGE_FILE, 'utf8');
const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');
const bridgeSource = fs.readFileSync(BRIDGE_FILE, 'utf8');
const voiceSource = fs.readFileSync(VOICE_FILE, 'utf8');
const chatSource = fs.readFileSync(CHAT_FILE, 'utf8');
const campaignsSource = fs.readFileSync(CAMPAIGNS_FILE, 'utf8');

function createWindowStub() {
  const listeners = {};
  return {
    parent: { postMessage: jest.fn() },
    addEventListener: jest.fn((type, handler) => {
      listeners[type] = listeners[type] || [];
      listeners[type].push(handler);
    }),
    dispatchMessage(data) {
      const handlers = listeners.message || [];
      handlers.forEach((handler) => handler({ data, source: this.parent }));
    }
  };
}

describe('RecruiterOS page bridge contract', () => {
  test('targets the current RecruiterOS page file', () => {
    expect(PAGE_FILE).toContain('RECRUITER_OS.zriuj.js');
  });

  test('uses type/data/timestamp envelopes when sending to the iframe', () => {
    expect(pageSource).toContain("component.postMessage({ type, data, timestamp: Date.now() })");
  });

  test('includes htmlEmbed1 in HTML component discovery fallbacks', () => {
    expect(pageSource).toContain('#htmlEmbed1');
  });

  test('responds to getVoiceConfig with a voiceReady message', () => {
    expect(pageSource).toContain("case 'getVoiceConfig'");
    expect(pageSource).toContain("sendToHtml(component, 'voiceReady', voiceConf)");
  });
});

describe('RecruiterOS HTML bootstrap', () => {
  test('initializes the voice module during bootstrap', () => {
    expect(htmlSource).toContain('if (ROS.voice && ROS.voice.init) ROS.voice.init();');
  });
});

describe('ROS bridge module', () => {
  test('exposes the canonical bridge API and announces recruiterOSReady', () => {
    const windowStub = createWindowStub();
    const context = {
      window: windowStub,
      ROS: { views: { routeMessage: jest.fn(() => false) } },
      console
    };
    context.window.ROS = context.ROS;

    vm.runInNewContext(bridgeSource, context);
    expect(context.ROS.bridge).toEqual(expect.objectContaining({
      init: expect.any(Function),
      sendToVelo: expect.any(Function),
      onReady: expect.any(Function)
    }));

    context.ROS.bridge.init();
    expect(windowStub.parent.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'recruiterOSReady',
        data: { version: '1.0.0' }
      }),
      '*'
    );
  });
});

describe('RecruiterOS module contract alignment', () => {
  test('voice module requests config through sendToVelo', () => {
    expect(voiceSource).toContain("ROS.bridge.sendToVelo('getVoiceConfig', {})");
    expect(voiceSource).not.toContain('ROS.bridge.send(');
  });

  test('voice module initializes VoiceAgentBridge when available', () => {
    expect(voiceSource).toContain('VoiceAgentBridge.init()');
  });

  test('voice module accepts type/data voiceReady envelopes', () => {
    expect(voiceSource).toContain("const type = event.data.type || event.data.action");
    expect(voiceSource).toContain("const payload = event.data.data || event.data.payload || {}");
    expect(voiceSource).toContain("if (type === 'voiceReady')");
  });

  test('chat module routes agent requests through the shared bridge', () => {
    expect(chatSource).toContain("ROS.bridge.sendToVelo('agentMessage'");
    expect(chatSource).not.toContain('window.parent.postMessage({');
  });

  test('chat module consumes type/data agent responses', () => {
    expect(chatSource).toContain("const type = event.data.type || event.data.action");
    expect(chatSource).toContain("const payload = event.data.data || event.data.payload || {}");
    expect(chatSource).toContain("if (type === 'agentResponse')");
    expect(chatSource).toContain("if (type === 'agentApprovalRequired')");
  });

  test('campaigns view uses sendToVelo for load and actions', () => {
    expect(campaignsSource).toContain("ROS.bridge.sendToVelo('getCampaigns', {})");
    expect(campaignsSource).toContain("ROS.bridge.sendToVelo('getPaidMediaState', {})");
    expect(campaignsSource).toContain("ROS.bridge.sendToVelo('startCampaign', { campaignId })");
    expect(campaignsSource).not.toContain('ROS.bridge.send(');
  });
});
