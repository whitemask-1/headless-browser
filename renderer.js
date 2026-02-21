function init() {
  const sites = window.__sites__ || {};
  const browser = document.getElementById("browser");
  const buttonsContainer = document.getElementById("buttons");
  const toggle = document.getElementById("toggle");
  const sidebar = document.getElementById("sidebar");

  console.log("sites:", sites);

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
  if (window.__sites__) {
    clearInterval(waitForSites);
    init();
  }
}, 50);
