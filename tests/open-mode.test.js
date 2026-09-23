import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INJECTED, SPLIT, MODE_KEY, resolveMode, splitViewSupported } from '../lib/open-mode.js';

test('defaults_and_falls_back_to_injected', () => {
  assert.equal(MODE_KEY, 'sidebarMode');

  // Missing or unknown stored values default to the injected sidebar
  assert.equal(resolveMode(undefined, true), INJECTED);
  assert.equal(resolveMode(null, true), INJECTED);
  assert.equal(resolveMode('garbage', true), INJECTED);
  assert.equal(resolveMode({ mode: SPLIT }, true), INJECTED);
  assert.equal(resolveMode(INJECTED, true), INJECTED);

  // Split View only when chosen and the API exists
  assert.equal(resolveMode(SPLIT, false), INJECTED);
  assert.equal(resolveMode(SPLIT, true), SPLIT);

  // Detection on stand-ins for chrome.tabs
  assert.equal(splitViewSupported(undefined), false);
  assert.equal(splitViewSupported({}), false);
  assert.equal(splitViewSupported({ create() {} }), false);
  assert.equal(splitViewSupported({ createSplit: true }), false);
  assert.equal(splitViewSupported({ create() {}, createSplit() {} }), true);
});
