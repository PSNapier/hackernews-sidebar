import { MODE_KEY, SPLIT, resolveMode, splitViewSupported } from '../lib/open-mode.js';

const supported = splitViewSupported(chrome.tabs);
const radios = [...document.querySelectorAll('input[name="mode"]')];

async function init() {
  const splitRadio = radios.find((radio) => radio.value === SPLIT);
  splitRadio.disabled = !supported;
  document.getElementById('split-note').hidden = supported;

  // Show the mode that is actually in effect, so a saved "split" reads as injected when unsupported.
  const stored = await chrome.storage.sync.get(MODE_KEY);
  const mode = resolveMode(stored[MODE_KEY], supported);
  radios.find((radio) => radio.value === mode).checked = true;

  for (const radio of radios) {
    radio.addEventListener('change', () => chrome.storage.sync.set({ [MODE_KEY]: radio.value }));
  }
}

init();
