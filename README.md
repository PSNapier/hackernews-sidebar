<div align="center">

# Hacker News Sidebar

**Click a story on Hacker News. Read the article with its comments docked on the right.**

A Brave / Chrome extension. Plain JS, Manifest V3, no build step.

![Status](https://img.shields.io/badge/status-in%20development-orange)
![License](https://img.shields.io/badge/license-MIT-blue)

</div>

---

## What it does

- Every story title on `news.ycombinator.com` opens the article in a background tab
- That tab gets a dark, resizable sidebar with the thread's comments
- The sidebar stays with the tab as you click around, until you close it
- `Alt+Shift+H` toggles it

Comments are read-only and come from the [Algolia HN API](https://hn.algolia.com/api). An "Open on HN" link takes you to the real thread for voting and replying.

## Status

Early development. See [ROADMAP.md](ROADMAP.md) for planned work.

## Install (unpacked)

1. Clone this repo
2. Open `brave://extensions` (or `chrome://extensions`)
3. Turn on **Developer mode**
4. Click **Load unpacked** and select the repo folder

## Privacy

- Article URLs are never modified
- The sidebar runs in an isolated extension frame that the article page can't read
- Scripts only run in tabs you opened from Hacker News
- The only network request the extension makes is to the Algolia HN API

## Development

Tests use Node's built-in runner, with no dependencies:

```sh
node --test tests/
```

## License

[MIT](LICENSE)
