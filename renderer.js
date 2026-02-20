const fs = require("fs");
const os = require("os");
const path = require("path");

const DATA_FILE = path.join(os.homedir(), ".browser_groups.json");

// get group name from command line args
const args = process.argv.slice(2);
const groupName =
  process.argv.find((a) => a.startsWith("--group="))?.split("=")[1] || "";

function loadGroup(name) {
  if (!fs.existsSync(DATA_FILE)) {
    console.error("No groups saved. Run manage.py first.");
    return {};
  }
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  if (!data[name]) {
    console.error(
      `Group '${name}' not found. Available: ${Object.keys(data).join(", ")}`,
    );
    return {};
  }
  return data[name];
}

const sites = loadGroup(groupName);
const browser = document.getElementById("browser");
const buttonsContainer = document.getElementById("buttons");
const toggle = document.getElementById("toggle");
const sidebar = document.getElementById("sidebar");

// build site buttons
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

// set initial url
const firstUrl = Object.values(sites)[0];
if (firstUrl) browser.src = firstUrl;

// toggle sidebar
let collapsed = false;
toggle.addEventListener("click", () => {
  collapsed = !collapsed;
  sidebar.classList.toggle("collapsed", collapsed);
  toggle.textContent = collapsed ? "›" : "‹";
});
