import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_WIDTH,
  MAX_WIDTH,
  MIN_WIDTH,
  RAIL_WIDTH,
  VIEWPORT_FRACTION,
  clampWidth,
  layoutFor,
  widthFrom,
  widthFromDrag,
} from '../lib/layout.js';

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

test('clamps_width', () => {
  assert.ok(MIN_WIDTH < DEFAULT_WIDTH && DEFAULT_WIDTH < MAX_WIDTH);
  assert.equal(clampWidth(100), MIN_WIDTH);
  assert.equal(clampWidth(5000), MAX_WIDTH);
  assert.equal(clampWidth(500.4), 500);
  assert.equal(clampWidth(Number.NaN), DEFAULT_WIDTH);

  // A narrow window caps the width to a fraction of the viewport, never below MIN_WIDTH.
  assert.equal(clampWidth(800, 1000), Math.floor(1000 * VIEWPORT_FRACTION));
  assert.equal(clampWidth(800, 300), MIN_WIDTH);
  assert.equal(clampWidth(500, 2000), 500);

  assert.equal(widthFrom(50), MIN_WIDTH);
  assert.equal(widthFrom(10000), MAX_WIDTH);

  const wide = layoutFor({ width: 5000 });
  assert.equal(wide.frame.width, `${MAX_WIDTH}px`);
  assert.equal(wide.html['margin-right'], `${MAX_WIDTH}px`);
  assert.equal(layoutFor({ width: 800, viewport: 1000 }).frame.width, `${Math.floor(1000 * VIEWPORT_FRACTION)}px`);

  // Dragging left widens, dragging right narrows, both clamped.
  assert.equal(widthFromDrag(420, 1000, 900), 520);
  assert.equal(widthFromDrag(420, 1000, 1100), 320);
  assert.equal(widthFromDrag(420, 1000, 1500), MIN_WIDTH);
  assert.equal(widthFromDrag(420, 1000, -2000), MAX_WIDTH);
  assert.equal(widthFromDrag(420, 1000, 400, 1000), Math.floor(1000 * VIEWPORT_FRACTION));
});

test('collapsed_uses_rail_width', () => {
  const expanded = layoutFor({ width: 600, collapsed: false });
  assert.equal(expanded.width, 600);
  assert.equal(expanded.handle.display, 'block');
  assert.equal(expanded.handle.position, 'fixed');

  const collapsed = layoutFor({ width: 600, collapsed: true });
  assert.equal(collapsed.frame.width, `${RAIL_WIDTH}px`);
  assert.equal(collapsed.html['margin-right'], '0px');
  // The handle hides while collapsed, and the expanded width is kept for re-expanding.
  assert.equal(collapsed.handle.display, 'none');
  assert.equal(collapsed.width, 600);
});
