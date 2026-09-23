// Injected by the service worker into bound tabs (main frame only). Adds the sidebar iframe and pushes the page left.
(async () => {
  // Guard first, before any await: onCommitted, onCompleted and the post-bind attempt can all land in one document.
  if (globalThis.hnSidebarInjected) return;
  globalThis.hnSidebarInjected = true;

  try {
    const {
      FRAME_ID, HANDLE_ID, OVERLAY_ID, OVERLAY_STYLES, WIDTH_KEY, layoutFor, widthFrom, widthFromDrag,
    } = await import(chrome.runtime.getURL('lib/layout.js'));

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
    // Collapsed state lives only in this document. Width is shared through storage.
    let width = widthFrom(stored[WIDTH_KEY]);
    let collapsed = false;
    let drag = null;

    const frame = document.createElement('iframe');
    frame.id = FRAME_ID;
    frame.src = chrome.runtime.getURL(`sidebar/sidebar.html?item=${encodeURIComponent(itemId)}`);
    frame.setAttribute('title', 'Hacker News comments');

    const handle = document.createElement('div');
    handle.id = HANDLE_ID;
    handle.setAttribute('title', 'Drag to resize the sidebar');

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    applyStyles(overlay, OVERLAY_STYLES);

    apply();
    root.appendChild(frame);
    // Same z-index as the frame, so it must come later in the DOM to sit on top.
    root.appendChild(handle);

    handle.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || collapsed) return;
      event.preventDefault();
      drag = { pointerId: event.pointerId, startX: event.clientX, startWidth: layoutFor({ width, viewport: innerWidth }).width };
      root.appendChild(overlay);
      handle.setPointerCapture(event.pointerId);
    });
    handle.addEventListener('pointermove', (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      width = widthFromDrag(drag.startWidth, drag.startX, event.clientX, innerWidth);
      apply();
    });
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);
    handle.addEventListener('lostpointercapture', endDrag);

    addEventListener('resize', apply);

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !changes[WIDTH_KEY] || drag) return;
      width = widthFrom(changes[WIDTH_KEY].newValue);
      apply();
    });

    // Only the service worker talks to this listener (sender.tab is unset for it). It relays the sidebar's
    // Collapse button, the rail and the Alt+Shift+H command, and forwards the reply to the sidebar frame.
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (sender.id !== chrome.runtime.id || sender.tab || message?.type !== 'sidebar-collapse') return;
      collapsed = message.toggle ? !collapsed : Boolean(message.collapsed);
      if (collapsed && drag) endDrag();
      apply();
      sendResponse({ collapsed });
    });

    function endDrag() {
      if (!drag) return;
      const { pointerId } = drag;
      drag = null;
      overlay.remove();
      if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
      chrome.storage.local.set({ [WIDTH_KEY]: width }).catch(() => {});
    }

    function apply() {
      const layout = layoutFor({ width, collapsed, viewport: innerWidth });
      applyStyles(frame, layout.frame);
      applyStyles(handle, layout.handle);
      applyStyles(root, layout.html);
    }
  } catch {
    globalThis.hnSidebarInjected = false;
  }

  function applyStyles(element, styles) {
    for (const [property, value] of Object.entries(styles)) {
      element.style.setProperty(property, value, 'important');
    }
  }
})();
