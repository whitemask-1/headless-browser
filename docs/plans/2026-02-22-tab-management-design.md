# Tab Management Design

**Date:** 2026-02-22
**Branch:** feat/tab-management
**Status:** Approved

---

## Overview

Add full tab management to the headless Electron browser. Tabs become the primary navigation model, replacing the sidebar group system as the live navigation surface (groups remain as session presets for a future step). Up to 9 tabs, lazy-created, each with true session isolation.

---

## Architecture

### Tab State (renderer.js)

```js
let tabs = [];        // array of tab objects
let activeTabId = 1;  // 1-indexed
```

Each tab object:
```js
{
  id: Number,         // 1–9
  url: String,        // current URL (updated on navigation)
  title: String,      // page title (from page-title-updated)
  favicon: String|null, // favicon URL (from page-favicon-updated)
  webview: Element    // the <webview> DOM element
}
```

### DOM Structure

```
body
├── #drag, .drag-handle.tc       (existing — unchanged)
├── #search-overlay              (existing — unchanged)
├── #sidebar                     (existing — unchanged, groups still load tab 1)
├── #tab-container               (new — replaces single <webview id="browser">)
│   ├── webview#tab-wv-1         display:block (active)
│   └── webview#tab-wv-N         display:none  (inactive)
├── #tab-strip-trigger           (new — 8px hover zone at bottom)
└── #tab-strip                   (new — fixed bottom horizontal bar)
    ├── .tab-item[data-id=N]     favicon img + truncated title span
    └── #new-tab-btn             "+" button
```

### Webview Setup

- Each webview uses `partition="persist:main"` (shared cookie jar, same as today)
- All existing `did-attach-webview` event listeners in `main.js` apply automatically to each new webview
- New per-webview renderer events:
  - `page-favicon-updated` → update `tab.favicon`, re-render strip
  - `page-title-updated` → update `tab.title`, re-render strip
  - `did-navigate` → update `tab.url`

---

## Keyboard Shortcuts

All handled in the `wc.on("before-input-event", ...)` handler in `main.js`. Each shortcut calls a `window.__<action>()` function exposed in `renderer.js`.

| Shortcut | Action | Renderer function |
|---|---|---|
| `Cmd+1` – `Cmd+9` | Switch to tab N (create if absent, max 9) | `window.__switchTab(n)` |
| `Cmd+T` | Open new tab (next available slot) | `window.__newTab()` |
| `Cmd+W` | Close active tab (last tab cannot be closed) | `window.__closeTab()` |
| `Cmd+0` | Slate clean — reset to 1 tab on google.com | `window.__slateClean()` |
| `Cmd+[` | Switch to previous tab (cycle) | `window.__prevTab()` |
| `Cmd+]` | Switch to next tab (cycle) | `window.__nextTab()` |
| `Cmd+P` | Toggle always-on-top pin (replaces old `Cmd+T`) | `window.__showPinIndicator()` |

> `Cmd+L` (search bar) and `Cmd+R` (reload) are unchanged.

---

## Tab Strip UI

### Visibility

- `#tab-strip-trigger`: `position: fixed; bottom: 0; left: 0; right: 0; height: 8px; z-index: 1000`
- On `mouseenter` of trigger → fade strip in (`opacity: 1`)
- On `mouseleave` of `#tab-strip` (not trigger) → fade strip out (`opacity: 0`)
- This two-element approach avoids the hover gap problem

### Appearance

- `position: fixed; bottom: 0; left: 0; right: 0`
- Dark translucent background (`rgba(15,15,15,0.92)`)
- Flex row, items left-to-right
- Active tab: highlighted pill (blue accent `#3b82f6` underline or background)
- Each `.tab-item`: `<img class="tab-favicon">` + `<span class="tab-title">` (max-width ~120px, text-overflow: ellipsis)
- `#new-tab-btn`: `+` at the far right end
- `-webkit-app-region: no-drag` on all interactive elements

### Favicon Fallback

If `tab.favicon` is null (new tab / google.com before load), show a neutral globe icon (Unicode `🌐` or a CSS placeholder).

---

## Slate Clean

`Cmd+0` calls `window.__slateClean()`:
1. Remove all webviews except tab 1
2. Navigate tab 1 to `https://www.google.com`
3. Clear title/favicon for tab 1
4. Re-render strip

Shows a brief toast: `"Slate cleaned"` using the existing toast pattern.

---

## Interaction with Existing Features

| Feature | Impact |
|---|---|
| Sidebar site buttons | Click navigates the **active tab** (instead of `browser.src`) |
| `Cmd+L` search bar | Navigates the **active tab's webview** |
| `Cmd+R` reload | Reloads the **active tab's webview** |
| `Cmd+←` / `Cmd+→` | Back/forward on the **active tab's webview** |
| `Cmd+Shift+C` copy URL | Copies URL from the **active tab's webview** |
| `Cmd+P` pin | Unchanged behavior, new shortcut |
| HTML5 fullscreen | Hides sidebar and tab strip, existing CSS handles sidebar; strip gets same treatment |

---

## Out of Scope (Future)

- Session saving/restoring (groups become session presets)
- Tab reordering via drag
- Tab overflow (>9 tabs)
