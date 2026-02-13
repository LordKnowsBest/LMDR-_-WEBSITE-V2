/* eslint-disable */
/**
 * RECRUITER OS HTML DOM Tests
 *
 * Tests the RecruiterOS.html shell structure, CDN URLs,
 * viewport/meta tags, inline Tailwind config, module loading order,
 * and mobile CSS inclusion.
 *
 * Tests src/public/recruiter/os/RecruiterOS.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILES
// =============================================================================

const HTML_FILE = path.resolve(
  __dirname, '..', 'recruiter', 'os', 'RecruiterOS.html'
);
const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

const CSS_FILE = path.resolve(
  __dirname, '..', 'recruiter', 'os', 'css', 'recruiter-os.css'
);
const cssSource = fs.readFileSync(CSS_FILE, 'utf8');

const MOBILE_CSS_FILE = path.resolve(
  __dirname, '..', 'recruiter', 'os', 'css', 'recruiter-os-mobile.css'
);
const mobileCssSource = fs.readFileSync(MOBILE_CSS_FILE, 'utf8');

const CONFIG_FILE = path.resolve(
  __dirname, '..', 'recruiter', 'os', 'js', 'ros-config.js'
);
const configSource = fs.readFileSync(CONFIG_FILE, 'utf8');

// CDN base URL
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/LordKnowsBest/LMDR-_-WEBSITE-V2@main/src/public/recruiter/os';

// =============================================================================
// TESTS
// =============================================================================

describe('RecruiterOS.html Shell Structure', () => {

  // ─────────────────────────────────────────────────────────────────────────
  // DOCTYPE & Meta
  // ─────────────────────────────────────────────────────────────────────────
  describe('DOCTYPE and meta tags', () => {

    test('has DOCTYPE html', () => {
      expect(htmlSource).toMatch(/<!DOCTYPE html>/i);
    });

    test('has lang="en"', () => {
      expect(htmlSource).toMatch(/lang="en"/);
    });

    test('has charset utf-8', () => {
      expect(htmlSource).toMatch(/charset="utf-8"/i);
    });

    test('has viewport meta with viewport-fit=cover', () => {
      expect(htmlSource).toContain('viewport-fit=cover');
    });

    test('has maximum-scale=1.0 (prevents iOS auto-zoom)', () => {
      expect(htmlSource).toContain('maximum-scale=1.0');
    });

    test('has user-scalable=no', () => {
      expect(htmlSource).toContain('user-scalable=no');
    });

    test('title contains VelocityMatch', () => {
      expect(htmlSource).toMatch(/<title>.*VelocityMatch.*<\/title>/);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Branding
  // ─────────────────────────────────────────────────────────────────────────
  describe('VelocityMatch branding', () => {

    test('title uses VelocityMatch (not LMDR)', () => {
      const titleMatch = htmlSource.match(/<title>(.*?)<\/title>/);
      expect(titleMatch).toBeTruthy();
      expect(titleMatch[1]).toContain('VelocityMatch');
      // LMDR in CDN URL is acceptable (it's the repo name)
      // But the title itself should NOT say LMDR
      expect(titleMatch[1]).not.toContain('LMDR');
    });

    test('config.js uses VelocityMatch brand name', () => {
      expect(configSource).toContain("name: 'VelocityMatch'");
    });

    test('config.js uses VM logo', () => {
      expect(configSource).toContain("logo: 'VM'");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // External Resources
  // ─────────────────────────────────────────────────────────────────────────
  describe('External resources', () => {

    test('loads Google Fonts Inter', () => {
      expect(htmlSource).toContain('fonts.googleapis.com/css2?family=Inter');
    });

    test('loads Material Symbols Outlined', () => {
      expect(htmlSource).toContain('Material+Symbols+Outlined');
    });

    test('loads Tailwind CDN', () => {
      expect(htmlSource).toContain('cdn.tailwindcss.com');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Inline Tailwind Config (required for Wix iframes)
  // ─────────────────────────────────────────────────────────────────────────
  describe('Inline Tailwind config', () => {

    test('has inline tailwind.config object', () => {
      expect(htmlSource).toContain('tailwind.config');
    });

    test('defines lmdr-blue color', () => {
      expect(htmlSource).toContain("'lmdr-blue'");
    });

    test('defines beige color', () => {
      expect(htmlSource).toContain("'beige'");
    });

    test('defines tan color', () => {
      expect(htmlSource).toContain("'tan'");
    });

    test('does NOT load external lmdr-config.js', () => {
      expect(htmlSource).not.toContain('lmdr-config.js');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CDN CSS Links
  // ─────────────────────────────────────────────────────────────────────────
  describe('CSS CDN links', () => {

    test('loads recruiter-os.css from CDN', () => {
      expect(htmlSource).toContain(`${CDN_BASE}/css/recruiter-os.css`);
    });

    test('loads recruiter-os-mobile.css from CDN', () => {
      expect(htmlSource).toContain(`${CDN_BASE}/css/recruiter-os-mobile.css`);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // CDN JS Module Loading Order
  // ─────────────────────────────────────────────────────────────────────────
  describe('JS module loading order', () => {

    const CORE_MODULES = [
      'js/ros-config.js',
      'js/ros-bridge.js',
      'js/ros-views.js',
      'js/ros-shell.js',
      'js/ros-spotlight.js',
      'js/ros-chat.js',
      'js/ros-settings.js'
    ];

    test.each(CORE_MODULES)('loads core module %s', (module) => {
      expect(htmlSource).toContain(`${CDN_BASE}/${module}`);
    });

    test('config loads before bridge (dependency order)', () => {
      const configIdx = htmlSource.indexOf('ros-config.js');
      const bridgeIdx = htmlSource.indexOf('ros-bridge.js');
      expect(configIdx).toBeLessThan(bridgeIdx);
    });

    test('bridge loads before views', () => {
      const bridgeIdx = htmlSource.indexOf('ros-bridge.js');
      const viewsIdx = htmlSource.indexOf('ros-views.js');
      expect(bridgeIdx).toBeLessThan(viewsIdx);
    });

    test('views loads before shell', () => {
      const viewsIdx = htmlSource.indexOf('ros-views.js');
      const shellIdx = htmlSource.indexOf('ros-shell.js');
      expect(viewsIdx).toBeLessThan(shellIdx);
    });

    test('shell loads before spotlight', () => {
      const shellIdx = htmlSource.indexOf('ros-shell.js');
      const spotIdx = htmlSource.indexOf('ros-spotlight.js');
      expect(shellIdx).toBeLessThan(spotIdx);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // View Module Loading
  // ─────────────────────────────────────────────────────────────────────────
  describe('View modules', () => {

    const VIEW_MODULES = [
      'ros-view-home.js',
      'ros-view-search.js',
      'ros-view-pipeline.js',
      'ros-view-messages.js',
      'ros-view-carriers.js',
      'ros-view-funnel.js',
      'ros-view-onboard.js',
      'ros-view-predict.js',
      'ros-view-intel.js',
      'ros-view-leaderboard.js',
      'ros-view-telemetry.js',
      'ros-view-retention.js',
      'ros-view-attribution.js',
      'ros-view-lifecycle.js'
    ];

    test.each(VIEW_MODULES)('loads view module %s', (module) => {
      expect(htmlSource).toContain(`${CDN_BASE}/js/views/${module}`);
    });

    test('loads all 14 view modules', () => {
      let count = 0;
      VIEW_MODULES.forEach(m => {
        if (htmlSource.includes(m)) count++;
      });
      expect(count).toBe(14);
    });

    test('view modules load after core modules', () => {
      const lastCoreIdx = htmlSource.indexOf('ros-settings.js');
      const firstViewIdx = htmlSource.indexOf('ros-view-home.js');
      expect(lastCoreIdx).toBeLessThan(firstViewIdx);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Bootstrap Script
  // ─────────────────────────────────────────────────────────────────────────
  describe('Bootstrap script', () => {

    test('has DOMContentLoaded listener', () => {
      expect(htmlSource).toContain('DOMContentLoaded');
    });

    test('calls ROS.shell.init()', () => {
      expect(htmlSource).toContain('ROS.shell.init()');
    });

    test('shows home view on load', () => {
      expect(htmlSource).toContain("ROS.views.showView('home')");
    });

    test('initializes bridge', () => {
      expect(htmlSource).toContain('ROS.bridge.init');
    });

    test('bootstrap runs after all modules loaded', () => {
      const lastViewIdx = htmlSource.indexOf('ros-view-lifecycle.js');
      const bootstrapIdx = htmlSource.indexOf('DOMContentLoaded');
      expect(lastViewIdx).toBeLessThan(bootstrapIdx);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Root Container
  // ─────────────────────────────────────────────────────────────────────────
  describe('Root container', () => {

    test('has #ros-root container', () => {
      expect(htmlSource).toContain('id="ros-root"');
    });

    test('root has h-screen for full viewport', () => {
      expect(htmlSource).toMatch(/id="ros-root"[^>]*h-screen/);
    });

    test('body has bg-beige', () => {
      expect(htmlSource).toMatch(/<body[^>]*bg-beige/);
    });

    test('body has font-d (Inter)', () => {
      expect(htmlSource).toMatch(/<body[^>]*font-d/);
    });
  });
});

// =============================================================================
// CSS Design System Tests
// =============================================================================

describe('Recruiter OS CSS Design System', () => {

  describe('Neumorphic elevation classes', () => {

    test('defines .neu class', () => {
      expect(cssSource).toMatch(/\.neu\s*\{/);
    });

    test('defines .neu-s class', () => {
      expect(cssSource).toMatch(/\.neu-s\s*\{/);
    });

    test('defines .neu-x class', () => {
      expect(cssSource).toMatch(/\.neu-x\s*\{/);
    });

    test('defines .neu-in class (inset)', () => {
      expect(cssSource).toMatch(/\.neu-in\s*\{/);
    });

    test('defines .neu-ins class (inset small)', () => {
      expect(cssSource).toMatch(/\.neu-ins\s*\{/);
    });
  });

  describe('Animation keyframes', () => {

    const ANIMATIONS = ['fadeUp', 'fadeIn', 'pulse', 'float'];

    test.each(ANIMATIONS)('defines @keyframes %s', (name) => {
      expect(cssSource).toContain(`@keyframes ${name}`);
    });
  });

  describe('Layout components', () => {

    test('defines #ros-topbar styles', () => {
      expect(cssSource).toContain('#ros-topbar');
    });

    test('defines #ros-rail styles', () => {
      expect(cssSource).toContain('#ros-rail');
    });

    test('defines #ros-stage styles (in mobile CSS)', () => {
      // #ros-stage is styled inline in ros-shell.js; mobile overrides are in mobile CSS
      expect(mobileCssSource).toContain('#ros-stage');
    });

    test('defines .dock-pill styles', () => {
      expect(cssSource).toContain('.dock-pill');
    });

    test('defines .cmd-bar styles', () => {
      expect(cssSource).toContain('.cmd-bar');
    });

    test('defines .chat-thread styles', () => {
      expect(cssSource).toContain('.chat-thread');
    });

    test('defines .spot-ov (spotlight overlay) styles', () => {
      expect(cssSource).toContain('.spot-ov');
    });

    test('defines .settings-orb styles', () => {
      expect(cssSource).toContain('.settings-orb');
    });

    test('defines .coming-soon-card styles', () => {
      expect(cssSource).toContain('.coming-soon-card');
    });
  });
});

// =============================================================================
// Mobile CSS Tests
// =============================================================================

describe('Recruiter OS Mobile Responsiveness', () => {

  describe('Breakpoints', () => {

    test('has tablet breakpoint (max-width: 1024px)', () => {
      expect(mobileCssSource).toContain('max-width: 1024px');
    });

    test('has mobile breakpoint (max-width: 768px)', () => {
      expect(mobileCssSource).toContain('max-width: 768px');
    });

    test('has small phone breakpoint (max-width: 375px)', () => {
      expect(mobileCssSource).toContain('max-width: 375px');
    });
  });

  describe('Mobile layout transformations', () => {

    test('rail transforms off-screen on mobile', () => {
      expect(mobileCssSource).toContain('translateX(-100%)');
    });

    test('rail slides in when open', () => {
      expect(mobileCssSource).toContain('#ros-rail.open');
      expect(mobileCssSource).toContain('translateX(0)');
    });

    test('dock becomes full-width bottom bar', () => {
      expect(mobileCssSource).toContain('.dock-pill');
      // Should have left: 0 and right: 0 for full width
      expect(mobileCssSource).toMatch(/\.dock-pill[\s\S]*?left:\s*0/);
    });

    test('chat becomes full-screen overlay', () => {
      expect(mobileCssSource).toContain('.chat-thread');
      expect(mobileCssSource).toContain('width: 100% !important');
    });

    test('has mobile overlay for rail backdrop', () => {
      expect(mobileCssSource).toContain('.rail-overlay');
    });

    test('shows hamburger button on mobile', () => {
      expect(mobileCssSource).toContain('.hamburger-btn');
    });

    test('hides topbar nav on mobile', () => {
      expect(mobileCssSource).toContain('#ros-topbar nav { display: none; }');
    });
  });

  describe('Touch targets (44px minimum per MOBILE_OPTIMIZATION_GUIDE)', () => {

    test('has pointer:coarse media query', () => {
      expect(mobileCssSource).toContain('pointer: coarse');
    });

    test('tool orbs have min 44px touch target', () => {
      expect(mobileCssSource).toMatch(/\.tool-orb[\s\S]*?min-width:\s*44px/);
      expect(mobileCssSource).toMatch(/\.tool-orb[\s\S]*?min-height:\s*44px/);
    });

    test('dock items have min 44px touch target', () => {
      expect(mobileCssSource).toMatch(/\.dk-i[\s\S]*?min-width:\s*44px/);
      expect(mobileCssSource).toMatch(/\.dk-i[\s\S]*?min-height:\s*44px/);
    });

    test('settings orb has min 44px touch target', () => {
      expect(mobileCssSource).toMatch(/\.settings-orb[\s\S]*?min-width:\s*44px/);
    });
  });

  describe('Safe area insets (iPhone notch)', () => {

    test('uses env(safe-area-inset-bottom)', () => {
      expect(mobileCssSource).toContain('env(safe-area-inset-bottom');
    });

    test('dock has safe area bottom padding', () => {
      expect(mobileCssSource).toMatch(/\.dock-pill[\s\S]*?safe-area-inset-bottom/);
    });

    test('has @supports check for safe area', () => {
      expect(mobileCssSource).toContain('@supports (padding: env(safe-area-inset-bottom))');
    });

    test('stage has safe area bottom padding', () => {
      expect(mobileCssSource).toMatch(/#ros-stage[\s\S]*?safe-area-inset-bottom/);
    });
  });

  describe('Spotlight mobile adaptation', () => {

    test('spotlight box uses near-full width on mobile', () => {
      expect(mobileCssSource).toContain('.spot-box');
      expect(mobileCssSource).toContain('calc(100vw - 32px)');
    });
  });

  describe('Settings orb mobile positioning', () => {

    test('settings orb repositioned for mobile dock', () => {
      expect(mobileCssSource).toMatch(/\.settings-orb[\s\S]*?bottom:\s*calc/);
    });

    test('settings panel respects mobile width', () => {
      expect(mobileCssSource).toMatch(/\.settings-panel[\s\S]*?width:\s*calc\(100vw/);
    });
  });
});

// =============================================================================
// View Module File Existence Tests
// =============================================================================

describe('View module files exist', () => {

  const VIEW_DIR = path.resolve(__dirname, '..', 'recruiter', 'os', 'js', 'views');
  const CORE_DIR = path.resolve(__dirname, '..', 'recruiter', 'os', 'js');

  const CORE_FILES = [
    'ros-config.js', 'ros-bridge.js', 'ros-views.js',
    'ros-shell.js', 'ros-spotlight.js', 'ros-chat.js', 'ros-settings.js'
  ];

  const VIEW_FILES = [
    'ros-view-home.js', 'ros-view-search.js', 'ros-view-pipeline.js',
    'ros-view-messages.js', 'ros-view-carriers.js', 'ros-view-funnel.js',
    'ros-view-onboard.js', 'ros-view-predict.js', 'ros-view-intel.js',
    'ros-view-leaderboard.js', 'ros-view-telemetry.js', 'ros-view-retention.js',
    'ros-view-attribution.js', 'ros-view-lifecycle.js'
  ];

  test.each(CORE_FILES)('core module %s exists', (file) => {
    const filePath = path.join(CORE_DIR, file);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test.each(VIEW_FILES)('view module %s exists', (file) => {
    const filePath = path.join(VIEW_DIR, file);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('RecruiterOS.html exists', () => {
    expect(fs.existsSync(HTML_FILE)).toBe(true);
  });

  test('recruiter-os.css exists', () => {
    expect(fs.existsSync(CSS_FILE)).toBe(true);
  });

  test('recruiter-os-mobile.css exists', () => {
    expect(fs.existsSync(MOBILE_CSS_FILE)).toBe(true);
  });

  test('total: 24 OS files (1 HTML + 2 CSS + 7 core JS + 14 view JS)', () => {
    let count = 1; // HTML
    count += fs.existsSync(CSS_FILE) ? 1 : 0;
    count += fs.existsSync(MOBILE_CSS_FILE) ? 1 : 0;
    CORE_FILES.forEach(f => { if (fs.existsSync(path.join(CORE_DIR, f))) count++; });
    VIEW_FILES.forEach(f => { if (fs.existsSync(path.join(VIEW_DIR, f))) count++; });
    expect(count).toBe(24);
  });
});

// =============================================================================
// Config Consistency Tests
// =============================================================================

describe('Config & View registration consistency', () => {

  const VIEW_DIR = path.resolve(__dirname, '..', 'recruiter', 'os', 'js', 'views');

  test('every view file with a VIEW_ID registers with ROS.views.registerView', () => {
    const viewFiles = fs.readdirSync(VIEW_DIR).filter(f => f.startsWith('ros-view-') && f.endsWith('.js'));
    viewFiles.forEach(file => {
      const content = fs.readFileSync(path.join(VIEW_DIR, file), 'utf8');
      // Attribution and lifecycle are Coming Soon placeholders — they still call registerView
      expect(content).toContain('ROS.views.registerView');
    });
  });

  test('config has 27 tools in TOOL_REGISTRY', () => {
    // Extract just the TOOL_REGISTRY array to avoid matching drawer/dock configs
    const registryMatch = configSource.match(/ROS\.TOOL_REGISTRY\s*=\s*\[([\s\S]*?)\];/);
    expect(registryMatch).toBeTruthy();
    const registryBlock = registryMatch[1];
    const toolMatches = registryBlock.match(/\{\s*id:\s*'/g);
    expect(toolMatches).toBeTruthy();
    expect(toolMatches.length).toBe(27);
  });

  test('config has 5 drawers', () => {
    expect(configSource).toContain("id: 'discover'");
    expect(configSource).toContain("id: 'pipe'");
    expect(configSource).toContain("id: 'onb'");
    expect(configSource).toContain("id: 'anl'");
    expect(configSource).toContain("id: 'rank'");
  });

  test('config has 5 dock items', () => {
    expect(configSource).toContain("id: 'home'");
    expect(configSource).toContain("id: 'pipeline'");
    expect(configSource).toContain("id: 'messages'");
    expect(configSource).toContain("id: 'search'");
    expect(configSource).toContain("id: 'funnel'");
  });

  test('config has INTENT_MAP with 12 entries', () => {
    const intentMatches = configSource.match(/\{\s*keys:/g);
    expect(intentMatches).toBeTruthy();
    expect(intentMatches.length).toBe(12);
  });
});
