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
