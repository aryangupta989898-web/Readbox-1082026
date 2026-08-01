# Readbox Chrome Extension

A companion Chrome/Edge extension that lets you save any web article, essay or PDF to your Readbox library — and highlight any passage on any webpage with a single click.

## Features

- **Save current page** — click the toolbar icon → "Save Reading". The article is extracted (via Mozilla's Readability), title/author auto-detected, and saved to your Readbox library.
- **Highlight from anywhere** — select any text on any page. A small floating "Save to Readbox" button appears. Click it → the passage is saved as a highlight, and (if it's a new page) a reading is created for it too.
- **Right-click menu** — right-click on selected text or anywhere on a page for quick save shortcuts.
- **Zero AI budget required** — the extension only touches Readbox's own CRUD API. No LLM calls.

## Install (developer / unpacked mode)

1. Open Chrome → visit `chrome://extensions/`
2. Toggle **Developer mode** (top-right).
3. Click **Load unpacked** and select this `/app/extension` folder.
4. The Readbox icon appears in your toolbar.

## Connect it to your Readbox

1. Open your Readbox app.
2. Click the **Extension** button in the top navigation.
3. Copy the personal token.
4. In Chrome, right-click the Readbox extension icon → **Options**.
5. Paste your backend URL and token → **Save & Test**.

## Publish to Chrome Web Store (later)

1. Register as a Chrome Web Store developer ($5 one-time).
2. Zip this folder: `cd /app/extension && zip -r readbox-extension.zip .`
3. Upload the zip via the developer dashboard.
4. Review typically takes 1–3 days.

## Files

- `manifest.json` — Chrome Extension Manifest V3 config
- `background.js` — service worker (context menu, API calls, notifications)
- `content.js` — injected into every page, handles selection UX
- `content.css` — styles for the floating "Save" button
- `popup.html` / `popup.js` — the toolbar-icon popup
- `options.html` / `options.js` — settings page (token + backend URL)
- `Readability.js` — Mozilla's article-extraction library (Apache 2.0)
- `icons/` — extension icons
