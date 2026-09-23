import { externalUrl } from './lib/story-links.js';
import { bindTab, unbindTab } from './lib/tab-map.js';

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== 'open' || !sender.tab) return;
  openBound(message, sender.tab).catch((error) => console.error('HN Sidebar: open failed', error));
});

chrome.tabs.onRemoved.addListener((tabId) => {
  unbindTab(chrome.storage.session, tabId).catch((error) => console.error('HN Sidebar: unbind failed', error));
});

async function openBound({ url, itemId }, opener) {
  if (!externalUrl(url) || !/^\d+$/.test(itemId)) return;
  const tab = await chrome.tabs.create({
    url,
    active: false,
    index: opener.index + 1,
    openerTabId: opener.id,
  });
  await bindTab(chrome.storage.session, tab.id, itemId);
}
