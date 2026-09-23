// Classic content script on news.ycombinator.com. Sends external story clicks to the service worker.
(async () => {
  const { storyLinkFor } = await import(chrome.runtime.getURL('lib/story-links.js'));

  function intercept(event) {
    const link = storyLinkFor(event.target);
    if (!link) return;
    event.preventDefault();
    chrome.runtime.sendMessage({ type: 'open', url: link.url, itemId: link.itemId });
  }

  // Plain, Ctrl/Cmd and Shift clicks.
  document.addEventListener('click', (event) => {
    if (event.button === 0) intercept(event);
  }, true);

  // Middle-click. Cancelling auxclick is enough to stop Chrome opening its own tab.
  document.addEventListener('auxclick', (event) => {
    if (event.button === 1) intercept(event);
  }, true);
})();
