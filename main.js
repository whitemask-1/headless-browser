const { app, BrowserWindow, globalShortcut } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

const groupName = process.argv.slice(2).find((a) => !a.startsWith("-")) || "";
const dataFile = path.join(os.homedir(), ".browser_groups.json");
const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
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
  win.webContents.on("did-finish-load", () => {
    win.webContents.executeJavaScript(
      `window.__sites__ = ${JSON.stringify(sites)}`,
    );
  });
  win.webContents.on("did-attach-webview", (event, wc) => {
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

    // Keyboard shortcuts on the webview (where focus usually is)
    wc.on("before-input-event", (event, input) => {
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
    });
  });

  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
