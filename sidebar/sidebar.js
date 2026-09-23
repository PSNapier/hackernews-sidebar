// Placeholder. [004] replaces this with the comment tree.
const itemId = new URLSearchParams(location.search).get('item');
document.getElementById('item').textContent = /^\d+$/.test(itemId ?? '') ? itemId : 'unknown';
