const { app, BrowserWindow, globalShortcut } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

// --- Redirect all output to log file to keep terminal clean ---
const logDir = path.join(os.homedir(), ".headless-browser");
try { fs.mkdirSync(logDir, { recursive: true }); } catch {}
const logStream = fs.createWriteStream(path.join(logDir, "app.log"), { flags: "a" });
process.stdout.write = logStream.write.bind(logStream);
process.stderr.write = logStream.write.bind(logStream);
console.log = (...args) => logStream.write(args.join(" ") + "\n");
console.error = (...args) => logStream.write("[ERROR] " + args.join(" ") + "\n");
console.warn = (...args) => logStream.write("[WARN] " + args.join(" ") + "\n");

const groupName = process.argv.slice(2).find((a) => !a.startsWith("-")) || "";
const dataFile = path.join(os.homedir(), ".browser_groups.json");
let data = {};
try {
  data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
} catch {}
const sites = data[groupName] || {};

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    fullscreenable: false,
    backgroundColor: "0f0f0f",
    webPreferences: {
      nodeIntegreation: false,
      contextIsolation: false,
      webviewTag: true,
    },
  });
  const isBare = !groupName || Object.keys(sites).length === 0;
  win.webContents.on("did-finish-load", () => {
    win.webContents.executeJavaScript(
      `window.__sites__ = ${JSON.stringify(sites)}; window.__bare__ = ${isBare}; window.__group__ = ${JSON.stringify(groupName)};`,
    );
  });
  win.webContents.on("did-attach-webview", (event, wc) => {
    // Suppress webview console output
    wc.on("console-message", (e) => e.preventDefault());

    // Block ad / tracker / scam popups, navigate legit links in-place
    const blockedDomains = [
      "doubleclick.net",
      "googlesyndication.com",
      "googleadservices.com",
      "adservice.google.com",
      "amazon-adsystem.com",
      "facebook.com/tr",
      "ad.atdmt.com",
      "adnxs.com",
      "adsrvr.org",
      "outbrain.com",
      "taboola.com",
      "popads.net",
      "popcash.net",
      "propellerads.com",
      "trafficjunky.com",
      "exoclick.com",
      "juicyads.com",
      "clickadu.com",
      "admaven.com",
      "revcontent.com",
      "mgid.com",
      "zergnet.com",
      "content.ad",
      "adsterra.com",
      "hilltopads.net",
      "richpush.co",
    ];

    const blockedPatterns = [
      /\/ads\//i,
      /\/ad\//i,
      /[?&]ad_/i,
      /[?&]utm_/i,
      /click(\.|id|tracker|serve)/i,
      /tracker\./i,
      /redirect.*click/i,
      /popup/i,
    ];

    function isBlockedUrl(url) {
      try {
        const hostname = new URL(url).hostname;
        if (blockedDomains.some((d) => hostname === d || hostname.endsWith("." + d))) {
          return true;
        }
        if (blockedPatterns.some((re) => re.test(url))) {
          return true;
        }
      } catch {
        return true; // malformed URLs are suspicious
      }
      return false;
    }

    wc.setWindowOpenHandler(({ url, disposition }) => {
      // Always allow auth popups (sign-in flows)
      try {
        const hostname = new URL(url).hostname;
        if (
          hostname.includes("accounts.google.com") ||
          hostname.includes("login.microsoftonline.com") ||
          hostname.includes("appleid.apple.com") ||
          hostname.includes("github.com/login") ||
          hostname.includes("auth")
        ) {
          return { action: "allow" };
        }
      } catch {}

      // Block known ad/tracker/scam URLs entirely
      if (isBlockedUrl(url)) {
        return { action: "deny" };
      }

      // Programmatic window.open() from unknown sources — block
      if (disposition === "new-window") {
        return { action: "deny" };
      }

      // User-initiated clicks (foreground-tab, background-tab) — navigate in-place
      wc.loadURL(url);
      return { action: "deny" };
    });

    wc.on("enter-html-full-screen", () => {
      win.webContents.executeJavaScript(
        `document.body.classList.add('webview-fullscreen')`,
      );
    });

    wc.on("leave-html-full-screen", () => {
      win.webContents.executeJavaScript(
        `document.body.classList.remove('webview-fullscreen')`,
      );
    });

    // Forward Meta key state for Cmd+drag window moving
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

      if (meta && input.key === "t") {
        event.preventDefault();
        const pinned = !win.isAlwaysOnTop();
        win.setAlwaysOnTop(pinned, "floating");
        win.webContents.executeJavaScript(
          `if (typeof window.__showPinIndicator === "function") window.__showPinIndicator(${pinned});`
        );
      }
    });
  });

  // Clean up cmd-drag state when window loses focus
  win.on("blur", () => {
    win.webContents.executeJavaScript(
      `document.body.classList.remove('cmd-drag')`
    );
  });

  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
