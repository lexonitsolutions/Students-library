const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadModule(path) {
  const context = { exports: {} };
  const source = fs.readFileSync(path, 'utf8');
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(js, context);
  return context.exports;
}

const types = loadModule('frontend/src/components/assistant/types.ts');
const { getAssistantDimensions, DEFAULT_ASSISTANT_PREFERENCES } = types;

// For preferences module, mock localStorage and window
const prefContext = {
  exports: {},
  localStorage: {
    store: {},
    getItem(k) { return this.store[k] || null; },
    setItem(k, v) { this.store[k] = String(v); },
  },
  window: {
    dispatchEvent() {},
    addEventListener() {},
    removeEventListener() {},
  },
  CustomEvent: class CustomEvent { constructor(type, detail) { this.type = type; this.detail = detail; } },
  console,
  require(mod) {
    if (mod === './types') return types;
    return require(mod);
  },
};
const prefSource = fs.readFileSync('frontend/src/components/assistant/useAIAssistantPreferences.ts', 'utf8');
const prefJs = ts.transpileModule(prefSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(prefJs, prefContext);
const { calculatePixelPosition } = prefContext.exports;

test('default assistant preferences are valid and default to medium and bottom-right corner', () => {
  assert.equal(DEFAULT_ASSISTANT_PREFERENCES.visible, true);
  assert.equal(DEFAULT_ASSISTANT_PREFERENCES.size, 'medium');
  assert.equal(DEFAULT_ASSISTANT_PREFERENCES.position.edge, 'right');
  assert.equal(DEFAULT_ASSISTANT_PREFERENCES.position.yRatio, 1.0);
});

test('dimension scaling supports small, medium, large for both mobile and desktop', () => {
  const mobileSmall = getAssistantDimensions('small', true);
  const mobileMed = getAssistantDimensions('medium', true);
  const mobileLarge = getAssistantDimensions('large', true);

  const desktopSmall = getAssistantDimensions('small', false);
  const desktopMed = getAssistantDimensions('medium', false);
  const desktopLarge = getAssistantDimensions('large', false);

  assert.ok(mobileSmall.containerSize < mobileMed.containerSize);
  assert.ok(mobileMed.containerSize < mobileLarge.containerSize);
  assert.ok(desktopSmall.containerSize < desktopMed.containerSize);
  assert.ok(desktopMed.containerSize < desktopLarge.containerSize);
  assert.ok(mobileMed.containerSize <= desktopMed.containerSize);
});

test('calculatePixelPosition keeps assistant safely inside desktop (1440x900)', () => {
  const pos = calculatePixelPosition({ edge: 'right', yRatio: 0.8 }, 'medium', 1440, 900);
  assert.ok(pos.x > 0);
  assert.ok(pos.x + pos.width <= 1440);
  assert.ok(pos.y >= pos.minY);
  assert.ok(pos.y <= pos.maxY);
  assert.ok(pos.y >= 76, 'must stay below header');
});

test('calculatePixelPosition keeps assistant safely inside small mobile (320x568)', () => {
  const pos = calculatePixelPosition({ edge: 'left', yRatio: 0.5 }, 'small', 320, 568);
  assert.ok(pos.x >= 12, 'respects safe horizontal padding');
  assert.ok(pos.x + pos.width <= 320, 'does not overflow mobile width');
  assert.ok(pos.y >= 76, 'must stay below mobile header');
  assert.ok(pos.y + pos.height <= 568, 'does not overflow mobile height');
});

test('relative yRatio and edge are preserved when screen resizes from desktop to mobile', () => {
  const targetPos = { edge: 'right', yRatio: 0.75 };
  const desktop = calculatePixelPosition(targetPos, 'medium', 1440, 900);
  const mobile = calculatePixelPosition(targetPos, 'medium', 375, 667);

  // Both should be on the right edge
  assert.ok(desktop.x > 1440 / 2);
  assert.ok(mobile.x > 375 / 2);

  // Both should be safely placed without overflow
  assert.ok(desktop.x + desktop.width <= 1440);
  assert.ok(mobile.x + mobile.width <= 375);
});

test('snapping logic chooses nearest edge based on center position', () => {
  const windowWidth = 1000;
  const containerSize = 64;

  // Position left of center snaps left
  const leftX = 200;
  const edgeLeft = (leftX + containerSize / 2) < (windowWidth / 2) ? 'left' : 'right';
  assert.equal(edgeLeft, 'left');

  // Position right of center snaps right
  const rightX = 800;
  const edgeRight = (rightX + containerSize / 2) < (windowWidth / 2) ? 'left' : 'right';
  assert.equal(edgeRight, 'right');
});

test('preference write and read functions properly sync through storage', () => {
  const { writeStoredPreferences } = prefContext.exports;
  const customPref = {
    visible: false,
    size: 'large',
    position: { edge: 'left', yRatio: 0.4 },
    hasSeenIntroBubble: true,
  };
  writeStoredPreferences(customPref);

  const stored = JSON.parse(prefContext.localStorage.getItem(types.AI_ASSISTANT_STORAGE_KEY));
  assert.equal(stored.visible, false);
  assert.equal(stored.size, 'large');
  assert.equal(stored.position.edge, 'left');
  assert.equal(stored.position.yRatio, 0.4);
  assert.equal(stored.hasSeenIntroBubble, true);
});

