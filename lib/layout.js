// Sidebar geometry. The single home for layout constants.

export const DEFAULT_WIDTH = 420;
export const MIN_WIDTH = 280;
export const MAX_WIDTH = 900;
// The sidebar never takes more than this share of the window, unless that is below MIN_WIDTH.
export const VIEWPORT_FRACTION = 0.8;
export const RAIL_WIDTH = 24;
export const HANDLE_WIDTH = 8;
export const WIDTH_KEY = 'sidebarWidth';
export const FRAME_ID = 'hn-sidebar-frame';
export const HANDLE_ID = 'hn-sidebar-handle';
export const OVERLAY_ID = 'hn-sidebar-drag-overlay';

// Any number -> whole pixel width within [MIN_WIDTH, MAX_WIDTH], further capped by the viewport when given.
export function clampWidth(width, viewport) {
  if (typeof width !== 'number' || !Number.isFinite(width)) return DEFAULT_WIDTH;
  let max = MAX_WIDTH;
  if (typeof viewport === 'number' && Number.isFinite(viewport) && viewport > 0) {
    max = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.floor(viewport * VIEWPORT_FRACTION)));
  }
  return Math.min(max, Math.max(MIN_WIDTH, Math.round(width)));
}

// Stored width (chrome.storage.local) -> usable pixel width.
export function widthFrom(stored) {
  if (typeof stored !== 'number' || !Number.isFinite(stored) || stored <= 0) return DEFAULT_WIDTH;
  return clampWidth(stored);
}

// The sidebar is pinned right, so moving the pointer left widens it.
export function widthFromDrag(startWidth, startX, currentX, viewport) {
  return clampWidth(startWidth + (startX - currentX), viewport);
}

// CSS property maps for the iframe, the drag handle and the <html> element. Applied with !important.
// `width` is the expanded width, kept while collapsed so expanding restores it.
export function layoutFor({ width = DEFAULT_WIDTH, collapsed = false, viewport } = {}) {
  const expandedWidth = clampWidth(width, viewport);
  const frameWidth = collapsed ? RAIL_WIDTH : expandedWidth;
  const margin = collapsed ? 0 : expandedWidth;
  return {
    width: expandedWidth,
    html: { 'margin-right': `${margin}px` },
    handle: {
      position: 'fixed',
      top: '0',
      right: `${expandedWidth - HANDLE_WIDTH / 2}px`,
      left: 'auto',
      width: `${HANDLE_WIDTH}px`,
      height: '100vh',
      margin: '0',
      padding: '0',
      border: '0',
      background: 'transparent',
      cursor: 'col-resize',
      'touch-action': 'none',
      display: collapsed ? 'none' : 'block',
      'z-index': '2147483647',
    },
    frame: {
      position: 'fixed',
      top: '0',
      right: '0',
      left: 'auto',
      bottom: 'auto',
      width: `${frameWidth}px`,
      height: '100vh',
      'max-width': 'none',
      'max-height': 'none',
      margin: '0',
      padding: '0',
      border: '0',
      display: 'block',
      visibility: 'visible',
      opacity: '1',
      transform: 'none',
      background: '#1b1b1d',
      'color-scheme': 'dark',
      'z-index': '2147483647',
    },
  };
}

// Transparent full-viewport cover shown while dragging, so the iframe can't swallow pointer events.
export const OVERLAY_STYLES = {
  position: 'fixed',
  inset: '0',
  width: '100vw',
  height: '100vh',
  margin: '0',
  padding: '0',
  background: 'transparent',
  cursor: 'col-resize',
  'user-select': 'none',
  display: 'block',
  'z-index': '2147483647',
};
