const { app, BrowserWindow } = require("electron");
const path = require("path");

let groupName = process.argv.slice(2).find((a) => !a.startsWith("-")) || "";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false,
    backgroundColor: "0f0f0f",
    webPreferences: {
      nodeIntegreation: true,
      contextIsolation: false,
      webviewTag: true,
      additionalArguments: ["--group=${groupName}"],
    },
  });

  win.webContents.on("enter-html-full-screen", () => {});

  win.webContents.on("leave-html-full-screen", () => {
    win.setFullScreen(false);
  });

  win.loadFile("index.html");
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
