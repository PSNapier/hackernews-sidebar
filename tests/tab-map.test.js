import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bindTab, lookupTab, unbindTab } from '../lib/tab-map.js';

// Stand-in for chrome.storage.session (promise-based get/set/remove).
function memoryStorage() {
  const data = new Map();
  return {
    data,
    async get(key) {
      return data.has(key) ? { [key]: data.get(key) } : {};
    },
    async set(items) {
      for (const [key, value] of Object.entries(items)) data.set(key, value);
    },
    async remove(key) {
      data.delete(key);
    },
  };
}

test('binds_and_looks_up_item', async () => {
  const storage = memoryStorage();
  await bindTab(storage, 42, '41234567');
  await bindTab(storage, 43, '999');
  assert.deepEqual(await lookupTab(storage, 42), { itemId: '41234567' });
  assert.deepEqual(await lookupTab(storage, 43), { itemId: '999' });
});

test('unbinds_on_remove', async () => {
  const storage = memoryStorage();
  await bindTab(storage, 42, '41234567');
  await bindTab(storage, 43, '999');
  await unbindTab(storage, 42);
  assert.equal(await lookupTab(storage, 42), null);
  assert.deepEqual(await lookupTab(storage, 43), { itemId: '999' });
  // Unbinding an unknown tab is harmless
  await unbindTab(storage, 1234);
});

test('lookup_returns_null_for_unbound_tab', async () => {
  const storage = memoryStorage();
  assert.equal(await lookupTab(storage, 7), null);
});
