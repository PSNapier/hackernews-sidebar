import { test } from 'node:test';
import assert from 'node:assert/strict';
import { storyLinkFor } from '../lib/story-links.js';

// Minimal DOM stubs: only the bits storyLinkFor touches.
function storyRow(id) {
  return { id };
}

function titleAnchor(href, row) {
  const anchor = {
    getAttribute: (name) => (name === 'href' ? href : null),
    closest: (sel) => {
      if (sel === 'span.titleline > a') return anchor;
      if (sel === 'tr.athing') return row;
      return null;
    },
  };
  return anchor;
}

// A child node inside the anchor (e.g. text wrapper) that bubbles up via closest().
function childOf(anchor) {
  return { closest: (sel) => anchor.closest(sel) };
}

function otherAnchor(href) {
  return {
    getAttribute: (name) => (name === 'href' ? href : null),
    closest: () => null,
  };
}

test('resolves_item_id_from_story_row', () => {
  const anchor = titleAnchor('https://example.com/post', storyRow('41234567'));
  assert.deepEqual(storyLinkFor(anchor), { url: 'https://example.com/post', itemId: '41234567' });
  assert.deepEqual(storyLinkFor(childOf(anchor)), { url: 'https://example.com/post', itemId: '41234567' });

  const http = titleAnchor('http://example.org/a?b=1#c', storyRow('7'));
  assert.deepEqual(storyLinkFor(http), { url: 'http://example.org/a?b=1#c', itemId: '7' });
});

test('skips_self_posts_and_hn_links', () => {
  // Ask HN / self-post: relative item link
  assert.equal(storyLinkFor(titleAnchor('item?id=123', storyRow('123'))), null);
  // Absolute link back to HN
  assert.equal(storyLinkFor(titleAnchor('https://news.ycombinator.com/item?id=5', storyRow('9'))), null);
  // Non-http(s) schemes
  assert.equal(storyLinkFor(titleAnchor('javascript:void(0)', storyRow('10'))), null);
  assert.equal(storyLinkFor(titleAnchor('mailto:a@b.c', storyRow('11'))), null);
  // Title anchor outside a story row
  assert.equal(storyLinkFor(titleAnchor('https://example.com/', null)), null);
  // Any other anchor (sitebit domain link, comments, user links)
  assert.equal(storyLinkFor(otherAnchor('from?site=example.com')), null);
  assert.equal(storyLinkFor(otherAnchor('https://example.com/')), null);
  // Non-element targets
  assert.equal(storyLinkFor(null), null);
  assert.equal(storyLinkFor({}), null);
});
