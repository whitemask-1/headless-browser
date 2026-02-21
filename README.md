<div align="center">

# headless-browser

**A minimal, frameless Electron browser with site group management.**

Launch curated sets of websites from the command line, switch between them with a collapsible sidebar, and keep your workspace distraction-free.

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

- **Frameless window** -- clean, borderless chrome with a transparent drag region
- **Collapsible sidebar** -- quick-switch between sites; collapse to a slim 40px strip
- **Site groups** -- save named collections of URLs that persist across sessions
- **CLI management** -- create, edit, delete, and view groups from your terminal
- **Dark theme** -- easy on the eyes with a `#0f0f0f` background
- **Fullscreen-in-window** -- webview fullscreen expands within the app window, not your entire display
- **Keyboard shortcuts** -- `Cmd/Ctrl+R` reload, `Cmd/Ctrl+Left` back, `Cmd/Ctrl+Right` forward
- **Keyboard-number nav** -- sites are numbered for fast identification

## Quick Start

```bash
# clone & install
git clone https://github.com/whitemask-1/headless-browser.git
cd headless-browser
npm install

# create a site group
python src/manage.py

# launch it
npm start -- <group-name>
```

## Usage

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
npm start -- work
```

This opens a frameless window with your sites listed in the sidebar. Click any site to load it in the main webview. Hit the toggle button (`‹`) to collapse the sidebar.

## Project Structure

```
headless-browser/
├── main.js          # Electron main process -- window creation, site injection
├── index.html       # UI shell -- sidebar, webview, inline styles
├── renderer.js      # Renderer -- sidebar buttons, navigation, collapse toggle
├── src/
│   └── manage.py    # Python CLI for CRUD on site groups
├── package.json
└── README.md
```

## How It Works

| Component     | Role                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `main.js`     | Reads `~/.browser_groups.json`, creates a frameless `BrowserWindow`, injects site data, handles in-window fullscreen and keyboard shortcuts |
| `index.html`  | Defines the layout: a fixed transparent drag region, collapsible sidebar, and a `<webview>` for browsing                        |
| `renderer.js` | Waits for injected site data, dynamically creates sidebar buttons, handles navigation and collapse                              |
| `manage.py`   | Interactive CLI that reads/writes `~/.browser_groups.json` for group management                                                 |

## Requirements

| Dependency | Version |
| ---------- | ------- |
| Node.js    | 18+     |
| Python     | 3.8+    |
| Electron   | 40.6    |

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to the branch and open a PR

## License

ISC
