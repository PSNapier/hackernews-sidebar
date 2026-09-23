// Tab id -> { itemId }, stored one key per tab so writes never race on a shared object.
// `storage` is chrome.storage.session (or anything with promise-based get/set/remove).

const keyFor = (tabId) => `tab:${tabId}`;

export async function bindTab(storage, tabId, itemId) {
  await storage.set({ [keyFor(tabId)]: { itemId } });
}

export async function lookupTab(storage, tabId) {
  const key = keyFor(tabId);
  const result = await storage.get(key);
  return result[key] ?? null;
}

export async function unbindTab(storage, tabId) {
  await storage.remove(keyFor(tabId));
}
