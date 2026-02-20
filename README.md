# headless-browser

A frameless browser launcher with site group management. Launch curated sets of websites from the command line, switch between them using a floating control panel, and keep your terminal free.

## Features

- Frameless Chrome window via pywebview
- Save named groups of sites that persist across sessions
- Floating always-on-top control panel to switch sites without touching the terminal
- Manage groups interactively via CLI

## Requirements

- Python 3.8+
- Homebrew (Mac)
- tkinter (included with most Python installs)

## Setup

```bash
# clone the repo
git clone https://github.com/yourusername/headless-browser.git
cd headless-browser

# create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate

# install dependencies
pip install -r requirements.txt
```

### Optional: shell aliases

Add these to your `.zshrc` for quick access from anywhere:

```bash
alias browser="python ~/headless-browser/src/browser.py"
alias browser-manage="python ~/headless-browser/src/manage.py"
```

Then reload:
```bash
source ~/.zshrc
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
python src/browser.py work
```

Or with the alias:
```bash
browser work
```

This opens a frameless browser window and a small control panel. Use the control panel buttons to switch between sites in the group.

## Project Structure

```
headless-browser/
├── src/
│   ├── browser.py      # launches the browser and control panel
│   └── manage.py       # CLI for managing site groups
├── requirements.txt
├── .gitignore
└── README.md
```

## Data Storage

Site groups are stored in `~/.browser_groups.json` on your machine and are not tracked by git.
