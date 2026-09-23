import { buildThread, hnItemUrl } from '../lib/comments.js';
import { safeHref, sanitize } from '../lib/sanitize.js';

const API = 'https://hn.algolia.com/api/v1/items/';
const parser = new DOMParser();

const el = {
  title: document.getElementById('title'),
  meta: document.getElementById('meta'),
  hnLink: document.getElementById('hn-link'),
  collapseAll: document.getElementById('collapse-all'),
  refresh: document.getElementById('refresh'),
  status: document.getElementById('status'),
  tree: document.getElementById('tree'),
};

const rawId = new URLSearchParams(location.search).get('item') ?? '';
const itemId = /^\d+$/.test(rawId) ? rawId : null;
let loading = false;
let allCollapsed = false;

if (itemId) {
  el.hnLink.href = hnItemUrl(itemId);
  el.title.href = hnItemUrl(itemId);
  el.refresh.addEventListener('click', load);
  el.collapseAll.addEventListener('click', toggleAll);
  el.tree.addEventListener('click', onTreeClick);
  load();
} else {
  el.title.textContent = 'Unknown item';
  el.hnLink.hidden = true;
  setStatus('No Hacker News item is bound to this tab.', 'error');
}

async function load() {
  if (loading) return;
  loading = true;
  const hasTree = el.tree.childElementCount > 0;
  el.refresh.disabled = true;
  el.refresh.textContent = 'Refreshing…';
  if (!hasTree) setStatus('Loading comments…');

  try {
    const response = await fetch(API + itemId, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const thread = buildThread(await response.json(), Date.now());
    renderHeader(thread);
    renderTree(thread);
  } catch (error) {
    setStatus(`Could not load comments (${error.message}).${hasTree ? ' Showing the last loaded version.' : ''}`, 'error');
  } finally {
    loading = false;
    el.refresh.disabled = false;
    el.refresh.textContent = 'Refresh';
  }
}

function renderHeader(thread) {
  el.title.textContent = thread.title || `Item ${thread.id}`;
  el.title.href = safeHref(thread.url) ?? thread.hnUrl;
  const parts = [count(thread.points, 'point'), count(thread.commentCount, 'comment')];
  if (thread.author) parts.push(`by ${thread.author}`);
  if (thread.age) parts.push(thread.age);
  el.meta.textContent = parts.join(' · ');
}

function renderTree(thread) {
  // Keep collapsed threads collapsed across refreshes.
  const folded = new Map();
  for (const node of el.tree.querySelectorAll('.comment.collapsed, .comment.replies-hidden')) {
    folded.set(node.dataset.id, node.classList.contains('collapsed') ? 'collapsed' : 'replies-hidden');
  }
  const fragment = document.createDocumentFragment();
  for (const comment of thread.comments) fragment.appendChild(buildComment(comment, folded));
  el.tree.replaceChildren(fragment);

  el.collapseAll.disabled = thread.comments.length === 0;
  if (thread.comments.length === 0) {
    setStatus('No comments yet.');
    setAllCollapsed(false);
  } else {
    setStatus('');
    setAllCollapsed(allCollapsed && folded.size > 0);
  }
}

function buildComment(comment, folded) {
  const node = document.createElement('article');
  node.className = 'comment';
  node.dataset.id = String(comment.id);
  if (comment.op) node.classList.add('op');
  if (comment.deleted) node.classList.add('deleted');
  const fold = folded.get(node.dataset.id);
  if (fold === 'collapsed' || (fold === 'replies-hidden' && comment.children.length > 0)) node.classList.add(fold);

  const head = document.createElement('div');
  head.className = 'comment-head';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'toggle';
  setToggle(toggle, !node.classList.contains('collapsed') && !node.classList.contains('replies-hidden'));
  head.appendChild(toggle);

  if (comment.deleted) {
    head.appendChild(span('author', '[deleted]'));
  } else {
    head.appendChild(link('author', comment.author, `https://news.ycombinator.com/user?id=${encodeURIComponent(comment.author)}`));
    if (comment.op) head.appendChild(span('op-badge', 'OP'));
  }
  if (comment.age) head.appendChild(link('age', comment.age, hnItemUrl(comment.id)));
  if (comment.descendants > 0) {
    head.appendChild(span('hidden-count', count(comment.descendants, 'hidden reply', 'hidden replies')));
  }
  node.appendChild(head);

  if (!comment.deleted) {
    const body = document.createElement('div');
    body.className = 'comment-body';
    body.innerHTML = sanitize(comment.text, parser);
    node.appendChild(body);
  }

  if (comment.children.length > 0) {
    const replies = document.createElement('div');
    replies.className = 'replies';
    for (const child of comment.children) replies.appendChild(buildComment(child, folded));
    node.appendChild(replies);
  }
  return node;
}

function onTreeClick(event) {
  const toggle = event.target.closest('button.toggle');
  if (!toggle) return;
  const node = toggle.closest('.comment');
  // A comment folded by "Collapse all" shows [+]. Clicking it reopens the replies.
  if (node.classList.contains('replies-hidden')) {
    node.classList.remove('replies-hidden');
    setToggle(toggle, true);
    return;
  }
  const nowCollapsed = node.classList.toggle('collapsed');
  setToggle(toggle, !nowCollapsed);
}

function toggleAll() {
  // Collapse all keeps each top-level comment readable and hides only its replies. Expand all opens everything.
  const collapse = !allCollapsed;
  const nodes = collapse
    ? el.tree.querySelectorAll(':scope > .comment')
    : el.tree.querySelectorAll('.comment.collapsed, .comment.replies-hidden');
  for (const node of nodes) {
    node.classList.remove('collapsed', 'replies-hidden');
    const hasReplies = collapse && node.querySelector(':scope > .replies');
    if (hasReplies) node.classList.add('replies-hidden');
    setToggle(node.querySelector(':scope > .comment-head > .toggle'), !hasReplies);
  }
  setAllCollapsed(collapse);
  if (collapse) window.scrollTo(0, 0);
}

function setAllCollapsed(value) {
  allCollapsed = value;
  el.collapseAll.textContent = value ? 'Expand all' : 'Collapse all';
  el.collapseAll.setAttribute('aria-pressed', String(value));
}

function setToggle(toggle, expanded) {
  toggle.textContent = expanded ? '[-]' : '[+]';
  toggle.setAttribute('aria-expanded', String(expanded));
  toggle.setAttribute('aria-label', expanded ? 'Collapse thread' : 'Expand thread');
}

function setStatus(message, kind = 'info') {
  el.status.textContent = message;
  el.status.hidden = !message;
  el.status.classList.toggle('error', kind === 'error');
}

function span(className, text) {
  const node = document.createElement('span');
  node.className = className;
  node.textContent = text;
  return node;
}

function link(className, text, href) {
  const node = document.createElement('a');
  node.className = className;
  node.textContent = text;
  node.href = href;
  node.target = '_blank';
  node.rel = 'noopener noreferrer';
  return node;
}

function count(n, singular, pluralForm = `${singular}s`) {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}
