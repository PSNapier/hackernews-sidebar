import { externalUrl } from './lib/story-links.js';
import { bindTab, lookupTab, unbindTab } from './lib/tab-map.js';

const WEB_PAGES = { url: [{ schemes: ['http', 'https'] }] };

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
