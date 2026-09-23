// Algolia item (https://hn.algolia.com/api/v1/items/<id>) -> sidebar view model. Pure, `now` is injected (ms).

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function hnItemUrl(id) {
  return `https://news.ycombinator.com/item?id=${id}`;
}

export function buildThread(item, now) {
  const comments = buildComments(item.children, item.author, now);
  return {
    id: item.id,
    title: item.title ?? '',
    url: item.url || null,
    hnUrl: hnItemUrl(item.id),
    author: item.author ?? null,
    points: item.points ?? 0,
    age: formatAge(item.created_at_i, now),
    commentCount: comments.reduce((sum, c) => sum + weight(c) + c.descendants, 0),
    comments,
  };
}

// Deleted and dead comments come back with a null author or text. Keep them only as placeholders for live replies.
function buildComments(nodes, storyAuthor, now) {
  const out = [];
  for (const node of nodes ?? []) {
    if (!node || (node.type && node.type !== 'comment')) continue;
    const children = buildComments(node.children, storyAuthor, now);
    const deleted = !node.author || node.text == null;
    if (deleted && children.length === 0) continue;
    out.push({
      id: node.id,
      author: deleted ? null : node.author,
      text: deleted ? null : node.text,
      deleted,
      op: !deleted && !!storyAuthor && node.author === storyAuthor,
      age: formatAge(node.created_at_i, now),
      descendants: children.reduce((sum, c) => sum + weight(c) + c.descendants, 0),
      children,
    });
  }
  return out;
}

// Placeholders hold the tree together but don't count as comments.
function weight(comment) {
  return comment.deleted ? 0 : 1;
}

export function formatAge(createdSeconds, now) {
  if (typeof createdSeconds !== 'number' || !Number.isFinite(createdSeconds)) return '';
  const elapsed = Math.floor(now / 1000 - createdSeconds);
  if (elapsed < MINUTE) return 'just now';
  if (elapsed < HOUR) return plural(Math.floor(elapsed / MINUTE), 'minute');
  if (elapsed < DAY) return plural(Math.floor(elapsed / HOUR), 'hour');
  return plural(Math.floor(elapsed / DAY), 'day');
}

function plural(n, unit) {
  return `${n} ${unit}${n === 1 ? '' : 's'} ago`;
}
