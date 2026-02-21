const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { webContents } = require("electron/main");

const groupName = process.argv.slice(2).find((a) => !a.startsWith("-")) || "";
const dataFile = path.join(os.homedir(), ".browser_groups.json");
const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
const sites = data[groupName] || {};

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    backgroundColor: "0f0f0f",
    webPreferences: {
      nodeIntegreation: false,
      contextIsolation: false,
      webviewTag: true,
    },
  });
  win.webContents.openDevTools();
  win.webContents.on("did-finish-load", () => {
    win.webContents.executeJavaScript(
      `window.__sites__ = ${JSON.stringify(sites)}`,
    );
  });
  win.webContents.on("enter-html-full-screen", () => {
    win.setFullScreen(false);
  });

  win.webContents.on("did-attach-webview", (event, webContents) => {
    webContents.on("enter-html-full-screen", () => {
      webContents.executeJavaScript(`
      document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
          document.fullscreenElement.style.width = '100%';
          document.fullscreenElement.style.height = '100%';
          document.fullscreenElement.style.position = 'absolute';
        }
      })
    `);
      win.setFullScreen(false);
    });
  });

  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
