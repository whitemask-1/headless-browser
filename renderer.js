function init() {
  const sites = window.__sites__ || {};
  const bare = window.__bare__ || false;
  const browser = document.getElementById("browser");
  const buttonsContainer = document.getElementById("buttons");
  const toggle = document.getElementById("toggle");
  const sidebar = document.getElementById("sidebar");
  const searchOverlay = document.getElementById("search-overlay");
  const searchInput = document.getElementById("search-input");
  const searchGo = document.getElementById("search-go");

  // --- Search bar logic ---
  function toUrl(query) {
    query = query.trim();
    if (!query) return null;
    // If it looks like a URL, navigate directly
    if (/^https?:\/\//i.test(query) || /^[a-z0-9-]+(\.[a-z]{2,})/i.test(query)) {
      return query.startsWith("http") ? query : "https://" + query;
    }
    // Otherwise Google search
    return "https://www.google.com/search?q=" + encodeURIComponent(query);
  }

  function submitSearch() {
    const url = toUrl(searchInput.value);
    if (url) {
      browser.src = url;
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

  // --- Bare browser mode (no group) ---
  if (bare) {
    document.body.classList.add("bare-mode");
    browser.src = "https://www.google.com";
    return;
  }

  // --- Normal site-group mode ---
  Object.entries(sites).forEach(([key, url]) => {
    const label = url.replace("https://", "").replace("www.", "").split("/")[0];
    const btn = document.createElement("button");
    btn.className = "site-btn";
    btn.innerHTML = `<span class="num">${key}</span><span>${label}</span>`;
    btn.addEventListener("click", () => {
      browser.src = url;
    });
    buttonsContainer.appendChild(btn);
  });

  if (Object.values(sites)[0]) browser.src = Object.values(sites)[0];

  let collapsed = false;
  toggle.addEventListener("click", () => {
    collapsed = !collapsed;
    sidebar.classList.toggle("collapsed", collapsed);
    toggle.textContent = collapsed ? "›" : "‹";
  });
}

const waitForSites = setInterval(() => {
  if (window.__sites__ !== undefined) {
    clearInterval(waitForSites);
    init();
  }
}, 50);
