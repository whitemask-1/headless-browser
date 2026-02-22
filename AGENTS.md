# AGENTS.md — headless-browser

> Instructions and context for AI coding agents working on this project.

---

## Project Overview

**headless-browser** is a minimal, frameless Electron desktop browser with site group management. Users can launch curated sets of websites from the command line, switch between them via a collapsible sidebar, or run it standalone as a clean browser ("bare mode") pointed at Google.

The tech stack is intentionally small: Electron (Node.js) for the desktop shell, vanilla HTML/CSS/JS for the UI, and a Python CLI script for managing site groups.

---

## Architecture

```
headless-browser/
├── main.js          # Electron main process
├── index.html       # UI shell (sidebar, webview, search overlay, inline CSS)
├── renderer.js      # Renderer/client-side logic
├── src/
│   └── manage.py    # Python CLI for site group CRUD
├── sites.json       # Local scratch file (not used at runtime)
├── package.json     # Node dependencies & scripts
├── Makefile         # Convenience targets for launching
└── README.md
```

### Component Responsibilities

| File | Process | Purpose |
|------|---------|---------|
| `main.js` | Main (Node) | Creates a frameless `BrowserWindow`, reads site group data from `~/.browser_groups.json`, injects it into the renderer via `executeJavaScript`, handles webview fullscreen events and keyboard shortcuts (`Cmd/Ctrl+R`, `Cmd/Ctrl+←/→`, `Cmd/Ctrl+L`, `Cmd/Ctrl+P`, `Cmd/Ctrl+T/W/0/1-9/[/]`). |
| `index.html` | Renderer | Single-page UI shell containing all inline CSS. Defines the layout: transparent drag region, collapsible sidebar, search overlay (`#search-overlay`), and a `<webview>` element for browsing. |
| `renderer.js` | Renderer | Polls for injected `window.__sites__` data, then initializes the UI. Dynamically creates sidebar buttons, handles site navigation, search bar show/hide/submit, sidebar collapse toggle, and exposes `window.__showPinIndicator()` for the always-on-top toast. In bare mode, hides the sidebar and loads Google. |
| `src/manage.py` | Standalone Python | Interactive CLI (no external dependencies) that reads/writes `~/.browser_groups.json` for creating, editing, deleting, and viewing site groups. |

### Data Flow

1. `manage.py` writes site groups to `~/.browser_groups.json` (a flat JSON object keyed by group name).
2. `main.js` reads that file on startup, extracts the group matching the CLI argument, and injects the sites object plus metadata (`__sites__`, `__bare__`, `__group__`) into the renderer.
3. `renderer.js` polls `window.__sites__` every 50ms until available, then calls `init()` to build the UI.

### Key Design Decisions

- **No bundler / no framework**: All client code is vanilla JS; CSS is inline in `index.html`. Keep it this way.
- **No `contextIsolation`** (currently `false`): Site data is injected via `executeJavaScript` directly into the renderer's `window` object. This is intentional for simplicity but means the renderer has access to Node APIs — be mindful of security implications if adding features.
- **`webviewTag: true`**: The app uses Electron's `<webview>` tag (not `BrowserView` or iframe) for site rendering. This is required for cross-origin browsing with `allowpopups` and `allowfullscreen`.
- **Persistent partition**: The webview uses `partition="persist:main"` so cookies/storage survive across sessions.
- **User data lives in home directory**: `~/.browser_groups.json` — never in the project directory.

---

## Development Setup

### Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18+ | Required for Electron |
| npm | Bundled with Node | Package manager |
| Python | 3.8+ | For `manage.py` only; no pip dependencies |
| Electron | 40.6 | Installed via `npm install` |

### Installation

```bash
git clone https://github.com/whitemask-1/headless-browser.git
cd headless-browser
npm install
```

### Running

```bash
# Bare mode (no sidebar, loads Google)
npm start

# With a site group
npm start -- <group-name>

# Manage site groups interactively
python src/manage.py

# Via Makefile (uses absolute paths — adjust if your setup differs)
make browser              # bare mode
make browser work         # launch "work" group
make manage               # run manage.py
```

---

## Testing

There is **no formal test suite** at this time. When verifying changes, use the following manual testing checklist:

### Manual Test Checklist

1. **Bare mode** — Run `npm start` with no arguments. Confirm:
   - Window opens frameless with no sidebar
   - Google loads in the webview
   - `Cmd/Ctrl+L` opens the search overlay
   - Typing a URL navigates directly; typing a query searches Google
   - `Escape` dismisses the search bar

2. **Group mode** — Create a group via `python src/manage.py`, then run `npm start -- <group>`. Confirm:
   - Sidebar shows numbered site buttons
   - Clicking a button loads the corresponding URL
   - Sidebar collapse/expand works (toggle button `‹` / `›`)
   - Keyboard shortcuts work: `Cmd/Ctrl+R` (reload), `Cmd/Ctrl+←/→` (back/forward), `Cmd/Ctrl+L` (search), `Cmd/Ctrl+P` (pin on top)

3. **Fullscreen-in-window** — Trigger HTML5 fullscreen (e.g., YouTube full-screen button). Confirm:
   - The webview expands to fill the window (not the entire display)
   - The sidebar hides during fullscreen
   - Exiting fullscreen restores the sidebar

4. **manage.py** — Run through all menu options:
   - Create a new group → confirm it appears in `~/.browser_groups.json`
   - Edit an existing group (reuse the same name)
   - View a group
   - Delete a group
   - Quit

5. **Always-on-top (pin)** — Press `Cmd/Ctrl+P`. Confirm:
   - Window stays above all other apps when pinned
   - A brief toast indicator ("📌 Pinned on top" / "📌 Unpinned") appears and fades after ~1.5s
   - Pressing `Cmd/Ctrl+P` again unpins the window
   - Pin state does not persist across app restarts (intentional)

6. **Tab management** — Run `npm start`. Confirm:
   - `Cmd/Ctrl+T` opens a new tab (hover bottom edge to see tab strip with 2 tabs)
   - `Cmd/Ctrl+1` / `Cmd/Ctrl+2` switches between tabs; active tab is highlighted
   - Each tab maintains independent navigation history (`Cmd/Ctrl+←/→` works per-tab)
   - `Cmd/Ctrl+[` / `Cmd/Ctrl+]` cycles through open tabs
   - `Cmd/Ctrl+W` closes the active tab; strip updates to show remaining tabs
   - `Cmd/Ctrl+W` on the last remaining tab does nothing (last tab protected)
   - `Cmd/Ctrl+0` resets all tabs to 1 tab on google.com; "Slate cleaned" toast appears
   - Hovering the bottom edge of the window reveals the tab strip; moving away hides it
   - Tab strip shows website favicon and truncated page title for each open tab
   - `Cmd/Ctrl+L` search navigates the currently active tab
   - Sidebar site buttons (in group mode) navigate the active tab
   - `Cmd/Ctrl+P` pin toggle still works (not affected by tab changes)

7. **Edge cases**:
   - Launch with a non-existent group name → should fall back to bare mode
   - Empty `~/.browser_groups.json` or missing file → should not crash
   - Window dragging via the transparent drag region at the top

### Adding Tests

If adding automated tests in the future:
- Use a `test/` directory at the project root
- For Electron main-process logic, consider [Spectron](https://github.com/electron-userland/spectron) or [Playwright Electron](https://playwright.dev/docs/api/class-electron)
- For `manage.py`, use Python's built-in `unittest` or `pytest`
- Add a `"test"` script to `package.json`

---

## Coding Conventions

- **JavaScript**: CommonJS (`require`/`module.exports`), as set by `"type": "commonjs"` in `package.json`. No TypeScript, no ESM.
- **Formatting**: 2-space indentation in JS/HTML; 4-space in Python. No linter is configured — keep style consistent with existing code.
- **CSS**: All styles are inline in `index.html` inside a single `<style>` block. Do not extract to separate CSS files unless explicitly asked.
- **Naming**: camelCase for JS variables/functions; snake_case for Python.
- **No external UI dependencies**: No React, Vue, Tailwind, etc. Keep the renderer as plain HTML/CSS/JS.
- **Python**: Standard library only. `manage.py` must remain dependency-free.

---

## Common Tasks for AI Agents

### Adding a New Keyboard Shortcut

1. In `main.js`, inside the `wc.on("before-input-event", ...)` handler (~line 150), add a new `if (meta && input.key === "...")` block.
2. If the shortcut needs to interact with the renderer UI, call `win.webContents.executeJavaScript(...)` with a function exposed on `window` in `renderer.js`.
3. **Existing pattern to follow**: The `Cmd/Ctrl+P` always-on-top toggle is a good reference for shortcuts that change window state in the main process and then notify the renderer for a visual indicator. See `win.setAlwaysOnTop()` → `window.__showPinIndicator()` flow.

### Adding a New UI Element

1. Add the HTML markup in `index.html` (within `<body>`). For transient indicators (toasts), the element can be created dynamically in `renderer.js` instead — see `__showPinIndicator()` for an example.
2. Add styles in the `<style>` block in `index.html`.
3. Add behavior in `renderer.js` inside the `init()` function, or as a top-level `window.__fn` if the main process needs to call it directly via `executeJavaScript`.

### Modifying Site Group Data Format

1. Update `manage.py` — both the `save()` output and any reading/display logic.
2. Update `main.js` — the `sites` variable extraction from the loaded JSON.
3. Update `renderer.js` — the `Object.entries(sites)` iteration that builds sidebar buttons.

### Changing Window Appearance

- Window dimensions: `main.js` → `createWindow()` → `width`/`height` parameters.
- Background color: `main.js` → `backgroundColor` and `index.html` → `body` background.
- Sidebar width: `index.html` → `#sidebar` CSS (`width`, `min-width`).

---

## Help Resources

- **Electron Documentation**: https://www.electronjs.org/docs/latest/
- **Electron BrowserWindow API**: https://www.electronjs.org/docs/latest/api/browser-window
- **Electron Webview Tag**: https://www.electronjs.org/docs/latest/api/webview-tag
- **Electron `before-input-event`**: https://www.electronjs.org/docs/latest/api/web-contents#event-before-input-event
- **Node.js `fs` module**: https://nodejs.org/api/fs.html
- **Node.js `path` module**: https://nodejs.org/api/path.html
- **Python `json` module**: https://docs.python.org/3/library/json.html
- **GitHub Repository**: https://github.com/whitemask-1/headless-browser

---

## Known Quirks & Gotchas

- **`nodeIntegration` typo**: In `main.js`, the `webPreferences` object has `nodeIntegreation` (misspelled). Electron ignores unknown keys, so Node integration is effectively off (the default). If you fix the typo, be aware that enabling `nodeIntegration: true` with `contextIsolation: false` is a security risk.
- **`contextIsolation: false`**: This is set intentionally so `executeJavaScript` can write to `window.__sites__` directly. Changing this to `true` would require adding a preload script with `contextBridge`.
- **Polling for data**: `renderer.js` uses `setInterval` polling to wait for `__sites__` to be injected. This is a race-condition workaround since `did-finish-load` fires before the renderer script reads the variable.
- **Hardcoded paths in Makefile**: The `Makefile` uses absolute paths (`~/Documents/Code/headless-browser`). These are user-specific and won't work for other contributors without modification.
- **`sites.json`**: This file exists in the repo but is empty and unused at runtime. The actual data file is `~/.browser_groups.json`.
- **`fullscreenable: false`**: The native macOS fullscreen (green button) is disabled. Fullscreen only works for HTML5 content inside the webview (YouTube, etc.), expanding within the window bounds.
- **Always-on-top uses `"floating"` level**: `win.setAlwaysOnTop(true, "floating")` is used instead of the default level. On macOS, `"floating"` keeps the window above normal windows but below system dialogs (e.g., Spotlight). This is intentional — a higher level like `"screen-saver"` would be too aggressive.
- **Main→Renderer communication for window state**: When the main process changes window state (e.g., pin toggle), it calls `win.webContents.executeJavaScript()` to invoke a `window.__fn()` exposed by `renderer.js`. This pattern avoids IPC channel setup, which is consistent with the `contextIsolation: false` design. Functions called this way must be guarded with `typeof` checks since the renderer may not have loaded yet.
- **Toast indicator pattern**: `#pin-indicator` is created dynamically by `renderer.js` on first use and reused thereafter. It uses CSS `opacity` transitions and a `setTimeout` to auto-fade. Follow this pattern for any future transient notifications.
