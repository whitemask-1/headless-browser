# headless-browser

A frameless Electron browser with an embedded sidebar for site group management. Launch curated sets of websites from the command line, switch between them using an in-window sidebar, and keep your terminal free.

## Features

- Frameless Electron window with dark theme
- Collapsible sidebar to switch between sites in a group
- Save named groups of sites that persist across sessions
- Manage groups interactively via CLI
- Fullscreen-in-window support for embedded webviews
- Draggable title region for frameless window movement

## Requirements

- Node.js
- Python 3.8+ (for the group management CLI)

## Setup

```bash
git clone https://github.com/yourusername/headless-browser.git
cd headless-browser
npm install
```

## Usage

### 1. Create a site group

```bash
python src/manage.py
```

Follow the prompts to create a named group of URLs. Groups are saved to `~/.browser_groups.json`.

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

### 2. Launch a group

```bash
npm start -- work
```

This opens a frameless browser window with a sidebar listing each site. Click a site to load it in the main webview. The sidebar can be collapsed with the toggle button.

## Project Structure

```
headless-browser/
├── main.js          # Electron main process — creates the window, injects site data
├── index.html       # UI shell — sidebar, webview, styles
├── renderer.js      # Renderer script — populates sidebar buttons, handles navigation
├── sites.json       # (unused) placeholder for local site data
├── src/
│   └── manage.py    # Python CLI for managing site groups
├── package.json
└── .gitignore
```

## Data Storage

Site groups are stored in `~/.browser_groups.json` and are not tracked by git.
