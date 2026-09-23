# Roadmap

<!-- Next task number: [007] -->

---

## [005] Sidebar resize, collapse and hotkey

**Status:** `next`
**Depends On:** [003]
**Spec:** none

### Goal

The reader can drag the sidebar to any width (remembered across tabs and sessions), collapse it to a thin rail, and toggle it with `Alt+Shift+H`.

### Scope

- Drag handle on the sidebar's left edge. The width is saved to `chrome.storage.local` and applied to every sidebar
- Collapse button that shrinks to a thin rail (about 24px) and releases the page margin. Clicking the rail expands it again
- `commands` entry `toggle-sidebar` with the suggested key `Alt+Shift+H`, rebindable at `brave://extensions/shortcuts`
- Min and max width clamps
- NOT in scope: per-site width, remembering collapsed state per tab across restarts

### Technical Notes

**User flows:**

- **Reader:** sidebar left edge. Drag to resize.
- **Reader:** "Collapse" button in the sidebar header. Shrinks to a rail. Clicking the rail expands it.
- **Reader:** `Alt+Shift+H` anywhere in a bound tab toggles collapse.

**Critical files:**

- `content/inject.js` - modify. Owns the drag handle (it lives in the host page, outside the iframe, so pointer events work across the page) and applies the width.
- `lib/layout.js` - modify. Clamping and rail width.
- `background.js` - modify. `chrome.commands.onCommand` sends a toggle to the active tab if it's bound.
- `manifest.json` - modify. `commands` block.

**Details:**

- During a drag, put a transparent overlay over the iframe so it doesn't swallow `pointermove` events
- Collapse from inside the iframe goes iframe → service worker → tab via `chrome.runtime` messaging (no `postMessage`)
- `storage.onChanged` keeps open sidebars in sync when the width changes in another tab

### Acceptance Criteria

- [ ] Width is clamped between min and max
      `tests/layout.test.js::clamps_width`
- [ ] Collapsed state uses the rail width and releases the page margin
      `tests/layout.test.js::collapsed_uses_rail_width`
- [ ] Dragged width persists to a new article tab [MANUAL]
- [ ] `Alt+Shift+H` toggles the sidebar in a bound tab and does nothing in other tabs [MANUAL]

---

## [006] Split View mode (spike, then settings option)

**Status:** `blocked`
**Depends On:** [002]
**Spec:** none

### Goal

A setting to open HN stories as a native Brave Split View (article on the left, real logged-in HN thread on the right) instead of the injected sidebar. This gives voting and replying for free.

### Scope

- Spike first: confirm that Brave's split view honours `chrome.tabs.create({ splitWithTabId })` and `tab.splitViewId`, and whether a split can be created in the background
- If the spike passes: an options page with a "Sidebar mode" choice ("Injected sidebar" or "Split View") stored in `chrome.storage.sync`
- In Split View mode the service worker creates the article tab, then the HN item tab split with it (new tabs default to the right)
- Feature-detect and fall back to the injected sidebar when the API is missing
- NOT in scope: controlling the split ratio (the API doesn't offer it)

### Technical Notes

**Critical files:**

- `background.js` - modify. Branch on the mode setting in the open handler.
- `options/options.html` (new) - "Sidebar mode" setting.

**Details:**

- Chrome docs: `tabs.create({ splitWithTabId })`, `tabs.createSplit`, `tabs.unsplit`, `tab.splitViewId`. Available from Chrome 155. No extra permission. Tabs must be adjacent and share `pinned`, `windowId` and `groupId`
- Brave built its own split view before Chrome shipped one, so API parity is not guaranteed. That's why this is a spike
- Spike recipe: in the extension service worker console, run `chrome.tabs.create({ url: 'https://example.com', splitWithTabId: <hnTabId> })`
- **Blocked:** installed Brave is 1.95.104 on Chromium 153. The API needs Chromium 155 (2026-09-23)

### Acceptance Criteria

- [ ] Spike result recorded in Technical Notes (works, partial, or not supported) [MANUAL]
- [ ] Mode setting defaults to the injected sidebar and falls back to it when the API is missing
      `tests/open-mode.test.js::defaults_and_falls_back_to_injected`
- [ ] In Split View mode, a story click produces an article and HN thread split pair [MANUAL]

---
