// How a story opens: injected sidebar (default) or a native Split View pair. Stored in chrome.storage.sync.
export const MODE_KEY = 'sidebarMode';
export const INJECTED = 'injected';
export const SPLIT = 'split';

// Detection heuristic pending the [006] spike: the Split View tabs API (Chromium 155+) ships
// tabs.createSplit alongside create({ splitWithTabId }), so its presence stands in for the whole API.
// `tabsApi` is chrome.tabs (or a stand-in).
export function splitViewSupported(tabsApi) {
  return typeof tabsApi?.createSplit === 'function';
}

// Split View only when chosen and supported. Anything else, including missing or unknown values, is injected.
export function resolveMode(stored, supported) {
  return stored === SPLIT && supported ? SPLIT : INJECTED;
}
