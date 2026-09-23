import { externalUrl } from './lib/story-links.js';
import { bindTab, lookupTab, unbindTab } from './lib/tab-map.js';

const WEB_PAGES = { url: [{ schemes: ['http', 'https'] }] };
const SIDEBAR_PAGE = chrome.runtime.getURL('sidebar/sidebar.html');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'open' && sender.tab) {
    openBound(message, sender.tab).catch((error) => console.error('HN Sidebar: open failed', error));
    return;
  }
  // inject.js asks which item its tab is bound to. Only answered for the tab's own main frame.
  if (message?.type === 'sidebar-item' && sender.tab && sender.frameId === 0) {
    lookupTab(chrome.storage.session, sender.tab.id)
      .then((binding) => sendResponse(binding?.itemId ?? null))
      .catch(() => sendResponse(null));
    return true;
  }
  // Everything below is accepted only from our own sidebar page inside a tab (Collapse button, rail).
  if (!fromSidebar(sender)) return;
  if (message?.type === 'sidebar-collapse') {
    setCollapsed(sender.tab.id, { collapsed: Boolean(message.collapsed) }).then(sendResponse);
    return true;
  }
  // The sidebar asks which tab hosts it, to filter sidebar-state broadcasts.
  if (message?.type === 'sidebar-tab') {
    sendResponse(sender.tab.id);
  }
});

function fromSidebar(sender) {
  return sender.id === chrome.runtime.id && Boolean(sender.tab) && Boolean(sender.url?.startsWith(SIDEBAR_PAGE));
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-sidebar') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id !== undefined) setCollapsed(tab.id, { toggle: true });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  unbindTab(chrome.storage.session, tabId).catch((error) => console.error('HN Sidebar: unbind failed', error));
});

// Injection is attempted on commit, on completion and right after binding. inject.js dedupes per document.
chrome.webNavigation.onCommitted.addListener(({ tabId, frameId }) => {
  if (frameId === 0) injectIfBound(tabId);
}, WEB_PAGES);

chrome.webNavigation.onCompleted.addListener(({ tabId, frameId }) => {
  if (frameId === 0) injectIfBound(tabId);
}, WEB_PAGES);

async function openBound({ url, itemId }, opener) {
  if (!externalUrl(url) || !/^\d+$/.test(itemId)) return;
  const tab = await chrome.tabs.create({
    url,
    active: false,
    index: opener.index + 1,
    openerTabId: opener.id,
  });
  await bindTab(chrome.storage.session, tab.id, itemId);
  // The first commit may have fired before the binding existed.
  injectIfBound(tab.id);
}

async function injectIfBound(tabId) {
  try {
    if (!(await lookupTab(chrome.storage.session, tabId))) return;
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content/inject.js'] });
  } catch {
    // Pages the extension can't script (chrome://, Web Store, PDF viewer, closed tabs) fail silently.
  }
}

// inject.js in the tab's main frame owns the collapsed state. It applies the layout and replies with the
// new state, which is broadcast to extension pages (sidebars filter by tab id).
// Resolves to { collapsed } or null.
async function setCollapsed(tabId, change) {
  try {
    if (!(await lookupTab(chrome.storage.session, tabId))) return null;
    const state = await chrome.tabs.sendMessage(tabId, { type: 'sidebar-collapse', ...change }, { frameId: 0 });
    if (typeof state?.collapsed !== 'boolean') return null;
    // Rejects with "Receiving end does not exist" when no sidebar is listening. That's fine.
    await chrome.runtime.sendMessage({ type: 'sidebar-state', tabId, collapsed: state.collapsed }).catch(() => {});
    return { collapsed: state.collapsed };
  } catch {
    // No sidebar in the tab yet (still loading, or a page we can't script).
    return null;
  }
}
