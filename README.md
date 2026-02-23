<div align="center">

# headless-browser

**A minimal, frameless Electron browser with keyboard-driven tab management.**

Open up to 9 independent tabs with a hover-reveal strip, navigate with keyboard shortcuts, and keep your workspace distraction-free. Launch named site groups as session presets, or start bare and browse freely. Session restore coming soon.

[![Electron](https://img.shields.io/badge/Electron-40.6-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

</div>

---

<div align="center">

<!-- Replace the line below with your screenshot -->

![Screenshot](screenshot.png)

</div>

---

## Features

- **Bare mode** -- launch without a group to get a clean browser pointed at Google, no sidebar
- **Search bar popup** -- press `Cmd/Ctrl+L` to open a search overlay; type a URL or search query and hit Enter
- **Frameless window** -- clean, borderless chrome with a transparent drag region
- **Collapsible sidebar** -- quick-switch between sites; collapse to a slim 40px strip
- **Tab management** -- up to 9 independent tabs, each with its own history and session; hover the bottom edge of the window to reveal the tab strip (favicon + title); `Cmd/Ctrl+T` new tab, `Cmd/Ctrl+W` close tab, `Cmd/Ctrl+1-9` / `Cmd/Ctrl+[`/`]` to switch
- **Site groups** -- save named collections of URLs that persist across sessions
- **CLI management** -- create, edit, delete, and view groups from your terminal
- **Dark theme** -- easy on the eyes with a `#0f0f0f` background
- **Fullscreen-in-window** -- webview fullscreen expands within the app window, not your entire display
- **Keyboard shortcuts** -- `Cmd/Ctrl+R` reload, `Cmd/Ctrl+←` back, `Cmd/Ctrl+→` forward, `Cmd/Ctrl+L` search bar, `Cmd/Ctrl+P` pin on top, `Cmd/Ctrl+T` new tab, `Cmd/Ctrl+W` close tab, `Cmd/Ctrl+1-9` switch tab, `Cmd/Ctrl+[`/`]` prev/next tab, `Cmd/Ctrl+0` slate clean
- **Keyboard-number nav** -- sites are numbered for fast identification
- **Persistent sessions** -- cookies, logins, and local storage survive across app restarts
- **Single sign-on** -- sign into Google, GitHub, Microsoft, etc. once and stay logged in
- **Popup filtering** -- ad networks, trackers, and scam popups are blocked automatically; legitimate links open in-place

## Quick Start

```bash
# clone & install
git clone https://github.com/whitemask-1/headless-browser.git
cd headless-browser
npm install

# launch as a standalone browser (bare mode, frees your terminal)
npm run launch

# or create a site group and launch it
python src/manage.py
npm run launch -- <group-name>
```

## Usage

### Launch Modes

| Command | Behavior |
| --- | --- |
| `npm run launch` | Detaches from terminal — your shell stays free |
| `npm run launch -- <group>` | Detached with a site group |
| `npm start` | Attached to terminal (for development/debugging) |
| `npm start -- <group>` | Attached with a site group |

### Bare Mode (No Group)

```bash
npm run launch
```

Opens a frameless window pointed straight at Google with no sidebar. Use `Cmd/Ctrl+L` to open the search bar, type a URL or search term, and press Enter.

### Managing Groups

Run the interactive CLI to create and organize your site groups:

```bash
python src/manage.py
```

```
Groups: none
1) Create/edit group  2) Delete group  3) View group  q) Quit
> 1
Group name: work
Enter URLs one per line, empty line to finish:
  1: https://github.com
  2: https://linear.app
  3: https://notion.so
  4:
Saved group 'work'
```

Groups are stored in `~/.browser_groups.json`.

### Launching a Group

```bash
npm run launch -- work
```

This opens a frameless window with your sites listed in the sidebar. Click any site to load it in the main webview. Hit the toggle button (`‹`) to collapse the sidebar.

### Search Bar

Press **`Cmd+L`** (macOS) or **`Ctrl+L`** (Windows/Linux) at any time to open the search overlay.

- Type a **URL** (e.g. `github.com`) → navigates directly
- Type a **search query** (e.g. `electron docs`) → searches Google
- Press **Enter** to go, **Escape** to dismiss

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Cmd/Ctrl + L` | Open search bar |
| `Cmd/Ctrl + R` | Reload current page |
| `Cmd/Ctrl + T` | Open new tab |
| `Cmd/Ctrl + W` | Close current tab |
| `Cmd/Ctrl + 0` | Slate clean (reset to 1 tab on Google) |
| `Cmd/Ctrl + 1-9` | Switch to tab N |
| `Cmd/Ctrl + [` | Switch to previous tab |
| `Cmd/Ctrl + ]` | Switch to next tab |
| `Cmd/Ctrl + P` | Toggle always-on-top (pin/unpin) |
| `Cmd/Ctrl + ←` | Go back |
| `Cmd/Ctrl + →` | Go forward |
| `Escape` | Close search bar |

## Session Persistence & Sign-In

The webview uses a persistent partition (`persist:main`), so all cookies, local storage, and session data are retained between app restarts. Sign into any account — Google, GitHub, Microsoft, etc. — and you'll stay logged in the next time you launch.

**No profile import is needed.** Just sign in once inside the webview and the session persists.

### Popup & Ad Filtering

Links that would normally open a new browser window (e.g. `target="_blank"`) are intercepted and navigated in-place within the webview. Additionally, popups from known ad networks – including DoubleClick, Taboola, Outbrain, PopAds, and others – are blocked silently. Auth popups (Google sign-in, Microsoft login, etc.) are allowed through so sign-in flows work normally.

## Project Structure

```
headless-browser/
├── main.js          # Electron main process -- window creation, site injection
├── index.html       # UI shell -- sidebar, webview, search overlay, inline styles
├── renderer.js      # Renderer -- sidebar buttons, navigation, search, collapse toggle
├── src/
│   └── manage.py    # Python CLI for CRUD on site groups
├── package.json
└── README.md
```

## How It Works

| Component     | Role                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `main.js`     | Reads `~/.browser_groups.json`, creates a frameless `BrowserWindow`, injects site data, handles in-window fullscreen and keyboard shortcuts |
| `index.html`  | Defines the layout: a fixed transparent drag region, collapsible sidebar, search overlay, and a `<webview>` for browsing        |
| `renderer.js` | Waits for injected site data, dynamically creates sidebar buttons, handles navigation, search bar, and collapse. In bare mode, hides the sidebar and loads Google |
| `manage.py`   | Interactive CLI that reads/writes `~/.browser_groups.json` for group management                                                 |

## Requirements

| Dependency | Version |
| ---------- | ------- |
| Node.js    | 18+     |
| Python     | 3.8+    |
| Electron   | 40.6    |

## Logs

All app output is redirected to a log file to keep your terminal clean. No output will appear in the terminal when the app is running.

```bash
# View logs
cat ~/.headless-browser/app.log

# Tail logs in real time
tail -f ~/.headless-browser/app.log

# Clear logs
> ~/.headless-browser/app.log
```

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to the branch and open a PR

## License

ISC
