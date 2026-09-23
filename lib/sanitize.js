// Allowlist sanitizer for HN comment HTML. Parses with an injected DOMParser-like object, then walks the tree
// and rebuilds a string from allowlisted tags and escaped text only. The raw input never reaches innerHTML.

const ALLOWED = new Set(['p', 'a', 'i', 'pre', 'code']);
const DROP_WITH_CONTENT = new Set(['script', 'style', 'template', 'noscript', 'iframe', 'object', 'svg', 'math']);
const ELEMENT = 1;
const TEXT = 3;

export function sanitize(html, parser) {
  if (!html) return '';
  const doc = parser.parseFromString(html, 'text/html');
  return doc && doc.body ? children(doc.body) : '';
}

function children(node) {
  let out = '';
  for (const child of node.childNodes ?? []) out += walk(child);
  return out;
}

function walk(node) {
  if (node.nodeType === TEXT) return escapeText(node.textContent ?? '');
  if (node.nodeType !== ELEMENT) return '';

  const tag = String(node.nodeName).toLowerCase();
  if (DROP_WITH_CONTENT.has(tag)) return '';
  const inner = children(node);
  if (!ALLOWED.has(tag)) return inner;
  if (tag !== 'a') return `<${tag}>${inner}</${tag}>`;

  const href = safeHref(node.getAttribute('href'));
  if (!href) return inner;
  return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${inner}</a>`;
}

export function safeHref(href) {
  if (typeof href !== 'string') return null;
  let url;
  try {
    url = new URL(href.trim());
  } catch {
    return null;
  }
  return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
}

function escapeText(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(value) {
  return escapeText(value).replace(/"/g, '&quot;');
}
