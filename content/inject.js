// Injected by the service worker into bound tabs (main frame only). Adds the sidebar iframe and pushes the page left.
(async () => {
  // Guard first, before any await: onCommitted, onCompleted and the post-bind attempt can all land in one document.
  if (globalThis.hnSidebarInjected) return;
  globalThis.hnSidebarInjected = true;

  try {
    const { FRAME_ID, WIDTH_KEY, layoutFor, widthFrom } = await import(chrome.runtime.getURL('lib/layout.js'));

    // The service worker answers from the tab map using the sender tab, so the page can't supply the id.
    const itemId = await chrome.runtime.sendMessage({ type: 'sidebar-item' });
    if (!itemId) {
      globalThis.hnSidebarInjected = false;
      return;
    }

    if (!document.documentElement) {
      await new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
    }
    const root = document.documentElement;
    if (!root || document.getElementById(FRAME_ID)) return;

    const stored = await chrome.storage.local.get(WIDTH_KEY);
    const layout = layoutFor({ width: widthFrom(stored[WIDTH_KEY]), collapsed: false });

    const frame = document.createElement('iframe');
    frame.id = FRAME_ID;
    frame.src = chrome.runtime.getURL(`sidebar/sidebar.html?item=${encodeURIComponent(itemId)}`);
    frame.setAttribute('title', 'Hacker News comments');
    applyStyles(frame, layout.frame);
    applyStyles(root, layout.html);
    root.appendChild(frame);
  } catch {
    globalThis.hnSidebarInjected = false;
  }

  function applyStyles(element, styles) {
    for (const [property, value] of Object.entries(styles)) {
      element.style.setProperty(property, value, 'important');
    }
  }
})();
