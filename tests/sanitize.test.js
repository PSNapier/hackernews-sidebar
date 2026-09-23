import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitize } from '../lib/sanitize.js';

// Tiny stand-in for DOMParser: the "html" passed in is a prebuilt node tree.
const el = (name, attrs = {}, ...children) => ({
  nodeType: 1,
  nodeName: name.toUpperCase(),
  attributes: Object.entries(attrs).map(([name, value]) => ({ name, value })),
  getAttribute: (key) => (key in attrs ? attrs[key] : null),
  childNodes: children.map((child) => (typeof child === 'string' ? text(child) : child)),
});
const text = (value) => ({ nodeType: 3, nodeName: '#text', textContent: value, childNodes: [] });
const stubParser = {
  parseFromString: (tree, type) => {
    assert.equal(type, 'text/html');
    return { body: el('body', {}, ...tree) };
  },
};
const run = (...tree) => sanitize(tree, stubParser);

test('strips_scripts_and_event_handlers', () => {
  assert.equal(run(el('script', {}, 'alert(1)'), 'after'), 'after');
  assert.equal(run(el('style', {}, 'p{}'), el('p', {}, 'x')), '<p>x</p>');
  assert.equal(run(el('img', { src: 'x', onerror: 'alert(1)' })), '');
  assert.equal(run(el('p', { onclick: 'evil()', class: 'c', style: 'color:red' }, 'hi')), '<p>hi</p>');
  assert.equal(
    run(el('a', { href: 'https://ok.example/', onmouseover: 'evil()' }, 'link')),
    '<a href="https://ok.example/" target="_blank" rel="noopener noreferrer">link</a>',
  );
  assert.equal(run(el('div', {}, el('b', {}, 'bold'), ' and ', el('span', {}, 'span'))), 'bold and span');
  assert.equal(run('<script>alert(1)</script> & "q"'), '&lt;script&gt;alert(1)&lt;/script&gt; &amp; "q"');
  assert.equal(run({ nodeType: 8, nodeName: '#comment', textContent: 'hidden', childNodes: [] }), '');
  assert.equal(run(el('iframe', { src: 'https://x' }, 'fallback')), '');
});

test('keeps_allowed_tags_and_hrefs', () => {
  assert.equal(
    run('First', el('p', {}, 'Second ', el('i', {}, 'italic')), el('pre', {}, el('code', {}, 'const a = 1 < 2;'))),
    'First<p>Second <i>italic</i></p><pre><code>const a = 1 &lt; 2;</code></pre>',
  );
  assert.equal(
    run(el('a', { href: 'http://example.com/?a=1&b="2"', rel: 'nofollow' }, 'x')),
    '<a href="http://example.com/?a=1&amp;b=%222%22" target="_blank" rel="noopener noreferrer">x</a>',
  );
  assert.equal(sanitize('', stubParserFor([])), '');
  assert.equal(sanitize(null, stubParserFor([])), '');
});

test('drops_unsafe_hrefs', () => {
  assert.equal(run(el('a', { href: 'javascript:alert(1)' }, 'click')), 'click');
  assert.equal(run(el('a', { href: ' JavaScript:alert(1)' }, 'click')), 'click');
  assert.equal(run(el('a', { href: 'data:text/html,hi' }, 'data')), 'data');
  assert.equal(run(el('a', { href: '/relative' }, 'rel')), 'rel');
  assert.equal(run(el('a', {}, 'bare')), 'bare');
});

function stubParserFor(tree) {
  return { parseFromString: () => ({ body: el('body', {}, ...tree) }) };
}
