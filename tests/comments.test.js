import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildThread, formatAge } from '../lib/comments.js';

const NOW = 1_700_000_000_000;
const T = NOW / 1000;

function comment(id, author, children = [], extra = {}) {
  return { id, type: 'comment', author, text: author ? `<p>by ${author}` : null, created_at_i: T - 60, children, ...extra };
}

function story(children) {
  return {
    id: 1,
    type: 'story',
    title: 'A story',
    url: 'https://example.com/post',
    author: 'op',
    points: 120,
    created_at_i: T - 7200,
    children,
  };
}

test('counts_descendants', () => {
  const thread = buildThread(story([
    comment(2, 'a', [
      comment(3, 'b', [comment(4, 'c')]),
      comment(5, 'd'),
    ]),
    comment(6, 'e'),
  ]), NOW);

  assert.equal(thread.commentCount, 5);
  assert.equal(thread.comments.length, 2);
  const [first, second] = thread.comments;
  assert.equal(first.descendants, 3);
  assert.equal(first.children[0].descendants, 1);
  assert.equal(first.children[0].children[0].descendants, 0);
  assert.equal(first.children[1].descendants, 0);
  assert.equal(second.descendants, 0);
  assert.equal(thread.title, 'A story');
  assert.equal(thread.points, 120);
  assert.equal(thread.url, 'https://example.com/post');
  assert.equal(thread.hnUrl, 'https://news.ycombinator.com/item?id=1');
  assert.equal(thread.age, '2 hours ago');
});

test('flags_op_comments', () => {
  const thread = buildThread(story([
    comment(2, 'op', [comment(3, 'someone', [comment(4, 'op')])]),
    comment(5, 'OP'),
  ]), NOW);

  const [first, second] = thread.comments;
  assert.equal(first.op, true);
  assert.equal(first.children[0].op, false);
  assert.equal(first.children[0].children[0].op, true);
  assert.equal(second.op, false);
});

test('handles_deleted_comments', () => {
  const thread = buildThread(story([
    comment(2, null, [comment(3, 'alive')]),
    comment(4, null),
    comment(5, 'a', [comment(6, null), comment(7, null, [comment(8, null)])]),
    comment(9, 'b', [], { text: null }),
  ]), NOW);

  assert.deepEqual(thread.comments.map((c) => c.id), [2, 5]);
  const [placeholder, parent] = thread.comments;
  assert.equal(placeholder.deleted, true);
  assert.equal(placeholder.author, null);
  assert.equal(placeholder.text, null);
  assert.equal(placeholder.op, false);
  assert.equal(placeholder.children[0].author, 'alive');
  assert.equal(parent.children.length, 0);
  assert.equal(parent.descendants, 0);
  assert.equal(placeholder.descendants, 1);
  assert.equal(thread.commentCount, 2);

  assert.equal(buildThread(story(undefined), NOW).commentCount, 0);
  assert.deepEqual(buildThread(story([comment(10, null)]), NOW).comments, []);
});

test('formats_relative_age', () => {
  const ago = (seconds) => formatAge(T - seconds, NOW);
  assert.equal(ago(0), 'just now');
  assert.equal(ago(59), 'just now');
  assert.equal(ago(-30), 'just now');
  assert.equal(ago(60), '1 minute ago');
  assert.equal(ago(5 * 60 + 30), '5 minutes ago');
  assert.equal(ago(59 * 60), '59 minutes ago');
  assert.equal(ago(3600), '1 hour ago');
  assert.equal(ago(3 * 3600 + 1200), '3 hours ago');
  assert.equal(ago(23 * 3600), '23 hours ago');
  assert.equal(ago(86400), '1 day ago');
  assert.equal(ago(2 * 86400 + 5), '2 days ago');
  assert.equal(ago(400 * 86400), '400 days ago');
  assert.equal(formatAge(undefined, NOW), '');
});
