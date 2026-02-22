# Tab Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add full tab management (up to 9 tabs, lazy-created, keyboard-driven) with a hover-reveal bottom tab strip showing favicons and titles.

**Architecture:** Each tab is an independent `<webview>` created on demand inside a `#tab-container` div. Only the active tab's webview is visible (`display:block`); others are hidden (`display:none`). Electron's `did-attach-webview` in `main.js` automatically applies all existing event handlers (popup blocking, keyboard shortcuts, fullscreen) to each new webview with no changes needed to that handler. Tab strip is a `position:fixed; bottom:0` horizontal bar that fades in on bottom-edge hover and out on mouseleave.

**Tech Stack:** Electron 40.6, vanilla JS (CommonJS), inline CSS in index.html. No new dependencies.

---

## Reference: Approved Design Doc

`docs/plans/2026-02-22-tab-management-design.md` — read this before starting.

---

## Task 1: Remap pin toggle from Cmd+T to Cmd+P

**Files:**
- Modify: `main.js` (the `wc.on("before-input-event", ...)` handler, ~line 188)

**Context:** `Cmd+T` currently toggles always-on-top (pin). We're freeing `Cmd+T` for new-tab. Pin gets remapped to `Cmd+P`.

**Step 1: Find the Cmd+T block in `main.js`**

It's at approximately line 188–195:
```js
if (meta && input.key === "t") {
  event.preventDefault();
  const pinned = !win.isAlwaysOnTop();
  win.setAlwaysOnTop(pinned, "floating");
  win.webContents.executeJavaScript(
    `if (typeof window.__showPinIndicator === "function") window.__showPinIndicator(${pinned});`
  );
}
```

**Step 2: Change `"t"` to `"p"`**

Replace the block with:
```js
if (meta && input.key === "p") {
  event.preventDefault();
  const pinned = !win.isAlwaysOnTop();
  win.setAlwaysOnTop(pinned, "floating");
  win.webContents.executeJavaScript(
    `if (typeof window.__showPinIndicator === "function") window.__showPinIndicator(${pinned});`
  );
}
```

**Step 3: Manual verification**

```bash
npm start
```
- Press `Cmd+T` — nothing should happen (shortcut now unbound)
- Press `Cmd+P` — pin toast "📌 Pinned on top" appears and fades
- Press `Cmd+P` again — "📌 Unpinned" toast appears

**Step 4: Commit**

```bash
git add main.js
git commit -m "refactor: remap pin toggle from Cmd+T to Cmd+P"
```

---

## Task 2: Add tab container + strip HTML/CSS to index.html

**Files:**
- Modify: `index.html`

**Context:** Replace the single `<webview id="browser">` with a `#tab-container` div (webviews go inside it dynamically). Add `#tab-strip-trigger` (8px hover zone) and `#tab-strip` (the visible bar). All CSS lives in the `<style>` block in `index.html`.

**Step 1: Replace the webview element in the `<body>`**

Find this line (near end of `<body>`, line ~259):
```html
<webview id="browser" allowpopups allowfullscreen partition="persist:main"></webview>
```

Replace with:
```html
<div id="tab-container"></div>
<div id="tab-strip-trigger"></div>
<div id="tab-strip">
  <button id="new-tab-btn">+</button>
</div>
```

**Step 2: Remove the old `#browser` CSS rule**

Find and remove this block in the `<style>` section:
```css
#browser {
  flex: 1;
  height: 100vh;
  position: relative;
  z-index: 15;
}
```

**Step 3: Add new CSS rules**

Add these rules at the end of the `<style>` block, just before `</style>`:

```css
/* Tab container: replaces #browser */
#tab-container {
  flex: 1;
  position: relative;
  height: 100vh;
  z-index: 15;
}

#tab-container webview {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* Hover trigger zone: 8px invisible strip at bottom */
#tab-strip-trigger {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 8px;
  z-index: 1000;
  -webkit-app-region: no-drag;
}

/* Tab strip: hidden by default, revealed on hover */
#tab-strip {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: rgba(15, 15, 15, 0.95);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 2px;
  z-index: 999;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease;
  -webkit-app-region: no-drag;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

#tab-strip.visible {
  opacity: 1;
  pointer-events: all;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 5px;
  cursor: pointer;
  color: #64748b;
  font-size: 11px;
  font-family: Helvetica, sans-serif;
  max-width: 160px;
  min-width: 80px;
  -webkit-app-region: no-drag;
  user-select: none;
  transition: background 0.1s, color 0.1s;
}

.tab-item:hover {
  background: #1e1e1e;
  color: #e2e8f0;
}

.tab-item.active {
  background: #1e1e1e;
  color: #e2e8f0;
  border-bottom: 2px solid #3b82f6;
}

.tab-favicon {
  width: 13px;
  height: 13px;
  flex-shrink: 0;
  border-radius: 2px;
}

.tab-favicon-placeholder {
  font-size: 11px;
  flex-shrink: 0;
}

.tab-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

#new-tab-btn {
  background: none;
  border: none;
  color: #64748b;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  margin-left: auto;
  flex-shrink: 0;
  -webkit-app-region: no-drag;
  font-family: Helvetica, sans-serif;
}

#new-tab-btn:hover {
  color: #e2e8f0;
  background: #1e1e1e;
}

/* Fullscreen: hide strip elements */
body.webview-fullscreen #tab-strip,
body.webview-fullscreen #tab-strip-trigger {
  display: none;
}
```

**Step 4: Update the existing fullscreen webview CSS**

Find this block:
```css
body.webview-fullscreen #browser {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 100;
}
```

Replace with:
```css
body.webview-fullscreen #tab-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 100;
}
```

**Step 5: Manual verification**

```bash
npm start
```
- App launches — no crash, blank area where webview used to be (expected — renderer.js still references old `#browser` id which no longer exists, but app shouldn't crash)
- The layout should still show sidebar on left, blank right area

**Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add tab container and strip DOM structure to index.html"
```

---

## Task 3: Rewrite renderer.js with tab state management

**Files:**
- Modify: `renderer.js` (full rewrite of `init()` + add `window.__showSlateToast`)

**Context:** This is the core tab logic. Key changes:
1. Remove `const browser = document.getElementById("browser")` — no longer exists in DOM
2. Add tab state (`tabs` array, `activeTabId`) scoped inside `init()` — closures handle access
3. Add `getActiveWebview()` early in `init()` so `submitSearch()` can close over it
4. `createTab(id, url)` — creates a `<webview>` element, appends to `#tab-container`, attaches favicon/title/navigate listeners
5. `switchTab(id)` — hide all webviews, show target
6. Expose `window.__switchTab/newTab/closeTab/slateClean/prevTab/nextTab` for main.js to call
7. Tab strip hover logic using a small timeout to prevent flicker
8. Sidebar buttons now navigate the active webview (not a fixed `browser` var)
9. Search bar now navigates the active webview

**Step 1: Replace the full contents of `renderer.js` with:**

```js
function init() {
  const sites = window.__sites__ || {};
  const bare = window.__bare__ || false;
  const buttonsContainer = document.getElementById("buttons");
  const toggle = document.getElementById("toggle");
  const sidebar = document.getElementById("sidebar");
  const tabContainer = document.getElementById("tab-container");
  const tabStrip = document.getElementById("tab-strip");
  const tabStripTrigger = document.getElementById("tab-strip-trigger");
  const newTabBtn = document.getElementById("new-tab-btn");
  const searchOverlay = document.getElementById("search-overlay");
  const searchInput = document.getElementById("search-input");
  const searchGo = document.getElementById("search-go");

  // --- Tab state (defined early so submitSearch can close over getActiveWebview) ---
  let tabs = [];
  let activeTabId = null;

  function getActiveWebview() {
    const tab = tabs.find(t => t.id === activeTabId);
    return tab ? tab.webview : null;
  }

  function createTab(id, url) {
    if (tabs.find(t => t.id === id)) return;
    const wv = document.createElement("webview");
    wv.id = `tab-wv-${id}`;
    wv.setAttribute("allowpopups", "");
    wv.setAttribute("allowfullscreen", "");
    wv.setAttribute("partition", "persist:main");
    wv.style.display = "none";
    tabContainer.appendChild(wv);

    const tab = { id, url: url || "https://www.google.com", title: "New Tab", favicon: null, webview: wv };
    tabs.push(tab);

    wv.addEventListener("page-favicon-updated", (e) => {
      tab.favicon = e.favicons[0] || null;
      renderTabStrip();
    });
    wv.addEventListener("page-title-updated", (e) => {
      tab.title = e.title;
      renderTabStrip();
    });
    wv.addEventListener("did-navigate", (e) => {
      tab.url = e.url;
    });
    wv.addEventListener("did-navigate-in-page", (e) => {
      tab.url = e.url;
    });

    wv.src = tab.url;
    return tab;
  }

  function switchTab(id) {
    if (id < 1 || id > 9) return;
    if (!tabs.find(t => t.id === id)) {
      if (tabs.length >= 9) return;
      createTab(id, null);
    }
    tabs.forEach(t => { t.webview.style.display = "none"; });
    const tab = tabs.find(t => t.id === id);
    if (tab) {
      tab.webview.style.display = "block";
      activeTabId = id;
      renderTabStrip();
    }
  }

  function newTab() {
    const existingIds = tabs.map(t => t.id);
    for (let i = 1; i <= 9; i++) {
      if (!existingIds.includes(i)) {
        createTab(i, null);
        switchTab(i);
        return;
      }
    }
    // All 9 slots full — focus the last tab
    switchTab(tabs[tabs.length - 1].id);
  }

  function closeTab() {
    if (tabs.length <= 1) return;
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;
    tab.webview.remove();
    const closedId = activeTabId;
    tabs = tabs.filter(t => t.id !== closedId);
    activeTabId = null;
    // Switch to the tab that was visually to the left, or first available
    const sorted = [...tabs].sort((a, b) => a.id - b.id);
    const fallback = sorted.findLast(t => t.id < closedId) || sorted[0];
    switchTab(fallback.id);
  }

  function slateClean() {
    tabs.forEach(t => t.webview.remove());
    tabs = [];
    activeTabId = null;
    createTab(1, "https://www.google.com");
    switchTab(1);
    window.__showSlateToast();
  }

  function prevTab() {
    const sorted = [...tabs].sort((a, b) => a.id - b.id);
    const idx = sorted.findIndex(t => t.id === activeTabId);
    const prev = sorted[(idx - 1 + sorted.length) % sorted.length];
    switchTab(prev.id);
  }

  function nextTab() {
    const sorted = [...tabs].sort((a, b) => a.id - b.id);
    const idx = sorted.findIndex(t => t.id === activeTabId);
    const next = sorted[(idx + 1) % sorted.length];
    switchTab(next.id);
  }

  function renderTabStrip() {
    tabStrip.querySelectorAll(".tab-item").forEach(el => el.remove());
    const sorted = [...tabs].sort((a, b) => a.id - b.id);
    sorted.forEach(tab => {
      const item = document.createElement("div");
      item.className = "tab-item" + (tab.id === activeTabId ? " active" : "");
      item.dataset.id = tab.id;

      if (tab.favicon) {
        const img = document.createElement("img");
        img.className = "tab-favicon";
        img.src = tab.favicon;
        img.onerror = () => { img.style.display = "none"; };
        item.appendChild(img);
      } else {
        const globe = document.createElement("span");
        globe.className = "tab-favicon-placeholder";
        globe.textContent = "\uD83C\uDF10";
        item.appendChild(globe);
      }

      const titleSpan = document.createElement("span");
      titleSpan.className = "tab-title";
      titleSpan.textContent = tab.title || "New Tab";
      item.appendChild(titleSpan);

      item.addEventListener("click", () => switchTab(tab.id));
      tabStrip.insertBefore(item, newTabBtn);
    });
  }

  // --- Tab strip hover (with timeout to prevent flicker) ---
  let stripHideTimeout;
  tabStripTrigger.addEventListener("mouseenter", () => {
    clearTimeout(stripHideTimeout);
    tabStrip.classList.add("visible");
  });
  tabStripTrigger.addEventListener("mouseleave", () => {
    stripHideTimeout = setTimeout(() => tabStrip.classList.remove("visible"), 120);
  });
  tabStrip.addEventListener("mouseenter", () => {
    clearTimeout(stripHideTimeout);
  });
  tabStrip.addEventListener("mouseleave", () => {
    stripHideTimeout = setTimeout(() => tabStrip.classList.remove("visible"), 120);
  });
  newTabBtn.addEventListener("click", newTab);

  // --- Expose to main process ---
  window.__switchTab = switchTab;
  window.__newTab = newTab;
  window.__closeTab = closeTab;
  window.__slateClean = slateClean;
  window.__prevTab = prevTab;
  window.__nextTab = nextTab;

  // --- Search bar logic ---
  function toUrl(query) {
    query = query.trim();
    if (!query) return null;
    if (/^https?:\/\//i.test(query) || /^[a-z0-9-]+(\.[a-z]{2,})/i.test(query)) {
      return query.startsWith("http") ? query : "https://" + query;
    }
    return "https://www.google.com/search?q=" + encodeURIComponent(query);
  }

  function submitSearch() {
    const url = toUrl(searchInput.value);
    if (url) {
      const wv = getActiveWebview();
      if (wv) wv.src = url;
      hideSearch();
    }
  }

  function showSearch() {
    searchOverlay.classList.add("visible");
    searchInput.value = "";
    searchInput.focus();
  }

  function hideSearch() {
    searchOverlay.classList.remove("visible");
    searchInput.blur();
  }

  window.__toggleSearchBar = function () {
    if (searchOverlay.classList.contains("visible")) {
      hideSearch();
    } else {
      showSearch();
    }
  };

  searchGo.addEventListener("click", submitSearch);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitSearch();
    if (e.key === "Escape") hideSearch();
  });
  searchOverlay.addEventListener("click", (e) => {
    if (e.target === searchOverlay) hideSearch();
  });

  // --- Initialize tab 1 ---
  const initialUrl = bare
    ? "https://www.google.com"
    : (Object.values(sites)[0] || "https://www.google.com");
  createTab(1, initialUrl);
  switchTab(1);

  // --- Bare mode: skip sidebar setup ---
  if (bare) {
    document.body.classList.add("bare-mode");
    return;
  }

  // --- Sidebar buttons ---
  Object.entries(sites).forEach(([key, url]) => {
    const label = url.replace("https://", "").replace("www.", "").split("/")[0];
    const btn = document.createElement("button");
    btn.className = "site-btn";
    btn.innerHTML = `<span class="num">${key}</span><span>${label}</span>`;
    btn.addEventListener("click", () => {
      const wv = getActiveWebview();
      if (wv) wv.src = url;
    });
    buttonsContainer.appendChild(btn);
  });

  let collapsed = false;
  toggle.addEventListener("click", () => {
    collapsed = !collapsed;
    sidebar.classList.toggle("collapsed", collapsed);
    toggle.textContent = collapsed ? "›" : "‹";
  });
}

window.__showPinIndicator = function (pinned) {
  let indicator = document.getElementById("pin-indicator");
  if (!indicator) {
    indicator = document.createElement("div");
    indicator.id = "pin-indicator";
    document.body.appendChild(indicator);
  }
  indicator.textContent = pinned ? "\uD83D\uDCCC Pinned on top" : "\uD83D\uDCCC Unpinned";
  indicator.style.opacity = "1";
  clearTimeout(window.__pinTimeout);
  window.__pinTimeout = setTimeout(() => {
    indicator.style.opacity = "0";
  }, 1500);
};

window.__showCopyToast = function () {
  let toast = document.getElementById("copy-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "copy-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = "Link copied to clipboard";
  toast.style.opacity = "1";
  clearTimeout(window.__copyTimeout);
  window.__copyTimeout = setTimeout(() => {
    toast.style.opacity = "0";
  }, 1000);
};

window.__showSlateToast = function () {
  let toast = document.getElementById("slate-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "slate-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = "Slate cleaned";
  toast.style.opacity = "1";
  clearTimeout(window.__slateTimeout);
  window.__slateTimeout = setTimeout(() => {
    toast.style.opacity = "0";
  }, 1200);
};

// --- Cmd+drag to move window ---
window.addEventListener("keydown", (e) => {
  if (e.key === "Meta") document.body.classList.add("cmd-drag");
});
window.addEventListener("keyup", (e) => {
  if (e.key === "Meta") document.body.classList.remove("cmd-drag");
});
window.addEventListener("blur", () => {
  document.body.classList.remove("cmd-drag");
});

const waitForSites = setInterval(() => {
  if (window.__sites__ !== undefined) {
    clearInterval(waitForSites);
    init();
  }
}, 50);
```

**Step 2: Add `#slate-toast` CSS to index.html**

Add this rule in the `<style>` block (copy the `#copy-toast` rule and adjust the id):

```css
#slate-toast {
  position: fixed;
  bottom: 56px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 30, 30, 0.9);
  color: #fff;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  z-index: 99999;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}
```

Note: `bottom: 56px` puts it above the tab strip (40px) with a gap.

**Step 3: Manual verification**

```bash
npm start
```

Verify bare mode:
- App loads, Google opens in tab 1
- Hover bottom edge → tab strip appears with 1 tab (🌐 New Tab, then Google favicon loads)
- Move mouse away → strip fades out
- `Cmd+L` → search bar opens, navigate to a site — works
- `Cmd+R` → page reloads

```bash
npm start -- <any-group-name>
```

Verify group mode:
- Tab 1 loads the first site from the group
- Sidebar buttons load URLs into the active tab (not a new window)

**Step 4: Commit**

```bash
git add renderer.js index.html
git commit -m "feat: implement tab state and management in renderer"
```

---

## Task 4: Add tab hotkeys to main.js

**Files:**
- Modify: `main.js` — the `wc.on("before-input-event", ...)` handler

**Context:** Add six new shortcut blocks inside the existing `before-input-event` handler. All follow the same pattern: `event.preventDefault()` then `win.webContents.executeJavaScript(...)`.

**Step 1: Locate the handler in main.js**

The handler starts at ~line 146:
```js
wc.on("before-input-event", (event, input) => {
```

It ends at ~line 196 (closing `});`). Add all new blocks inside this handler, after the existing shortcuts.

**Step 2: Replace the full `before-input-event` handler with this version:**

```js
wc.on("before-input-event", (event, input) => {
  if (input.key === "Meta") {
    const action = input.type === "keyDown" ? "add" : "remove";
    win.webContents.executeJavaScript(
      `document.body.classList.${action}('cmd-drag')`
    );
  }

  const meta = process.platform === "darwin" ? input.meta : input.control;

  if (meta && input.key === "r") {
    wc.reload();
    event.preventDefault();
  }

  if (meta && input.key === "ArrowLeft") {
    wc.navigationHistory.goBack();
    event.preventDefault();
  }

  if (meta && input.key === "ArrowRight") {
    wc.navigationHistory.goForward();
    event.preventDefault();
  }

  if (meta && input.key === "l") {
    win.webContents.executeJavaScript(`window.__toggleSearchBar()`);
    event.preventDefault();
  }

  // Cmd/Ctrl+Shift+C: Copy current URL to clipboard
  if (meta && input.shift && input.key === "c") {
    event.preventDefault();
    const url = wc.getURL();
    if (url) {
      clipboard.writeText(url);
      win.webContents.executeJavaScript(
        `if (typeof window.__showCopyToast === "function") window.__showCopyToast();`
      );
    }
  }

  // Cmd/Ctrl+P: Toggle always-on-top pin
  if (meta && input.key === "p") {
    event.preventDefault();
    const pinned = !win.isAlwaysOnTop();
    win.setAlwaysOnTop(pinned, "floating");
    win.webContents.executeJavaScript(
      `if (typeof window.__showPinIndicator === "function") window.__showPinIndicator(${pinned});`
    );
  }

  // Cmd/Ctrl+T: New tab
  if (meta && input.key === "t") {
    event.preventDefault();
    win.webContents.executeJavaScript(
      `if (typeof window.__newTab === "function") window.__newTab();`
    );
  }

  // Cmd/Ctrl+W: Close current tab
  if (meta && input.key === "w") {
    event.preventDefault();
    win.webContents.executeJavaScript(
      `if (typeof window.__closeTab === "function") window.__closeTab();`
    );
  }

  // Cmd/Ctrl+0: Slate clean (reset all tabs)
  if (meta && input.key === "0") {
    event.preventDefault();
    win.webContents.executeJavaScript(
      `if (typeof window.__slateClean === "function") window.__slateClean();`
    );
  }

  // Cmd/Ctrl+[: Previous tab
  if (meta && input.key === "[") {
    event.preventDefault();
    win.webContents.executeJavaScript(
      `if (typeof window.__prevTab === "function") window.__prevTab();`
    );
  }

  // Cmd/Ctrl+]: Next tab
  if (meta && input.key === "]") {
    event.preventDefault();
    win.webContents.executeJavaScript(
      `if (typeof window.__nextTab === "function") window.__nextTab();`
    );
  }

  // Cmd/Ctrl+1-9: Switch to tab N
  if (meta && input.key >= "1" && input.key <= "9") {
    event.preventDefault();
    const n = parseInt(input.key, 10);
    win.webContents.executeJavaScript(
      `if (typeof window.__switchTab === "function") window.__switchTab(${n});`
    );
  }
});
```

**Step 3: Manual verification**

```bash
npm start
```

Tab hotkeys:
- `Cmd+T` → new tab opens, tab strip shows 2 tabs (second tab shows 🌐 New Tab)
- `Cmd+1` → switch to tab 1 (strip shows tab 1 active)
- `Cmd+2` → switch to tab 2 (already exists)
- `Cmd+3` → creates tab 3 (new Google tab)
- `Cmd+[` / `Cmd+]` → cycles through tabs
- `Cmd+W` → closes active tab, switches to prior tab
- `Cmd+W` on last tab → nothing happens (last tab protected)
- `Cmd+0` → "Slate cleaned" toast, all tabs reset to 1 tab on Google
- `Cmd+P` → pin toast still works

**Step 4: Commit**

```bash
git add main.js
git commit -m "feat: add tab hotkeys (Cmd+T/W/0/1-9/[/]) to main process"
```

---

## Task 5: Update AGENTS.md with new keyboard shortcuts

**Files:**
- Modify: `AGENTS.md`

**Step 1: Update the keyboard shortcuts table in the "Manual Test Checklist" section**

Find item 2 in the checklist:
```
- Keyboard shortcuts work: `Cmd/Ctrl+R` (reload), `Cmd/Ctrl+←/→` (back/forward), `Cmd/Ctrl+L` (search), `Cmd/Ctrl+T` (pin on top)
```

Replace with:
```
- Keyboard shortcuts work: `Cmd/Ctrl+R` (reload), `Cmd/Ctrl+←/→` (back/forward), `Cmd/Ctrl+L` (search), `Cmd/Ctrl+P` (pin on top)
```

**Step 2: Update item 5 (always-on-top)**

Find:
```
5. **Always-on-top (pin)** — Press `Cmd/Ctrl+T`. Confirm:
```

Replace with:
```
5. **Always-on-top (pin)** — Press `Cmd/Ctrl+P`. Confirm:
```

**Step 3: Update the "Adding a New Keyboard Shortcut" section**

Find:
```
The `Cmd/Ctrl+T` always-on-top toggle is a good reference
```

Replace with:
```
The `Cmd/Ctrl+P` always-on-top toggle is a good reference
```

**Step 4: Add a tab management test item to the checklist**

After item 5 (always-on-top), add:

```markdown
6. **Tab management** — Run `npm start`. Confirm:
   - `Cmd/Ctrl+T` opens a new tab (tab strip appears at bottom on hover with 2 tabs)
   - `Cmd/Ctrl+1` / `Cmd/Ctrl+2` switches between tabs
   - Each tab maintains independent navigation history
   - `Cmd/Ctrl+[` / `Cmd/Ctrl+]` cycles through tabs
   - `Cmd/Ctrl+W` closes the active tab (strip updates)
   - `Cmd/Ctrl+W` on the last tab does nothing
   - `Cmd/Ctrl+0` resets all tabs to 1 tab on google.com with "Slate cleaned" toast
   - Hovering the bottom edge reveals the tab strip; moving away hides it
   - Tab strip shows website favicon and truncated title for each tab
   - `Cmd/Ctrl+L` search navigates the active tab
   - Sidebar site buttons (in group mode) navigate the active tab
```

**Step 5: Update the "Common Tasks" shortcut reference**

Find the `Cmd/Ctrl+T` reference in the "Adding a New Keyboard Shortcut" section and update to `Cmd/Ctrl+P`.

**Step 6: Commit**

```bash
git add AGENTS.md
git commit -m "docs: update AGENTS.md with tab management shortcuts and test checklist"
```

---

## Final Manual Smoke Test

Run through AGENTS.md manual test checklist items 1–6 in full. Pay attention to:

1. Bare mode still works (single tab, Google, no sidebar)
2. Group mode still works (sidebar buttons navigate active tab)
3. HTML5 fullscreen hides both sidebar and tab strip
4. Tab favicons load correctly after navigation (Google, GitHub, etc.)
5. Slate clean resets properly and shows toast above the tab strip
6. `Cmd+P` pin toggle still works

---

## Summary of All Changes

| File | Change |
|---|---|
| `main.js` | Remap pin to `Cmd+P`; add `Cmd+T/W/0/1-9/[/]` tab hotkeys |
| `index.html` | Replace `<webview>` with `#tab-container`; add `#tab-strip-trigger`, `#tab-strip`; add all tab CSS |
| `renderer.js` | Full rewrite of `init()` with tab state; add `window.__showSlateToast` |
| `AGENTS.md` | Update shortcut references; add tab management test checklist item |
