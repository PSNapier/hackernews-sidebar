const HN_ORIGIN = 'https://news.ycombinator.com/';
const HN_HOST = 'news.ycombinator.com';

// Returns the absolute URL if it points off HN over http(s), otherwise null.
export function externalUrl(href) {
  let url;
  try {
    url = new URL(href, HN_ORIGIN);
  } catch {
    return null;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (url.hostname === HN_HOST) return null;
  return url.href;
}

// Given a click target, returns { url, itemId } for an external story title, otherwise null.
// `target` only needs closest(); the anchor needs closest() and getAttribute().
export function storyLinkFor(target) {
  if (!target || typeof target.closest !== 'function') return null;
  const anchor = target.closest('span.titleline > a');
  if (!anchor) return null;
  const row = anchor.closest('tr.athing');
  if (!row || !/^\d+$/.test(row.id)) return null;
  const url = externalUrl(anchor.getAttribute('href'));
  if (!url) return null;
  return { url, itemId: row.id };
}
