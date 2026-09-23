# Roadmap

<!-- Next task number: [007] -->

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
