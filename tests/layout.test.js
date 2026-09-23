import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_WIDTH, RAIL_WIDTH, layoutFor, widthFrom } from '../lib/layout.js';

test('computes_push_margin', () => {
  const expanded = layoutFor({ width: 420, collapsed: false });
  assert.equal(expanded.html['margin-right'], '420px');
  assert.equal(expanded.frame.width, '420px');
  assert.equal(expanded.frame.position, 'fixed');
  assert.equal(expanded.frame.right, '0');
  assert.equal(expanded.frame.height, '100vh');
  assert.equal(expanded.frame['z-index'], '2147483647');

  const wide = layoutFor({ width: 600, collapsed: false });
  assert.equal(wide.html['margin-right'], '600px');
  assert.equal(wide.frame.width, '600px');

  const collapsed = layoutFor({ width: 600, collapsed: true });
  assert.equal(collapsed.html['margin-right'], '0px');
  assert.equal(collapsed.frame.width, `${RAIL_WIDTH}px`);

  assert.equal(layoutFor().frame.width, `${DEFAULT_WIDTH}px`);
});

test('falls_back_to_default_width', () => {
  assert.equal(widthFrom(undefined), DEFAULT_WIDTH);
  assert.equal(widthFrom('wide'), DEFAULT_WIDTH);
  assert.equal(widthFrom(-5), DEFAULT_WIDTH);
  assert.equal(widthFrom(Number.NaN), DEFAULT_WIDTH);
  assert.equal(widthFrom(512), 512);
  assert.equal(widthFrom(512.6), 513);
});
