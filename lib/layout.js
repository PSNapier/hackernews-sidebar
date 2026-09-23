// Sidebar geometry. The single home for layout constants.

export const DEFAULT_WIDTH = 420;
export const RAIL_WIDTH = 24;
export const WIDTH_KEY = 'sidebarWidth';
export const FRAME_ID = 'hn-sidebar-frame';

// Stored width (chrome.storage.local) -> usable pixel width. Clamping arrives with [005].
export function widthFrom(stored) {
  if (typeof stored !== 'number' || !Number.isFinite(stored) || stored <= 0) return DEFAULT_WIDTH;
  return Math.round(stored);
}

// CSS property maps for the iframe and the <html> element. Applied with !important.
export function layoutFor({ width = DEFAULT_WIDTH, collapsed = false } = {}) {
  const frameWidth = collapsed ? RAIL_WIDTH : width;
  const margin = collapsed ? 0 : width;
  return {
    html: { 'margin-right': `${margin}px` },
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
